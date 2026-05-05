import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendVerificationOTP, generateOTP } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      email,
      password,
      fullName,
      phone,
      userType,
      baroNumber,
      specialization,
      referansKodu,
    } = body;

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: 'E-posta, şifre ve ad soyad zorunludur' },
        { status: 400 }
      );
    }

    if (userType === 'lawyer' && !baroNumber) {
      return NextResponse.json(
        { error: 'Avukatlar için baro numarası zorunludur' },
        { status: 400 }
      );
    }

    const supabaseAdmin = createAdminClient();

    // Check existing profile
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, email_verified')
      .eq('email', email)
      .maybeSingle();

    if (existingProfile?.email_verified) {
      return NextResponse.json(
        { error: 'Bu e-posta adresi zaten kayıtlı' },
        { status: 400 }
      );
    }

    let userId: string;

    if (existingProfile) {
      // User exists but not verified - update password
      const { data: userData, error: userError } =
        await supabaseAdmin.auth.admin.updateUserById(existingProfile.id, {
          password,
          email_confirm: false,
        });

      if (userError || !userData.user) {
        return NextResponse.json(
          { error: userError?.message || 'Kullanıcı güncellenemedi' },
          { status: 400 }
        );
      }

      userId = userData.user.id;
    } else {
      // Create new Supabase user (unconfirmed)
      const { data: userData, error: userError } =
        await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: false,
          user_metadata: { full_name: fullName },
        });

      if (userError || !userData.user) {
        return NextResponse.json(
          { error: userError?.message || 'Kullanıcı oluşturulamadı' },
          { status: 400 }
        );
      }

      userId = userData.user.id;
    }

    // Generate ref code for lawyers
    let refCode: string | null = null;
    if (userType === 'lawyer') {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      refCode = code;
    } else {
      refCode = referansKodu ? referansKodu.toUpperCase().trim() : null;
    }

    // Update profile (trigger may have auto-created it)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        full_name: fullName,
        email,
        phone: phone || null,
        role: userType,
        baro_number: userType === 'lawyer' ? baroNumber : null,
        specialization: userType === 'lawyer' ? specialization || null : null,
        referans_kodu: refCode,
        email_verified: false,
      })
      .eq('id', userId);

    if (profileError) {
      console.error('Profile update error:', profileError);
      return NextResponse.json(
        { error: 'Profil güncellenemedi' },
        { status: 500 }
      );
    }

    // Auto-create cases for client with ref codes
    if (userType === 'client' && referansKodu?.trim()) {
      const kodlar = referansKodu
        .split(',')
        .map((k: string) => k.trim().toUpperCase())
        .filter(Boolean);
      const { data: lawyers } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('role', 'lawyer')
        .in('referans_kodu', kodlar);

      if (lawyers && lawyers.length > 0) {
        for (const lawyer of lawyers) {
          await supabaseAdmin.from('dosyalar').insert({
            title: 'Genel Hukuki Danışmanlık',
            description: `${fullName} tarafından referans kodu ile oluşturulan dava kaydı.`,
            lawyer_id: lawyer.id,
            client_id: userId,
            status_id: '00000000-0000-0000-0000-000000000000',
          });
        }
      }
    }

    // Rate limit check (2 minutes between resends)
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('verification_otp_expires')
      .eq('id', userId)
      .single();

    if (profile?.verification_otp_expires) {
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

    // Generate and save OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await supabaseAdmin
      .from('profiles')
      .update({
        verification_otp: otp,
        verification_otp_expires: expiresAt,
      })
      .eq('id', userId);

    // Send email
    try {
      await sendVerificationOTP(email, otp);
    } catch (emailErr) {
      console.warn('Email sending failed (non-fatal):', emailErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Doğrulama kodu e-posta adresinize gönderildi.',
    });
  } catch (error: any) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
