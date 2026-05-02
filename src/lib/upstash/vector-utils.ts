import { clinicalIndex, type ClinicalVectorMetadata } from './vector'

interface ClinicalFormData {
  age: number | null
  gender: string | null
  symptom_duration_days: number | null
  itching_severity: number | null
  redness_score: number | null
  scaling_present: boolean
  previous_treatment: string | null
  immune_status: string | null
  skin_type: string | null
  cosmetic_usage: string | null
  stress_level: number | null
  sleep_quality: number | null
}

export function clinicalToVector(form: ClinicalFormData): number[] {
  const values = [
    Math.min((form.age ?? 50) / 100, 1),
    form.gender === 'Kadın' ? 0.2 : form.gender === 'Erkek' ? 0.8 : 0.5,
    Math.min((form.symptom_duration_days ?? 30) / 365, 1),
    (form.itching_severity ?? 0) / 10,
    (form.redness_score ?? 0) / 10,
    form.scaling_present ? 1 : 0,
    form.previous_treatment ? 0.7 : 0.3,
    form.immune_status === 'normal' || form.immune_status === 'sağlıklı' ? 0.2 : 0.8,
    form.skin_type === 'yağlı' ? 0.2 : form.skin_type === 'kuru' ? 0.8 : 0.5,
    form.cosmetic_usage ? 0.6 : 0.4,
    (form.stress_level ?? 0) / 10,
    (form.sleep_quality ?? 0) / 10,
  ]

  const blockSize = Math.floor(768 / values.length) // 64
  const vector: number[] = []

  for (const v of values) {
    for (let i = 0; i < blockSize; i++) {
      vector.push(v)
    }
  }

  while (vector.length < 768) {
    vector.push(0)
  }

  return vector
}

export async function upsertAnalysisVector(
  analysisId: string,
  patientId: string,
  patientHash: string,
  doctorId: string,
  form: ClinicalFormData,
  result?: {
    mite_count?: number
    confidence_score?: number
    label?: string
  }
) {
  const vector = clinicalToVector(form)

  await clinicalIndex.upsert({
    id: analysisId,
    vector,
    metadata: {
      analysis_id: analysisId,
      patient_id: patientId,
      patient_hash: patientHash,
      doctor_id: doctorId,
      label: result?.label ?? 'unknown',
      mite_count: result?.mite_count,
      confidence_score: result?.confidence_score,
      created_at: new Date().toISOString(),
    },
  })
}

export async function findSimilarCases(
  analysisId: string,
  form: ClinicalFormData,
  topK: number = 5
): Promise<(ClinicalVectorMetadata & { score: number })[]> {
  const vector = clinicalToVector(form)

  const results = await clinicalIndex.query({
    vector,
    topK: topK + 1, // +1 to filter out self
    includeMetadata: true,
  })

  return results
    .filter((r) => r.id !== analysisId)
    .map((r) => ({
      ...(r.metadata as ClinicalVectorMetadata),
      score: r.score,
    }))
    .slice(0, topK)
}
