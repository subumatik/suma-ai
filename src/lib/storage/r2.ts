import { StorageProvider } from './types'

// Cloudflare R2 placeholder — implement when R2 credentials are available
export class R2Storage implements StorageProvider {
  async upload(): Promise<string> {
    throw new Error('R2 storage not implemented yet')
  }

  getUrl(): string {
    throw new Error('R2 storage not implemented yet')
  }

  async delete(): Promise<void> {
    throw new Error('R2 storage not implemented yet')
  }
}
