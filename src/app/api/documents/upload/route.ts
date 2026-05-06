import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';
import Anthropic, { toFile } from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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

    // Insert record into dosya_documents table
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

    // Upload to Claude Files API
    let claudeFileId: string | null = null;
    let aiWarning: string | null = null;

    try {
      const uploaded = await client.beta.files.upload({
        file: await toFile(buffer, file.name, { type: file.type }),
        betas: ["files-api-2025-04-14"],
      });
      claudeFileId = uploaded.id;

      // Update dosya_documents with claude_file_id
      await supabase
        .from('dosya_documents')
        .update({ claude_file_id: uploaded.id })
        .eq('id', docData.id);
    } catch (claudeError: any) {
      console.error("Claude Files API upload failed:", claudeError);
      aiWarning = claudeError.message || "Claude dosya aktarımı başarısız oldu.";
    }

    return NextResponse.json({
      success: true,
      message: aiWarning
        ? `Belge yüklendi ancak Claude aktarımı yapılamadı: ${aiWarning}`
        : 'Belge başarıyla yüklendi ve Claude hafızasına eklendi.',
      document: { ...docData, claude_file_id: claudeFileId },
      aiWarning,
    });

  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
