import { Download } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { demandPdfFileName } from "@shared/demandPdfExport";

export function DemandPdfExportAction({ demandPublicId }: { demandPublicId: string }) {
  const detail = trpc.planning.demandControl.useQuery({ demandPublicId });
  const verification = trpc.planning.demandPdfVerification.useQuery({ demandPublicId });
  const saveToDrive = trpc.procurement.saveDemandPdfToDrive.useMutation();
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const buildPdf = async () => {
    if (!detail.data || !verification.data) throw new Error("A verificação institucional ainda não está disponível.");
    const [{ pdf }, { DemandPdfDocument }, QRCode] = await Promise.all([import("@react-pdf/renderer"), import("./DemandPdfDocument"), import("qrcode")]);
    const verificationQrDataUrl = await QRCode.toDataURL(verification.data.verificationUrl, { width: 220, margin: 1, errorCorrectionLevel: "M" });
    return pdf(<DemandPdfDocument data={{ ...detail.data, demand: { ...detail.data.demand, objectDescription: detail.data.documentObjectDescription }, verificationCode: verification.data.code, verificationUrl: verification.data.verificationUrl, verificationQrDataUrl }} />).toBlob();
  };
  const exportPdf = async () => {
    const publicId = detail.data?.demand.publicId;
    if (!publicId) return;
    setIsExporting(true);
    setError(null);
    try {
      const blob = await buildPdf();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = demandPdfFileName(publicId);
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível gerar o PDF da DFD.");
    } finally {
      setIsExporting(false);
    }
  };
  const savePdf = async () => {
    const publicId = detail.data?.demand.publicId;
    if (!detail.data?.process || !publicId) return;
    setIsExporting(true);
    setError(null);
    try {
      const blob = await buildPdf();
      const contentBase64 = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error("Não foi possível preparar o PDF para envio.")); reader.readAsDataURL(blob); });
      const result = await saveToDrive.mutateAsync({ demandPublicId, fileName: demandPdfFileName(publicId), contentBase64 });
      window.open(result.fileUrl, "_blank", "noopener,noreferrer");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível salvar o PDF no Google Drive.");
    } finally {
      setIsExporting(false);
    }
  };
  if (detail.isLoading || detail.error || !detail.data || verification.isLoading) return null;
  return <div className="demand-pdf-export-action"><button className="button button-ink button-sm" type="button" disabled={isExporting || !verification.data} onClick={exportPdf}><Download size={14} /> {isExporting ? "Gerando PDF…" : "Exportar DFD em PDF"}</button>{detail.data.process ? <button className="button button-outline button-sm" type="button" disabled={isExporting || !verification.data || saveToDrive.isPending} onClick={savePdf}>{saveToDrive.isPending ? "Salvando no Drive…" : "Salvar na pasta do processo"}</button> : <small>O envio ao Drive ficará disponível após a instauração do processo.</small>}{error ? <small className="form-error">{error}</small> : <small>Inclui QR Code, código verificável, itens, certificações e assinatura institucional.</small>}</div>;
}
