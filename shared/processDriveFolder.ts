export function processDriveFolderUrl(input: { provider?: string | null; folderId?: string | null; folderUrl?: string | null }) {
  if (input.provider && input.provider !== "google_drive") return null;
  if (input.folderUrl?.trim()) return input.folderUrl.trim();
  if (input.folderId?.trim() && /^[A-Za-z0-9_-]{10,500}$/.test(input.folderId.trim())) {
    return `https://drive.google.com/drive/folders/${input.folderId.trim()}`;
  }
  return null;
}
