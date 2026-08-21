export type DfdExportRow = {
  publicId: string;
  title: string;
  unitName: string;
  estimatedValue: string | number | null | undefined;
  origin: "DFD isolada" | "Já consolidada";
  status: string;
};

function normalized(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

export function matchesDfdSearch(row: Pick<DfdExportRow, "publicId" | "title">, query: string) {
  const term = normalized(query);
  return !term || normalized(row.publicId).includes(term) || normalized(row.title).includes(term);
}

function csvCell(value: unknown) {
  const raw = String(value ?? "");
  const protectedValue = /^[=+\-@]/.test(raw) ? `'${raw}` : raw;
  return `"${protectedValue.replace(/"/g, '""')}"`;
}

export function buildDfdCsv(rows: DfdExportRow[]) {
  const header = ["Número da DFD", "Título", "Unidade requisitante", "Estimativa inicial", "Origem", "Situação"];
  const data = rows.map(row => [row.publicId, row.title, row.unitName, row.estimatedValue, row.origin, row.status]);
  return `\uFEFF${[header, ...data].map(row => row.map(csvCell).join(";")).join("\r\n")}`;
}
