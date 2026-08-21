export type SourceDfd = {
  reference: string;
  title: string;
  estimatedValue: string;
  desiredDate: string;
  sourceStatus: string;
  sourceLink: string;
};

export function importedDemandPublicId(reference: string) {
  return `DFD-IMP-${reference.trim().replace(/[^0-9A-Za-z]+/g, "-").replace(/^-|-$/g, "").toUpperCase()}`;
}

export function parseBrazilianCurrency(value: string) {
  const normalized = value.replace(/R\$/gi, "").replace(/\./g, "").replace(",", ".").trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed.toFixed(2) : undefined;
}

export function parseBrazilianDate(value: string) {
  const match = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return match ? `${match[3]}-${match[2]}-${match[1]} 12:00:00` : undefined;
}

export function mapImportedDfd(source: SourceDfd) {
  const title = source.title.trim().replace(/\s+/g, " ");
  return {
    publicId: importedDemandPublicId(source.reference),
    title,
    objectDescription: `${title}. Registro importado da planilha de controle; complementar especificações técnicas na triagem institucional.`,
    justification: "Importada de registro institucional pré-existente; a justificativa original deverá ser complementada pelo setor requisitante durante a triagem.",
    estimatedValue: parseBrazilianCurrency(source.estimatedValue),
    desiredContractDate: parseBrazilianDate(source.desiredDate),
    planningJustification: `Importação de DFD preexistente. Referência externa: ${source.reference}. Situação de origem: ${source.sourceStatus || "não informada"}. Referência e origem preservadas na trilha de auditoria.`,
  };
}
