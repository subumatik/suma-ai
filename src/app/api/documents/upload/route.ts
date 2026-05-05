import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';
import mammoth from 'mammoth';
import { chunkText } from '@/lib/chunking';
import { upsertDocumentChunks, DocumentChunk } from '@/lib/vector';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const caseId = formData.get('case_id') as string;

    if (!file || !caseId) {
      return NextResponse.json({ error: 'File and case_id are required' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload file to Supabase Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${caseId}/${uuidv4()}.${fileExt}`;
    
    const { error: storageError, data: storageData } = await supabase.storage
      .from('case-documents')
      .upload(fileName, buffer, { contentType: file.type });
      
    if (storageError) {
      console.error("Storage upload failed:", storageError);
      return NextResponse.json({ error: `Storage upload failed: ${storageError.message}` }, { status: 500 });
    }

    // Insert record into dosya_documents table so it shows in the UI
    const { data: docData, error: dbError } = await supabase.from('dosya_documents').insert({
      dosya_id: caseId,
      file_name: file.name,
      file_url: storageData.path,
      file_type: file.type,
      file_size: file.size,
      uploaded_by: user.id
    }).select().single();

    if (dbError) {
      console.error("Database insert failed:", dbError);
      return NextResponse.json({ error: `Database insert failed: ${dbError.message}` }, { status: 500 });
    }

    let aiWarning = null;

    // Automatic Vectorization (AI Indexing)
    try {
      let extractedText = '';
      const lowerName = file.name.toLowerCase();

      if (lowerName.endsWith('.pdf')) {
        const pdfParse = require('pdf-parse');
        const data = await pdfParse(buffer);
        extractedText = data.text;
      } else if (lowerName.endsWith('.docx')) {
        const result = await mammoth.extractRawText({ buffer });
        extractedText = result.value;
      } else {
        throw new Error('Unsupported file type for AI indexing.');
      }

      if (extractedText && extractedText.trim()) {
        const chunks = chunkText(extractedText, 250);
        const vectorChunks: DocumentChunk[] = chunks.map((chunkText, index) => ({
          id: `${caseId}-${uuidv4()}-${index}`,
          data: chunkText,
          metadata: {
            case_id: caseId,
            file_name: file.name,
            chunk_index: index,
          }
        }));
        await upsertDocumentChunks(vectorChunks);
      } else {
        throw new Error('Could not extract any text from the document.');
      }
    } catch (aiError: any) {
      console.error("AI Vectorization failed:", aiError);
      aiWarning = aiError.message || "Yapay zeka indekslemesi başarısız oldu.";
    }

    return NextResponse.json({ 
      success: true, 
      message: aiWarning ? `Belge yüklendi ancak yapay zeka aktarımı yapılamadı: ${aiWarning}` : 'Belge başarıyla yüklendi ve yapay zeka hafızasına eklendi.',
      document: docData,
      aiWarning
    });

  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
