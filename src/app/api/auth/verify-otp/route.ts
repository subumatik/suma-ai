import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json(
        { error: 'E-posta ve OTP kodu gereklidir' },
        { status: 400 }
      );
    }

    const supabaseAdmin = createAdminClient();

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, email_verified, verification_otp, verification_otp_expires')
      .eq('email', email)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: 'Geçersiz veya süresi dolmuş kod.' },
        { status: 400 }
      );
    }

    if (profile.email_verified) {
      return NextResponse.json(
        { error: 'E-posta adresi zaten doğrulanmış.' },
        { status: 400 }
      );
    }

    if (
      !profile.verification_otp ||
      profile.verification_otp !== otp ||
      !profile.verification_otp_expires ||
      new Date(profile.verification_otp_expires) < new Date()
    ) {
      return NextResponse.json(
        { error: 'Geçersiz veya süresi dolmuş kod.' },
        { status: 400 }
      );
    }

    // Confirm email in Supabase
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      profile.id,
      { email_confirm: true }
    );

    if (updateError) {
      console.error('Supabase confirm error:', updateError);
      return NextResponse.json(
        { error: 'E-posta doğrulama hatası' },
        { status: 500 }
      );
    }

    // Mark profile as verified and clear OTP
    await supabaseAdmin
      .from('profiles')
      .update({
        email_verified: true,
        verification_otp: null,
        verification_otp_expires: null,
      })
      .eq('id', profile.id);

    return NextResponse.json({
      success: true,
      message: 'E-posta adresiniz başarıyla doğrulandı.',
    });
  } catch (error: any) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
