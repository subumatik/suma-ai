export interface StorageProvider {
  upload(file: File | Blob, path: string): Promise<string>
  getUrl(path: string): string
  delete(path: string): Promise<void>
}
