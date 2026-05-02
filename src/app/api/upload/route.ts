import { NextRequest, NextResponse } from 'next/server'
import { getStorageProvider } from '@/lib/storage'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const path = formData.get('path') as string | null

    if (!file || !path) {
      return NextResponse.json({ error: 'file and path required' }, { status: 400 })
    }

    const storage = getStorageProvider()
    const url = await storage.upload(file, path)

    return NextResponse.json({ url })
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: error?.message ?? 'Upload failed' },
      { status: 500 }
    )
  }
}
