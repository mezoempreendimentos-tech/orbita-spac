export type PcaUpdatePublicationCandidate = {
  publicId: string;
  title: string;
  updates: { publicId: string; updateNumber: number; status: string }[];
};

export function pcaUpdatesAwaitingPublication(pcas: PcaUpdatePublicationCandidate[]) {
  return pcas.flatMap(pca => pca.updates.filter(update => update.status === "approved_for_publication").map(update => ({ pcaPublicId: pca.publicId, pcaTitle: pca.title, updatePublicId: update.publicId, updateNumber: update.updateNumber })));
}
