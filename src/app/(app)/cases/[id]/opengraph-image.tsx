import { ImageResponse } from 'next/og'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export const alt = 'Dosya Detayı — Avukatip'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

function getBaseUrl() {
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL
  return 'http://localhost:3000'
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  let raw: any = null
  try {
    const serviceClient = createServiceRoleClient()
    const { data } = await serviceClient
      .from('dosyalar')
      .select('title, status:status_id(name,color), category:category_id(name,color), lawyers:dosya_lawyers(lawyer:lawyer_id(full_name))')
      .eq('id', id)
      .single()
    raw = data
  } catch {
    const supabase = await createClient()
    const { data } = await supabase
      .from('dosyalar')
      .select('title, status:status_id(name,color), category:category_id(name,color), lawyers:dosya_lawyers(lawyer:lawyer_id(full_name))')
      .eq('id', id)
      .single()
    raw = data
  }

  const dosya = raw

  const baseUrl = getBaseUrl()
  const logoSrc = `${baseUrl}/android-chrome-192x192.png`

  const title = dosya?.title ?? 'Dosya Detayı'
  const statusName = dosya?.status?.name ?? ''
  const statusColor = '#cccccc'
  const categoryName = dosya?.category?.name ?? ''
  const categoryColor = '#888888'
  const lawyers = (dosya?.lawyers ?? [])
    .map((l: any) => l.lawyer?.full_name)
    .filter(Boolean)
    .join(', ') || ''

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #333333 100%)',
          color: '#F4F4F5',
          fontFamily: 'Inter, sans-serif',
          padding: 80,
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
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            marginBottom: 40,
          }}
        >
          <img src={logoSrc} width={64} height={64} style={{ borderRadius: 16, filter: 'grayscale(100%)' }} />
          <span style={{ fontSize: 24, fontWeight: 600, color: '#bbbbbb' }}>
            Avukatip
          </span>
        </div>
        <h1
          style={{
            fontSize: 56,
            fontWeight: 800,
            margin: 0,
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
            maxWidth: 900,
            color: '#ffffff',
          }}
        >
          {title}
        </h1>
        <div
          style={{
            display: 'flex',
            gap: 16,
            marginTop: 32,
            fontSize: 22,
            color: '#bbbbbb',
          }}
        >
          {statusName && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: statusColor,
                }}
              />
              {statusName}
            </span>
          )}
          {categoryName && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: categoryColor,
                }}
              />
              {categoryName}
            </span>
          )}
        </div>
        {lawyers && (
          <p style={{ fontSize: 20, color: '#888888', marginTop: 16 }}>
            Avukat: {lawyers}
          </p>
        )}
      </div>
    ),
    {
      ...size,
    }
  )
}
