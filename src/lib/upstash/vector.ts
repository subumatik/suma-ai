import { Index } from '@upstash/vector'

export type ClinicalVectorMetadata = {
  analysis_id: string
  patient_id: string
  patient_hash: string
  label: string
  mite_count?: number
  confidence_score?: number
  doctor_id: string
  created_at: string
}

export const clinicalIndex = new Index<ClinicalVectorMetadata>({
  url: process.env.UPSTASH_VECTOR_REST_URL!,
  token: process.env.UPSTASH_VECTOR_REST_TOKEN!,
})
