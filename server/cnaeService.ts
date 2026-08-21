type IbgeCnaeClass = { id: string; descricao: string };
type CnaeSearchResult = { code: string; description: string; label: string };

const CNAE_CLASSES_URL = "https://servicodados.ibge.gov.br/api/v2/cnae/classes";
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
let cache: { expiresAt: number; classes: IbgeCnaeClass[] } | null = null;

function normalized(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

async function loadCnaeClasses() {
  if (cache && cache.expiresAt > Date.now()) return cache.classes;
  const response = await fetch(CNAE_CLASSES_URL, { signal: AbortSignal.timeout(12_000), headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error("A consulta oficial de CNAE está indisponível no momento. Tente novamente em instantes.");
  const classes = await response.json() as IbgeCnaeClass[];
  cache = { classes, expiresAt: Date.now() + CACHE_TTL_MS };
  return classes;
}

export async function searchOfficialCnaeClasses(query: string): Promise<CnaeSearchResult[]> {
  const term = normalized(query.trim());
  if (term.length < 2) return [];
  const classes = await loadCnaeClasses();
  return classes.filter(item => normalized(item.id).includes(term) || normalized(item.descricao).includes(term)).slice(0, 20).map(item => ({ code: item.id, description: item.descricao, label: `${item.id} — ${item.descricao}` }));
}
