import { Search } from '@upstash/search'

export type ReportDocument = {
  id: string
  content: {
    report_tr: string
    report_en: string
    patient_hash: string
    diagnosis: string
  }
  metadata: {
    analysis_id: string
    patient_id: string
    doctor_id: string
    mite_count?: number
    confidence_score?: number
    created_at: string
  }
}

export const searchClient = new Search({
  url: process.env.UPSTASH_SEARCH_REST_URL!,
  token: process.env.UPSTASH_SEARCH_REST_TOKEN!,
})

export const reportsIndex = searchClient.index<ReportDocument['content']>('demodex-reports')
