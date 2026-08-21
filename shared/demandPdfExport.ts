export function demandPdfFileName(publicId: string) {
  return `${publicId.trim().replace(/[^A-Za-z0-9_-]+/g, "-") || "DFD"}.pdf`;
}
