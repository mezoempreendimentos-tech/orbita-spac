import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

export type DemandPdfExportData = {
  demand: {
    publicId: string;
    title: string;
    objectDescription: string;
    justification: string;
    supplyLineCnaeCode: string | null;
    supplyLineCnaeDescription: string | null;
    initialEstimatedValue: string | null;
    desiredContractDate: Date | null;
    deliveryPeriod: string | null;
    budgetRubricCode: string | null;
    budgetAcknowledgedAt: Date | null;
    budgetNote: string | null;
    hasFutureFiscalImpact: boolean;
    requesterCertifiedAt: Date | null;
    createdAt: Date;
  };
  unitName: string;
  requesterName: string | null;
  items: Array<{
    sequence: number;
    title: string;
    objectDescription: string;
    itemJustification: string | null;
    quantity: string | null;
    unitOfMeasure: string | null;
    quantityJustification: string | null;
    estimatedValue: string | null;
    estimatedValueJustification: string | null;
    priceResearchCertifiedAt: Date | null;
  }>;
  verificationCode: string;
  verificationUrl: string;
  verificationQrDataUrl: string;
};

const styles = StyleSheet.create({
  page: { paddingTop: 42, paddingBottom: 48, paddingHorizontal: 42, fontSize: 9, color: "#171A35", fontFamily: "Helvetica" },
  header: { backgroundColor: "#090A20", padding: 18, borderRadius: 8, marginBottom: 18 },
  eyebrow: { color: "#5E82FF", fontSize: 8, fontFamily: "Helvetica-Bold", letterSpacing: 1.2 },
  title: { color: "#ffffff", fontSize: 18, fontFamily: "Helvetica-Bold", marginTop: 7 },
  meta: { color: "#C8C9E1", fontSize: 9, marginTop: 5 },
  section: { border: "1 solid #DFE2EF", borderRadius: 7, padding: 12, marginBottom: 11 },
  sectionTitle: { color: "#367CFF", fontFamily: "Helvetica-Bold", fontSize: 10, marginBottom: 8, textTransform: "uppercase" },
  grid: { display: "flex", flexDirection: "row", flexWrap: "wrap", gap: 8 },
  field: { width: "48%", marginBottom: 7 },
  fieldFull: { width: "100%", marginBottom: 7 },
  label: { color: "#606681", fontFamily: "Helvetica-Bold", fontSize: 7, textTransform: "uppercase", marginBottom: 2 },
  value: { lineHeight: 1.35 },
  item: { padding: 10, backgroundColor: "#F0F2FA", borderRadius: 6, marginTop: 8 },
  itemTitle: { color: "#090A20", fontFamily: "Helvetica-Bold", fontSize: 10, marginBottom: 5 },
  certification: { marginTop: 9, padding: 10, borderRadius: 6, backgroundColor: "#e7f6ef", color: "#176146", lineHeight: 1.4 },
  signature: { marginTop: 8, paddingTop: 10, borderTop: "1 solid #B8BFDA" },
  signatureName: { fontFamily: "Helvetica-Bold", fontSize: 11, marginTop: 4 },
  verification: { display: "flex", flexDirection: "row", gap: 12, alignItems: "center" },
  qr: { width: 76, height: 76 },
  code: { fontFamily: "Courier", fontSize: 7, color: "#9554E8", marginTop: 4 },
  footer: { position: "absolute", bottom: 22, left: 42, right: 42, color: "#606681", fontSize: 7, display: "flex", flexDirection: "row", justifyContent: "space-between" },
});

const money = (value: string | null) => value ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value)) : "Não informado";
const date = (value: Date | null) => value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(value) : "Não informado";

function Field({ label, value, full = false }: { label: string; value: string; full?: boolean }) {
  return <View style={full ? styles.fieldFull : styles.field}><Text style={styles.label}>{label}</Text><Text style={styles.value}>{value}</Text></View>;
}

