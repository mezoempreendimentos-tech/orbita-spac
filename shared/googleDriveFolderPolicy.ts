export type GoogleDriveFolderPlan = {
  folderId: string;
  reuseExistingFolder: boolean;
};

const GOOGLE_DRIVE_ID = /^[A-Za-z0-9_-]{10,500}$/;

export function normalizeGoogleDriveFolderId(value: string) {
  const trimmed = value.trim();
  const fromUrl = trimmed.match(/\/folders\/([A-Za-z0-9_-]+)/)?.[1];
  const folderId = fromUrl ?? trimmed;
  if (!GOOGLE_DRIVE_ID.test(folderId)) throw new Error("Informe o link ou o identificador de uma pasta válida do Google Drive.");
  return folderId;
}

export function planGoogleDriveFolder(existingFolderId: string | null | undefined, institutionalFolderId: string): GoogleDriveFolderPlan {
  const normalizedInstitutionalFolderId = normalizeGoogleDriveFolderId(institutionalFolderId);
  if (existingFolderId?.trim()) {
    return { folderId: normalizeGoogleDriveFolderId(existingFolderId), reuseExistingFolder: true };
  }
  return { folderId: normalizedInstitutionalFolderId, reuseExistingFolder: false };
}
