import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendVerificationOTP, generateOTP } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: 'E-posta gereklidir' },
        { status: 400 }
      );
    }

    const supabaseAdmin = createAdminClient();

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, email_verified, verification_otp_expires')
      .eq('email', email)
      .single();

    if (!profile) {
      return NextResponse.json({
        success: true,
        message: 'Eğer bu e-postaya kayıtlı bir hesap varsa, yeni kod gönderildi.',
      });
    }

    if (profile.email_verified) {
      return NextResponse.json(
        { error: 'E-posta adresi zaten doğrulanmış.' },
        { status: 400 }
      );
    }

    // Rate limit check (2 minutes)
    if (profile.verification_otp_expires) {
      const lastSentAt = new Date(
        new Date(profile.verification_otp_expires).getTime() - 10 * 60 * 1000
      );
      const diffMinutes = (Date.now() - lastSentAt.getTime()) / 1000 / 60;
      if (diffMinutes < 2) {
        const waitSeconds = Math.ceil((2 - diffMinutes) * 60);
        return NextResponse.json(
          {
            error: `Lütfen ${waitSeconds} saniye sonra tekrar deneyin.`,
          },
          { status: 429 }
        );
      }
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await supabaseAdmin
      .from('profiles')
      .update({
        verification_otp: otp,
        verification_otp_expires: expiresAt,
      })
      .eq('id', profile.id);

    try {
      await sendVerificationOTP(email, otp);
    } catch (emailErr) {
      console.warn('Email sending failed (non-fatal):', emailErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Yeni doğrulama kodu gönderildi.',
    });
  } catch (error: any) {
    console.error('Resend OTP error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
