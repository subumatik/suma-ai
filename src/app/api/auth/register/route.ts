import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendVerificationOTP, generateOTP } from '@/lib/email';

type RegisterUserType = 'client' | 'lawyer';

function normalizeReferenceCodes(value: unknown): string[] {
  if (typeof value !== 'string') return [];

  return value
    .split(',')
    .map((code) => code.trim().toUpperCase())
    .filter(Boolean);
}

async function generateUniqueReferenceCode(supabaseAdmin: ReturnType<typeof createAdminClient>) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  for (let attempt = 0; attempt < 10; attempt += 1) {
    let code = '';
    for (let i = 0; i < 6; i += 1) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const { data } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('referans_kodu', code)
      .maybeSingle();

    if (!data) return code;
  }

  throw new Error('Referans kodu oluşturulamadı');
}

async function getDefaultStatusId(supabaseAdmin: ReturnType<typeof createAdminClient>, lawyerId: string) {
  const { data } = await supabaseAdmin
    .from('statuses')
    .select('id')
    .or(`is_system.eq.true,created_by.eq.${lawyerId}`)
    .order('is_default', { ascending: false })
    .order('order', { ascending: true })
    .limit(1)
    .maybeSingle();

  return data?.id ?? null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      password,
      fullName,
      phone,
      userType,
      baroNumber,
      specialization,
      referansKodu,
    } = body;
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: 'E-posta, şifre ve ad soyad zorunludur' },
        { status: 400 }
      );
    }

    if (userType !== 'client' && userType !== 'lawyer') {
      return NextResponse.json(
        { error: 'Geçersiz kullanıcı tipi' },
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
    const clientReferenceCodes = normalizeReferenceCodes(referansKodu);
    let matchedLawyers: { id: string; referans_kodu: string | null }[] = [];

    if (userType === 'client' && clientReferenceCodes.length > 0) {
      const { data: lawyers, error: lawyersError } = await supabaseAdmin
        .from('profiles')
        .select('id, referans_kodu')
        .eq('role', 'lawyer')
        .in('referans_kodu', clientReferenceCodes);

      if (lawyersError) throw lawyersError;

      matchedLawyers = lawyers ?? [];
      const foundCodes = new Set(matchedLawyers.map((lawyer) => lawyer.referans_kodu));
      const missingCodes = clientReferenceCodes.filter((code) => !foundCodes.has(code));

      if (missingCodes.length > 0) {
        return NextResponse.json(
          { error: `Geçersiz referans kodu: ${missingCodes.join(', ')}` },
          { status: 400 }
        );
      }
    }

    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, email_verified, verification_otp_expires')
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
      const { data: userData, error: userError } =
        await supabaseAdmin.auth.admin.updateUserById(existingProfile.id, {
          password,
          email_confirm: false,
          user_metadata: { full_name: fullName },
        });

      if (userError || !userData.user) {
        return NextResponse.json(
          { error: userError?.message || 'Kullanıcı güncellenemedi' },
          { status: 400 }
        );
      }

      userId = userData.user.id;
    } else {
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

    const refCode = userType === 'lawyer'
      ? await generateUniqueReferenceCode(supabaseAdmin)
      : null;

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        full_name: fullName,
        email,
        phone: phone || null,
        role: userType as RegisterUserType,
        baro_number: userType === 'lawyer' ? baroNumber : null,
        specialization: userType === 'lawyer' ? specialization || null : null,
        referans_kodu: refCode,
        email_verified: false,
      }, { onConflict: 'id' });

    if (profileError) {
      console.error('Profile upsert error:', profileError);
      return NextResponse.json(
        { error: 'Profil kaydedilemedi' },
        { status: 500 }
      );
    }

    if (userType === 'client' && matchedLawyers.length > 0) {
      for (const lawyer of matchedLawyers) {
        const statusId = await getDefaultStatusId(supabaseAdmin, lawyer.id);

        if (!statusId) {
          console.warn(`No default status found for lawyer ${lawyer.id}; skipping automatic case creation`);
          continue;
        }

        const { error: dosyaError } = await supabaseAdmin.from('dosyalar').insert({
          title: 'Genel Hukuki Danışmanlık',
          description: `${fullName} tarafından referans kodu ile oluşturulan dava kaydı.`,
          lawyer_id: lawyer.id,
          client_id: userId,
          status_id: statusId,
        });

        if (dosyaError) {
          console.error('Automatic dosya creation error:', dosyaError);
        }
      }
    }

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
          { error: `Lütfen ${waitSeconds} saniye sonra tekrar deneyin.` },
          { status: 429 }
        );
      }
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error: otpError } = await supabaseAdmin
      .from('profiles')
      .update({
        verification_otp: otp,
        verification_otp_expires: expiresAt,
      })
      .eq('id', userId);

    if (otpError) throw otpError;

    try {
      await sendVerificationOTP(email, otp, userType === 'lawyer' ? refCode : null);
    } catch (emailErr) {
      console.warn('Email sending failed (non-fatal):', emailErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Doğrulama kodu e-posta adresinize gönderildi.',
      referenceCode: userType === 'lawyer' ? refCode : undefined,
    });
  } catch (error: any) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: error?.message ?? 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
