import { StorageProvider } from './types'
import { SupabaseStorage } from './supabase'
import { R2Storage } from './r2'

let _provider: StorageProvider | null = null

export function getStorageProvider(): StorageProvider {
  if (!_provider) {
    const provider = process.env.STORAGE_PROVIDER ?? 'supabase'
    if (provider === 'r2') {
      _provider = new R2Storage()
    } else {
      _provider = new SupabaseStorage()
    }
  }
  return _provider
}

export * from './types'
