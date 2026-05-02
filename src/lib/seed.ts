import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function generateHash() {
  return Array.from({ length: 16 }, () =>
    '0123456789abcdef'[Math.floor(Math.random() * 16)]
  ).join('')
}

export async function seedDummyData(adminUserId: string) {
  // Ensure admin role
  await supabase.from('profiles').update({ role: 'admin' }).eq('id', adminUserId)

  const now = new Date()

  // 1. Patients (25)
  const patientsData = Array.from({ length: 25 }, (_, i) => ({
    anonymous_hash: generateHash(),
    age: randomInt(20, 70),
    gender: randomChoice(['Kadın', 'Erkek', null]),
    notes: randomChoice([
      'Yüz bölgesinde kızarıklık şikayeti',
      'Göz çevresi kaşıntısı',
      'Dermatolojiye sevk edildi',
      'Önceki tedavi cevap vermedi',
      'Ailede benzer şikayetler var',
      null,
      null,
    ]),
    created_by: adminUserId,
    created_at: new Date(now.getTime() - randomInt(0, 90) * 86400000).toISOString(),
  }))

  const { data: patients, error: pErr } = await supabase
    .from('patients')
    .insert(patientsData)
    .select('id, anonymous_hash')

  if (pErr) throw new Error(`Patients insert failed: ${pErr.message}`)

  // 2. Analyses (50)
  const statuses = ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']
  const statusWeights = [0.25, 0.15, 0.45, 0.15]

  const analysesData = Array.from({ length: 50 }, (_, i) => {
    const rand = Math.random()
    let status = 'PENDING'
    let cum = 0
    for (let j = 0; j < statuses.length; j++) {
      cum += statusWeights[j]
      if (rand < cum) {
        status = statuses[j]
        break
      }
    }

    const patient = randomChoice(patients!)

    return {
      patient_id: patient.id,
      image_url: `https://picsum.photos/seed/${patient.anonymous_hash}-${i}/400/400`,
      status,
      progress: status === 'COMPLETED' ? 100 : status === 'FAILED' ? randomInt(30, 80) : randomInt(0, 60),
      created_by: adminUserId,
      created_at: new Date(now.getTime() - randomInt(0, 60) * 86400000).toISOString(),
    }
  })

  const { data: analyses, error: aErr } = await supabase
    .from('analyses')
    .insert(analysesData)
    .select('id, status, patient_id')

  if (aErr) throw new Error(`Analyses insert failed: ${aErr.message}`)

  // 3. Clinical Forms (50)
  const clinicalFormsData = analyses!.map((a) => ({
    analysis_id: a.id,
    age: randomInt(20, 70),
    gender: randomChoice(['Kadın', 'Erkek', null]),
    symptom_duration_days: randomInt(1, 180),
    itching_severity: randomInt(0, 10),
    redness_score: randomInt(0, 10),
    scaling_present: Math.random() > 0.5,
    previous_treatment: randomChoice(['Metronidazol', 'İvermektin', 'Yok', null, null]),
    immune_status: randomChoice(['normal', 'baskılanmış', 'otoimmün', null]),
    skin_type: randomChoice(['yağlı', 'kuru', 'karma', 'normal', null]),
    cosmetic_usage: randomChoice(['Sık', 'Nadiren', 'Hiç', null]),
    stress_level: randomInt(0, 10),
    sleep_quality: randomInt(0, 10),
    created_at: new Date(now.getTime() - randomInt(0, 60) * 86400000).toISOString(),
  }))

  const { error: cfErr } = await supabase.from('clinical_forms').insert(clinicalFormsData)
  if (cfErr) throw new Error(`Clinical forms insert failed: ${cfErr.message}`)

  // 4. Analysis Results (sadece COMPLETED olanlara)
  const completedAnalyses = analyses!.filter((a) => a.status === 'COMPLETED')
  const resultsData = completedAnalyses.map((a) => {
    const miteCount = randomChoice([0, 0, 1, 2, 3, 5, 8, 12, 15, 20])
    return {
      analysis_id: a.id,
      mite_count: miteCount,
      mite_density: miteCount === 0 ? 'Negatif' : miteCount <= 3 ? 'Hafif' : miteCount <= 8 ? 'Orta' : 'Ağır',
      confidence_score: randomInt(75, 99) / 100,
      yolo_output: { detections: miteCount },
      gemma_report_tr: miteCount > 0
        ? `Hastanın cilt örneğinde ${miteCount} adet Demodex folliculorum tespit edilmiştir. Yoğunluk derecesi orta seviyededir. Klinik bulgular kaşıntı ve kızarıklık ile uyumludur.`
        : `Hastanın cilt örneğinde Demodex tespit edilmemiştir. Bulgular sağlıklı cilt profili ile uyumludur.`,
      gemma_report_en: miteCount > 0
        ? `Analysis detected ${miteCount} Demodex folliculorum mites. Density is moderate. Clinical findings consistent with itching and erythema.`
        : `No Demodex mites detected. Findings consistent with healthy skin profile.`,
      gradcam_url: `https://picsum.photos/seed/gradcam-${a.id}/400/400`,
      composite_score: randomInt(60, 98) / 100,
      processing_time_ms: randomInt(2000, 8000),
      created_at: new Date(now.getTime() - randomInt(0, 60) * 86400000).toISOString(),
    }
  })

  const { data: results, error: rErr } = await supabase
    .from('analysis_results')
    .insert(resultsData)
    .select('analysis_id, mite_count')

  if (rErr) throw new Error(`Results insert failed: ${rErr.message}`)

  // 5. Reports (COMPLETED analizlere)
  const reportsData = completedAnalyses.slice(0, 20).map((a) => ({
    analysis_id: a.id,
    pdf_url: null,
    json_data: { generated: true },
    fhir_data: null,
    status: randomChoice(['draft', 'draft', 'approved']),
    approved_at: randomChoice([new Date(now.getTime() - randomInt(0, 30) * 86400000).toISOString(), null]),
    created_at: new Date(now.getTime() - randomInt(0, 60) * 86400000).toISOString(),
  }))

  const { error: repErr } = await supabase.from('reports').insert(reportsData)
  if (repErr) throw new Error(`Reports insert failed: ${repErr.message}`)

  // 6. Doctor Feedback (COMPLETED analizlere, yarısına)
  const feedbackData = completedAnalyses.slice(0, 15).map((a, i) => {
    const result = results!.find((r) => r.analysis_id === a.id)
    const isCorrect = Math.random() > 0.2
    return {
      analysis_id: a.id,
      is_correct: isCorrect,
      correction: isCorrect ? null : 'YOLO tespiti hafif olduğundan daha yoğun değerlendirildi',
      corrected_mite_count: isCorrect ? null : (result?.mite_count ?? 0) + randomInt(1, 3),
      corrected_density: null,
      notes: randomChoice([null, null, 'Patoloji onaylı', 'İkinci okuma yapıldı']),
      created_at: new Date(now.getTime() - randomInt(0, 30) * 86400000).toISOString(),
    }
  })

  const { error: fbErr } = await supabase.from('doctor_feedback').insert(feedbackData)
  if (fbErr) throw new Error(`Feedback insert failed: ${fbErr.message}`)

  // 7. Audit Logs (30)
  const actions = ['CREATE', 'UPDATE', 'DELETE', 'VIEW']
  const tables = ['patients', 'analyses', 'reports']
  const auditData = Array.from({ length: 30 }, () => ({
    user_id: adminUserId,
    action: randomChoice(actions),
    table_name: randomChoice(tables),
    record_id: randomChoice(patients!).id,
    old_data: null,
    new_data: { dummy: true },
    ip_address: `192.168.1.${randomInt(1, 255)}`,
    created_at: new Date(now.getTime() - randomInt(0, 60) * 86400000).toISOString(),
  }))

  const { error: auditErr } = await supabase.from('audit_logs').insert(auditData)
  if (auditErr) throw new Error(`Audit logs insert failed: ${auditErr.message}`)

  return {
    patients: patients!.length,
    analyses: analyses!.length,
    results: results!.length,
    reports: reportsData.length,
    feedback: feedbackData.length,
    auditLogs: auditData.length,
  }
}
