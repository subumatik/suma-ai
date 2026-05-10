import { ImageResponse } from 'next/og'

export const alt = 'Avukatip — Hukuki İşlemlerin Ayrıcalıklı Adresi'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

function getBaseUrl() {
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL
  return 'http://localhost:3000'
}

export default async function Image() {
  const baseUrl = getBaseUrl()
  const logoSrc = `${baseUrl}/android-chrome-192x192.png`

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #333333 100%)',
          color: '#F4F4F5',
          fontFamily: 'Inter, sans-serif',
          padding: 60,
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 8,
            background: '#ffffff',
          }}
        />
        <img
          src={logoSrc}
          width={120}
          height={120}
          style={{ borderRadius: 24, marginBottom: 32, filter: 'grayscale(100%)' }}
        />
        <h1
          style={{
            fontSize: 72,
            fontWeight: 800,
            margin: 0,
            letterSpacing: '-0.02em',
            color: '#ffffff',
          }}
        >
          Avukatip
        </h1>
        <p
          style={{
            fontSize: 28,
            fontWeight: 500,
            marginTop: 16,
            color: '#bbbbbb',
            textAlign: 'center',
          }}
        >
          Hukuki İşlemlerin Ayrıcalıklı Adresi
        </p>
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            display: 'flex',
            gap: 24,
            fontSize: 18,
            color: '#888888',
          }}
        >
          <span>dosya yönetimi</span>
          <span>•</span>
          <span>randevu</span>
          <span>•</span>
          <span>yargıtay</span>
          <span>•</span>
          <span>ai asistan</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
