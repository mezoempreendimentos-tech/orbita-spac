import { renderToBuffer } from "@react-pdf/renderer";
import * as QRCode from "qrcode";
import { describe, expect, it } from "vitest";
import { DemandPdfDocument } from "./DemandPdfDocument";

describe("PDF institucional da DFD", () => {
  it("gera um arquivo PDF com os dados, itens e assinatura institucional", async () => {
    const verificationQrDataUrl = await QRCode.toDataURL("https://orbitavisual-pte9ypdg.manus.space/api/public/dfd-verification?code=teste");
    const buffer = await renderToBuffer(<DemandPdfDocument data={{
      demand: { publicId: "DFD-2027-001", title: "Aquisição de mobiliário", objectDescription: "Mobiliário para postos administrativos.", justification: "Substituição de bens sem condições de uso.", supplyLineCnaeCode: "3101-2", supplyLineCnaeDescription: "FABRICAÇÃO DE MÓVEIS", initialEstimatedValue: "1500.00", desiredContractDate: new Date("2027-03-10T12:00:00Z"), deliveryPeriod: "30 dias", hasFutureFiscalImpact: true, budgetRubricCode: "339039", budgetAcknowledgedAt: new Date("2026-08-21T12:00:00Z"), budgetNote: "Despesa corrente prevista para o exercício.", requesterCertifiedAt: new Date("2026-08-20T12:00:00Z"), createdAt: new Date("2026-08-20T12:00:00Z") },
      unitName: "Diretoria Administrativa",
      requesterName: "Servidor institucional",
      items: [{ sequence: 1, title: "Cadeira ergonômica", objectDescription: "Cadeira com apoio lombar.", itemJustification: "Adequação dos postos de trabalho.", quantity: "2", unitOfMeasure: "unidade", quantityJustification: "Dois postos sem mobiliário adequado.", estimatedValue: "750.00", estimatedValueJustification: "Pesquisa prévia registrada.", priceResearchCertifiedAt: new Date("2026-08-20T12:00:00Z") }],
      verificationCode: "CODIGO-DE-VERIFICACAO",
      verificationUrl: "https://orbitavisual-pte9ypdg.manus.space/api/public/dfd-verification?code=teste",
      verificationQrDataUrl,
    }} />);
    expect(Buffer.from(buffer).subarray(0, 4).toString()).toBe("%PDF");
  });
});
