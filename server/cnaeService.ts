type IbgeCnaeClass = { id: string; descricao: string };
type IbgeCnaeSubclass = {
  id: string;
  descricao: string;
  classe?: { id: string; descricao: string };
};
type CnaeSearchResult = { code: string; description: string; label: string };
export type CnaeSubclassSearchResult = {
  code: string;
  description: string;
  classCode: string;
  classDescription: string;
  sourceUrl: string;
  sourceVersion: string;
  label: string;
};

const CNAE_CLASSES_URL = "https://servicodados.ibge.gov.br/api/v2/cnae/classes";
const CNAE_SUBCLASSES_URL = "https://servicodados.ibge.gov.br/api/v2/cnae/subclasses";
const CNAE_SOURCE_VERSION = "IBGE API CNAE v2 · subclasses";
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
let cache: { expiresAt: number; classes: IbgeCnaeClass[] } | null = null;
let subclassCache: { expiresAt: number; subclasses: IbgeCnaeSubclass[] } | null = null;

function normalized(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function digits(value: string) {
  return value.replace(/\D/g, "");
}

function formatSubclassCode(value: string) {
  const code = digits(value);
  return code.length === 7 ? `${code.slice(0, 4)}-${code.slice(4, 5)}/${code.slice(5)}` : value;
}

async function loadCnaeClasses() {
  if (cache && cache.expiresAt > Date.now()) return cache.classes;
  const response = await fetch(CNAE_CLASSES_URL, { signal: AbortSignal.timeout(12_000), headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error("A consulta oficial de CNAE está indisponível no momento. Tente novamente em instantes.");
  const classes = await response.json() as IbgeCnaeClass[];
  cache = { classes, expiresAt: Date.now() + CACHE_TTL_MS };
  return classes;
}

async function loadCnaeSubclasses() {
  if (subclassCache && subclassCache.expiresAt > Date.now()) return subclassCache.subclasses;
  const response = await fetch(CNAE_SUBCLASSES_URL, { signal: AbortSignal.timeout(15_000), headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error("A consulta oficial de subclasses CNAE está indisponível no momento. Tente novamente em instantes.");
  const subclasses = await response.json() as IbgeCnaeSubclass[];
  subclassCache = { subclasses, expiresAt: Date.now() + CACHE_TTL_MS };
  return subclasses;
}

export async function searchOfficialCnaeClasses(query: string): Promise<CnaeSearchResult[]> {
  const term = normalized(query.trim());
  if (term.length < 2) return [];
  const classes = await loadCnaeClasses();
  return classes.filter(item => normalized(item.id).includes(term) || normalized(item.descricao).includes(term)).slice(0, 20).map(item => ({ code: item.id, description: item.descricao, label: `${item.id} — ${item.descricao}` }));
}

function mapSubclass(item: IbgeCnaeSubclass): CnaeSubclassSearchResult {
  const code = formatSubclassCode(item.id);
  const classCode = item.classe?.id ?? "";
  const classDescription = item.classe?.descricao ?? "";
  return {
    code,
    description: item.descricao,
    classCode,
    classDescription,
    sourceUrl: CNAE_SUBCLASSES_URL,
    sourceVersion: CNAE_SOURCE_VERSION,
    label: `${code} — ${item.descricao}`,
  };
}

export async function getOfficialCnaeSubclassByCode(value: string): Promise<CnaeSubclassSearchResult | undefined> {
  const code = digits(value);
  if (code.length !== 7) return undefined;
  const subclasses = await loadCnaeSubclasses();
  const item = subclasses.find(candidate => digits(candidate.id) === code);
  return item ? mapSubclass(item) : undefined;
}

export async function searchOfficialCnaeSubclasses(query: string): Promise<CnaeSubclassSearchResult[]> {
  const term = normalized(query.trim());
  const codeTerm = digits(query.trim());
  if (term.length < 2 && codeTerm.length < 2) return [];
  const subclasses = await loadCnaeSubclasses();
  return subclasses.filter(item => {
    const classDescription = item.classe?.descricao ?? "";
    return (codeTerm.length >= 2 && digits(item.id).startsWith(codeTerm)) || normalized(item.descricao).includes(term) || normalized(classDescription).includes(term);
  }).slice(0, 20).map(mapSubclass);
}

export function resetCnaeCachesForTests() {
  cache = null;
  subclassCache = null;
}
