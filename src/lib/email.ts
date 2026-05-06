import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const SENDER_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function wrapEmailBody(title: string, bodyContent: string, isOtp = false, otpCode = '', validityDuration = '10 dakika') {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Avukatip</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f3f4f6; color: #111827;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 48px 0;">
        <table width="480" cellpadding="0" cellspacing="0" style="max-width: 480px; width: 100%; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); overflow: hidden; border: 1px solid #e5e7eb;">
          <tr>
            <td align="center" style="padding: 40px 0 0 0;">
              <div style="font-weight: 800; font-size: 26px; color: #1E3A5F; font-family: 'Montserrat', sans-serif;">Avu<span style="font-weight: 500;">katip</span></div>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 48px;">
              <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: #111827; text-align: center;">${title}</h1>
              ${isOtp ? `
              <div style="margin: 0 0 32px 0; color: #4b5563; text-align: center; font-size: 16px;">${bodyContent}</div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
                <tr>
                  <td align="center">
                    <div style="background-color: #f0f7ff; border-radius: 12px; padding: 20px 0; width: 100%; text-align: center; border: 1px solid #dbeafe;">
                      <span style="font-family: Helvetica, Arial, sans-serif; font-size: 36px; font-weight: 700; color: #1E3A5F; letter-spacing: 4px;">${otpCode}</span>
                    </div>
                  </td>
                </tr>
              </table>
              <p style="margin: 0 0 24px 0; font-size: 14px; color: #4b5563; text-align: center;">
                Bu kod <strong>${validityDuration}</strong> süreyle geçerlidir. Kimseyle paylaşmayın.
              </p>
              ` : `<div style="color: #4b5563; font-size: 16px; line-height: 1.6;">${bodyContent}</div>`}
              <div style="border-top: 1px solid #e5e7eb; margin: 24px 0; width: 100%;"></div>
              <p style="margin: 0; font-size: 13px; color: #9ca3af; text-align: center;">
                Avukatip Platformu
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                &copy; ${new Date().getFullYear()} Avukatip. Tüm hakları saklıdır.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendEmail(to: string, subject: string, title: string, bodyContent: string) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set');
    return;
  }

  const html = wrapEmailBody(title, bodyContent);

  const { data, error } = await resend.emails.send({
    from: SENDER_EMAIL,
    to,
    subject,
    html,
  });

  if (error) {
    console.error('Resend error:', error);
    throw new Error(error.message);
  }

  console.log(`Email sent to ${to}, id: ${data?.id}`);
}

export async function sendAppointmentEmail(
  to: string,
  subject: string,
  title: string,
  bodyLines: string[]
) {
  const bodyContent = bodyLines
    .map((line) => `<p style="margin: 0 0 12px 0;">${line}</p>`)
    .join('');
  return sendEmail(to, subject, title, bodyContent);
}

export async function sendVerificationOTP(email: string, otp: string, referenceCode?: string | null) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set');
    return;
  }

  const referenceCodeHtml = referenceCode
    ? `
      <div style="margin: 18px 0 0 0; padding: 16px; border: 1px solid #dbeafe; border-radius: 12px; background-color: #f8fbff; text-align: center;">
        <p style="margin: 0 0 8px 0; color: #4b5563; font-size: 14px;">Müvekkillerinizin sizi bulması için referans kodunuz:</p>
        <strong style="font-size: 24px; color: #1E3A5F; letter-spacing: 2px;">${referenceCode}</strong>
      </div>
    `
    : '';

  const html = wrapEmailBody(
    'E-posta Doğrulama',
    `Avukatip'e kayıt olduğunuz için teşekkürler! Kaydınızı tamamlamak için aşağıdaki doğrulama kodunu kullanın.${referenceCodeHtml}`,
    true,
    otp
  );

  const { data, error } = await resend.emails.send({
    from: SENDER_EMAIL,
    to: email,
    subject: referenceCode ? 'Avukatip - Doğrulama Kodunuz ve Referans Kodunuz' : 'Avukatip - Doğrulama Kodunuz',
    html,
  });

  if (error) {
    console.error('Resend error:', error);
    throw new Error(error.message);
  }

  console.log(`OTP sent to ${email}, id: ${data?.id}`);
}
