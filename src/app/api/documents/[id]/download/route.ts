import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

const BUCKET = 'case-documents';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Yetkisiz erisim' }, { status: 401 });
    }

    const { data: document, error: documentError } = await supabase
      .from('dosya_documents')
      .select('id, file_name, file_url')
      .eq('id', id)
      .single();

    if (documentError || !document) {
      return NextResponse.json({ error: 'Belge bulunamadi' }, { status: 404 });
    }

    const admin = createAdminClient();
    const { data: signedUrl, error: signedUrlError } = await admin.storage
      .from(BUCKET)
      .createSignedUrl(document.file_url, 60, { download: document.file_name });

    if (signedUrlError || !signedUrl?.signedUrl) {
      console.error('Signed URL error:', signedUrlError);
      return NextResponse.json({ error: 'Indirme baglantisi olusturulamadi' }, { status: 500 });
    }

    return NextResponse.redirect(signedUrl.signedUrl);
  } catch (error) {
    console.error('Document download route error:', error);
    return NextResponse.json({ error: 'Sunucu hatasi' }, { status: 500 });
  }
}
