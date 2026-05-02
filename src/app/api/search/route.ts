import { NextRequest, NextResponse } from 'next/server'
import { reportsIndex } from '@/lib/upstash/search'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, limit = 10 } = body

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query string required' }, { status: 400 })
    }

    const results = await reportsIndex.search({
      query,
      limit,
      reranking: true,
    })

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ error: 'Search failed', results: [] }, { status: 500 })
  }
}
