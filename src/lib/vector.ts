import { Index } from "@upstash/vector";

const url = process.env.UPSTASH_VECTOR_REST_URL;
const token = process.env.UPSTASH_VECTOR_REST_TOKEN;

// Initialize the index if env vars are present
export const vectorIndex = (url && token) 
  ? new Index({ url, token }) 
  : null;

export interface DocumentChunkMetadata {
  case_id: string;
  file_name: string;
  chunk_index: number;
  [key: string]: any;
}

export interface DocumentChunk {
  id: string;
  data: string;
  metadata: DocumentChunkMetadata;
}

export async function upsertDocumentChunks(chunks: DocumentChunk[]) {
  if (!vectorIndex) throw new Error("Upstash Vector is not configured");

  const BATCH_SIZE = 100;
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    await vectorIndex.upsert(batch);
  }
}

export async function queryDocumentContext(caseId: string, query: string, topK: number = 3) {
  if (!vectorIndex) throw new Error("Upstash Vector is not configured");

  const results = await vectorIndex.query({
    data: query,
    topK,
    includeMetadata: true,
    includeData: true,
    filter: `case_id = '${caseId}'`,
  });

  return results;
}
