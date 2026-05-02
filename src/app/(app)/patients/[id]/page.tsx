import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { cachedFetch } from '@/lib/upstash/cache';
import PatientDetailClient from './PatientDetailClient';

export default async function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const patientData = await cachedFetch(
    `patient-detail:${id}`,
    async () => {
      const { data: patient } = await supabase.from('patients').select('*').eq('id', id).single();
      const { data: analyses } = await supabase
        .from('analyses')
        .select('*, analysis_results(mite_count, mite_density, confidence_score, created_at)')
        .eq('patient_id', id)
        .order('created_at', { ascending: false });

      return { patient, analyses: analyses ?? [] };
    },
    { ttl: 60 }
  );

  if (!patientData.patient) {
    notFound();
  }

  return <PatientDetailClient patient={patientData.patient} analyses={patientData.analyses} />;
}
