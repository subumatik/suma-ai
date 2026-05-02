import { createClient } from '@/lib/supabase/server';
import GalleryClient from './GalleryClient';

export default async function GalleryPage() {
  const supabase = await createClient();

  const { data: analyses } = await supabase
    .from('analyses')
    .select('id, image_url, status, created_at, patient_id, patients(anonymous_hash), analysis_results(mite_count, mite_density, confidence_score)')
    .order('created_at', { ascending: false });

  const items = (analyses ?? []).map((a: any) => {
    const result = a.analysis_results?.[0];
    let category = 'unknown';
    if (a.status === 'PENDING' || a.status === 'PROCESSING') category = 'processing';
    else if (result?.mite_count === 0) category = 'healthy';
    else if (result?.mite_count && result.mite_count > 0) category = 'demodex';

    return {
      id: a.id,
      image_url: a.image_url,
      status: a.status,
      created_at: a.created_at,
      patient_hash: a.patients?.anonymous_hash ?? 'N/A',
      mite_count: result?.mite_count ?? null,
      mite_density: result?.mite_density ?? null,
      confidence_score: result?.confidence_score ?? null,
      category,
    };
  });

  return <GalleryClient items={items} />;
}
