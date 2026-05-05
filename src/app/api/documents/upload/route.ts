import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const BUCKET = 'case-documents';
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

function sanitizeFileName(fileName: string) {
  const trimmed = fileName.trim() || 'document';
  return trimmed.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Yetkisiz erisim' }, { status: 401 });
    }

    const formData = await request.formData();
    const dosyaId = formData.get('dosyaId');
    const file = formData.get('file');

    if (typeof dosyaId !== 'string' || !dosyaId) {
      return NextResponse.json({ error: 'Dosya bilgisi eksik' }, { status: 400 });
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Yuklenecek belge bulunamadi' }, { status: 400 });
    }

    if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'Belge en fazla 10 MB olabilir' }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json({ error: 'Bu belge turu desteklenmiyor' }, { status: 400 });
    }

    const { data: dosya, error: dosyaError } = await supabase
      .from('dosyalar')
      .select('id')
      .eq('id', dosyaId)
      .single();

    if (dosyaError || !dosya) {
      return NextResponse.json({ error: 'Dosyaya erisim yok' }, { status: 403 });
    }

    const admin = createAdminClient();
    const safeName = sanitizeFileName(file.name);
    const path = `${dosyaId}/${randomUUID()}-${safeName}`;

    const { error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(path, file, { contentType: file.type, upsert: false });

    if (uploadError) {
      console.error('Document upload error:', uploadError);
      return NextResponse.json({ error: 'Belge yuklenemedi' }, { status: 500 });
    }

    const { data: document, error: insertError } = await admin
      .from('dosya_documents')
      .insert({
        dosya_id: dosyaId,
        file_name: file.name,
        file_url: path,
        file_type: file.type,
        file_size: file.size,
        uploaded_by: user.id,
      })
      .select('*, uploader:uploaded_by(full_name)')
      .single();

    if (insertError) {
      await admin.storage.from(BUCKET).remove([path]);
      console.error('Document metadata insert error:', insertError);
      return NextResponse.json({ error: 'Belge kaydi olusturulamadi' }, { status: 500 });
    }

    return NextResponse.json({ success: true, document });
  } catch (error) {
    console.error('Document upload route error:', error);
    return NextResponse.json({ error: 'Sunucu hatasi' }, { status: 500 });
  }
}
