import { NextRequest, NextResponse } from 'next/server'
import { findSimilarCases } from '@/lib/upstash/vector-utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { analysisId, form, topK = 5 } = body

    if (!analysisId || !form) {
      return NextResponse.json({ error: 'analysisId and form required' }, { status: 400 })
    }

    const similar = await findSimilarCases(analysisId, form, topK)
    return NextResponse.json({ similar })
  } catch (error) {
    console.error('Vector similar search error:', error)
    return NextResponse.json({ error: 'Search failed', similar: [] }, { status: 500 })
  }
}
