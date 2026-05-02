import { createClient } from '@supabase/supabase-js'
import { StorageProvider } from './types'

const BUCKET = 'patient-images'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

let bucketChecked = false

async function ensureBucket() {
  if (bucketChecked) return
  const { data: buckets } = await supabaseAdmin.storage.listBuckets()
  const exists = buckets?.some((b) => b.name === BUCKET)
  if (!exists) {
    await supabaseAdmin.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: 10 * 1024 * 1024, // 10MB
    })
  }
  bucketChecked = true
}

export class SupabaseStorage implements StorageProvider {
  async upload(file: File | Blob, path: string): Promise<string> {
    await ensureBucket()
    const { error } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, file, { upsert: true })
    if (error) throw error
    const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path)
    return data.publicUrl
  }

  getUrl(path: string): string {
    const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path)
    return data.publicUrl
  }

  async delete(path: string): Promise<void> {
    const { error } = await supabaseAdmin.storage.from(BUCKET).remove([path])
    if (error) throw error
  }
}
