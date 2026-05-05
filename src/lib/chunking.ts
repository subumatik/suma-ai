export function chunkText(text: string, maxWordsPerChunk: number = 250): string[] {
  // Basic chunking strategy by words, respecting sentences as much as possible
  const sentences = text.match(/[^.!?]+[.!?]+[\])'"`’”]*|.+/g) || [text];
  
  const chunks: string[] = [];
  let currentChunk = "";
  let currentWordCount = 0;

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;

    const wordCount = trimmed.split(/\s+/).length;

    if (currentWordCount + wordCount > maxWordsPerChunk && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = "";
      currentWordCount = 0;
    }

    currentChunk += " " + trimmed;
    currentWordCount += wordCount;
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}
