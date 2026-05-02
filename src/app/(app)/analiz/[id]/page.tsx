import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { cachedFetch } from '@/lib/upstash/cache';
import AnalysisDetailClient from './AnalysisDetailClient';

export default async function AnalysisDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const analysis = await cachedFetch(
    `analysis:${id}`,
    async () => {
      const { data } = await supabase
        .from('analyses')
        .select('*, patients(anonymous_hash, age, gender), clinical_forms(*), analysis_results(*)')
        .eq('id', id)
        .single();
      return data;
    },
    { ttl: 120 }
  );

  if (!analysis) {
    notFound();
  }

  return <AnalysisDetailClient analysis={analysis} />;
}
