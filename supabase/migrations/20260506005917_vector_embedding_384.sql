-- Drop existing embedding column (no embeddings were generated yet, data loss is acceptable)
ALTER TABLE document_chunks DROP COLUMN IF EXISTS embedding;

-- Add new embedding column with 384 dimensions (all-MiniLM-L6-v2)
ALTER TABLE document_chunks ADD COLUMN embedding vector(384);

-- Create HNSW index for fast cosine similarity search
CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx 
  ON document_chunks 
  USING hnsw (embedding vector_cosine_ops);

-- Create function for semantic document search using cosine similarity
CREATE OR REPLACE FUNCTION match_document_chunks(
  query_embedding vector(384),
  match_case_id uuid,
  match_limit int DEFAULT 5
)
RETURNS TABLE(
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.content,
    dc.metadata,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM document_chunks dc
  WHERE dc.case_id = match_case_id
    AND dc.embedding IS NOT NULL
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_limit;
END;
$$;