export function DemandPdfDocument({ data }: { data: DemandPdfExportData }) {
  return <Document title={`DFD ${data.demand.publicId}`} author="Sistema ÓRBITA" subject="Documento de Formalização da Demanda">
    <Page size="A4" style={styles.page}>
      <View style={styles.header}><Text style={styles.eyebrow}>CÂMARA MUNICIPAL DE FOZ DO IGUAÇU · SISTEMA ÓRBITA</Text><Text style={styles.title}>Documento de Formalização da Demanda</Text><Text style={styles.meta}>{data.demand.publicId} · Gerado em {date(new Date())}</Text></View>
      <View style={styles.section}><Text style={styles.sectionTitle}>Identificação da demanda</Text><View style={styles.grid}><Field label="Unidade demandante" value={data.unitName} /><Field label="Linha principal de fornecimento" value={data.demand.supplyLineCnaeCode ? `${data.demand.supplyLineCnaeCode} — ${data.demand.supplyLineCnaeDescription || ""}` : "Não informada"} full /><Field label="Objeto" value={data.demand.title} full /><Field label="Descrição detalhada" value={data.demand.objectDescription} full /><Field label="Justificativa da necessidade" value={data.demand.justification} full /><Field label="Estimativa consolidada do exercício" value={money(data.demand.initialEstimatedValue)} /><Field label="Rubrica orçamentária" value={data.demand.budgetRubricCode || "Ainda não indicada pelo Financeiro"} /><Field label="Ciência financeira" value={data.demand.budgetAcknowledgedAt ? `Registrada em ${date(data.demand.budgetAcknowledgedAt)}` : "Ainda não registrada"} /><Field label="Observação financeira" value={data.demand.budgetNote || "Não informada"} full /><Field label="Impacto em exercícios futuros" value={data.demand.hasFutureFiscalImpact ? "Sim — há gastos previstos para exercícios posteriores." : "Não declarado."} /><Field label="Data desejada" value={date(data.demand.desiredContractDate)} /><Field label="Prazo de entrega ou execução" value={data.demand.deliveryPeriod || "Não informado"} /></View></View>
      <View style={styles.section}><Text style={styles.sectionTitle}>Itens, justificativas e pesquisa prévia</Text>{data.items.map(item => <View key={item.sequence} style={styles.item} wrap={false}><Text style={styles.itemTitle}>{item.sequence}. {item.title}</Text><Field label="Especificação" value={item.objectDescription} full /><Field label="Justificativa do item" value={item.itemJustification || "Não informada"} full /><View style={styles.grid}><Field label="Quantidade" value={item.quantity ? `${item.quantity} ${item.unitOfMeasure || "unidade(s)"}` : "Não informada"} /><Field label="Justificativa da quantidade" value={item.quantityJustification || "Não informada"} /><Field label="Valor estimado" value={money(item.estimatedValue)} /><Field label="Justificativa do valor" value={item.estimatedValueJustification || "Não informada"} /></View><Text style={styles.certification}>{item.priceResearchCertifiedAt ? `Certificação registrada em ${date(item.priceResearchCertifiedAt)}: o preço estimado foi baseado em pesquisa prévia realizada pelo demandante.` : "Certificação de pesquisa prévia não registrada."}</Text></View>)}</View>
      <View style={styles.section}><Text style={styles.sectionTitle}>Assinatura institucional do solicitante</Text><Text style={styles.value}>Declaração eletrônica de responsabilidade pelas informações, itens, justificativas, quantitativos e pesquisas prévias desta DFD.</Text><View style={styles.signature}><Text style={styles.label}>Solicitante identificado no Sistema ÓRBITA</Text><Text style={styles.signatureName}>{data.requesterName || "Usuário institucional"}</Text><Text style={styles.value}>Assinatura institucional registrada em {date(data.demand.requesterCertifiedAt)}.</Text></View></View>
      <View style={styles.section}><Text style={styles.sectionTitle}>Autenticidade e verificação</Text><View style={styles.verification}><Image src={data.verificationQrDataUrl} style={styles.qr} /><View><Text style={styles.value}>Leia o QR Code ou consulte o endereço de verificação abaixo para confirmar a autenticidade e a versão desta DFD.</Text><Text style={styles.code}>{data.verificationCode}</Text><Text style={styles.value}>{data.verificationUrl}</Text></View></View></View>
      <View style={styles.footer} fixed><Text>Sistema ÓRBITA · Documento institucional gerado eletronicamente</Text><Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} /></View>
    </Page>
  </Document>;
}
