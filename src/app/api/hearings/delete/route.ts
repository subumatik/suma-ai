import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function DELETE(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID gerekli' }, { status: 400 });

    const { data: hearing } = await supabase.from('hearings').select('dosya_id').eq('id', id).single();
    if (!hearing) return NextResponse.json({ error: 'Duruşma bulunamadı' }, { status: 404 });

    const { data: lawyerLink } = await supabase
      .from('dosya_lawyers')
      .select('id')
      .eq('dosya_id', hearing.dosya_id)
      .eq('lawyer_id', user.id)
      .maybeSingle();
    if (!lawyerLink) {
      return NextResponse.json({ error: 'Yetkisiz işlem' }, { status: 403 });
    }

    const { error } = await supabase.from('hearings').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
