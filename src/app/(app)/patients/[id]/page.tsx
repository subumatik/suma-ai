import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import PatientDetailClient from './PatientDetailClient';

export default async function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: patient } = await supabase.from('patients').select('*').eq('id', id).single();
  const { data: analyses } = await supabase
    .from('analyses')
    .select('*, analysis_results(mite_count, mite_density, confidence_score, created_at)')
    .eq('patient_id', id)
    .order('created_at', { ascending: false });

  if (!patient) {
    notFound();
  }

  return <PatientDetailClient patient={patient} analyses={analyses ?? []} />;
}
