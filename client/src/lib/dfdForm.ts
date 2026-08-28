/**
 * Helpers compartilhados pelo formulário de DFD.
 *
 * Centralizar aqui evita poluir o Home.tsx e mantém as regras de parsing/
 * normalização num único lugar — se o backend mudar o schema Zod, ajustamos
 * só a função de tradução de erro.
 */

type ZodIssue = {
  origin?: "string" | "number" | "array" | "object" | "unknown";
  code?: string;
  path?: (string | number)[];
  message?: string;
  minimum?: number;
  maximum?: number;
  inclusive?: boolean;
  format?: string;
  pattern?: string;
};

const FIELD_LABELS: Record<string, string> = {
  unitId: "unidade demandante",
  annualPlanItemId: "item do PCA",
  title: "objeto resumido",
  objectDescription: "descrição detalhada",
  justification: "justificativa da necessidade",
  supplyLineCnaeCode: "linha de fornecimento (CNAE)",
  desiredContractDate: "data desejada",
  deliveryPeriod: "prazo pretendido",
  isSupervening: "classificação da necessidade",
  planningJustification: "justificativa do planejamento",
  containsPersonalData: "sinalização de dados pessoais",
  containsSensitiveData: "sinalização de dados sensíveis",
  privacyContext: "contexto de privacidade",
  items: "itens da DFD",
  estimatedValue: "valor estimado",
  quantity: "quantidade",
  unitOfMeasure: "unidade de medida",
  itemJustification: "justificativa do item",
  quantityJustification: "justificativa da quantidade",
  estimatedValueJustification: "justificativa do valor",
  priceResearchCertified: "certificação de pesquisa prévia",
  objetoTipo: "tipo de objeto",
  deliveryDays: "prazo de entrega (dias)",
  serviceStartDate: "data de início do serviço",
  serviceDurationMonths: "duração do serviço (meses)",
  serviceEndDate: "data limite do serviço",
};

function describePath(path: (string | number)[] | undefined): string {
  if (!path || path.length === 0) return "campo";
  const parts = path.map(segment => {
    if (typeof segment === "number") return `#${segment + 1}`;
    return FIELD_LABELS[segment] ?? segment;
  });
  return parts.join(" › ");
}

function translateIssue(issue: ZodIssue): string {
  const where = describePath(issue.path);
  if (issue.code === "too_small") {
    if (issue.origin === "number") {
      return `${where}: número precisa ser maior${issue.inclusive ? " ou igual" : ""} a ${issue.minimum}.`;
    }
    if (issue.origin === "array") {
      return `${where}: inclua ao menos ${issue.minimum} item(ns).`;
    }
    if (issue.origin === "string") {
      return `${where}: precisa ter no mínimo ${issue.minimum} caractere(s).`;
    }
  }
  if (issue.code === "too_big") {
    if (issue.origin === "string") {
      return `${where}: excedeu o limite de ${issue.maximum} caractere(s).`;
    }
  }
  if (issue.code === "invalid_format") {
    if (issue.format === "regex") {
      return `${where}: formato inválido. Use números com até 2 casas decimais (ex.: 1500.00).`;
    }
    if (issue.format === "email") {
      return `${where}: e-mail inválido.`;
    }
  }
  if (issue.code === "invalid_type") {
    return `${where}: tipo de dado inválido.`;
  }
  if (issue.code === "invalid_string") {
    return `${where}: ${issue.message ?? "valor de texto inválido"}.`;
  }
  if (issue.code === "unrecognized_keys") {
    return `${where}: campo não reconhecido.`;
  }
  if (issue.code === "custom") {
    return `${where}: ${issue.message ?? "valor inválido"}.`;
  }
  if (issue.message) return `${where}: ${issue.message}.`;
  return `${where}: valor inválido.`;
}

/**
 * Tenta extrair e traduzir erros de validação Zod a partir da mensagem de
 * erro do tRPC. O backend devolve o array `data.zodError.fieldErrors` quando
 * a validação falha; se não estiver presente, devolve a mensagem original.
 */
export function formatTrpcError(error: unknown): string {
  if (!error) return "Erro desconhecido.";
  if (typeof error === "string") return error;
  const e = error as { message?: string; data?: { zodError?: { fieldErrors?: Record<string, string[]>; issues?: ZodIssue[] } } };
  if (e.data?.zodError?.issues?.length) {
    return e.data.zodError.issues.map(translateIssue).join("\n");
  }
  if (e.data?.zodError?.fieldErrors) {
    return Object.entries(e.data.zodError.fieldErrors)
      .map(([field, messages]) => `${describePath([field])}: ${messages.join(", ")}`)
      .join("\n");
  }
  if (e.message) return e.message;
  return "Erro desconhecido.";
}

/**
 * Normaliza um valor decimal digitado pelo usuário.
 *
 * Aceita formatos brasileiros e americanos:
 *   "1500,00"  -> "1500.00"
 *   "1.500,00" -> "1500.00"
 *   "1500.00"  -> "1500.00"
 *   "1500"     -> "1500"
 *   "1,5"      -> "1.5"
 *   ""         -> ""
 *
 * Remove caracteres não numéricos exceto o último separador (vírgula ou
 * ponto) que vira ponto. Se houver múltiplos separadores, considera o
 * último como decimal (formato americano: "1,500.00" = 1500.00).
 */
export function normalizeDecimal(value: string): string {
  if (!value) return "";
  // Se tem ambos . e ,: o último é o separador decimal
  const hasComma = value.includes(",");
  const hasDot = value.includes(".");
  if (hasComma && hasDot) {
    if (value.lastIndexOf(",") > value.lastIndexOf(".")) {
      // formato BR: "1.500,00" -> remove pontos, troca vírgula por ponto
      return value.replace(/\./g, "").replace(",", ".");
    }
    // formato US: "1,500.00" -> remove vírgulas
    return value.replace(/,/g, "");
  }
  if (hasComma) {
    // só vírgula: "1500,00" -> "1500.00"
    return value.replace(",", ".");
  }
  return value;
}

/**
 * Converte string de input numérico para number, retornando undefined para
 * strings vazias ou inválidas. Usado para `annualPlanItemId` e similares
 * que o Zod aceita como number() mas o form envia como string (ou omitido).
 */
export function optionalNumber(value: string | number | null | undefined): number | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

/**
 * Converte uma data em formato ISO ("YYYY-MM-DD") para Date em horário
 * neutro (12:00 UTC) para evitar o off-by-one de timezone.
 */
export function parseLocalDate(value: string): Date | undefined {
  if (!value) return undefined;
  const d = new Date(`${value}T12:00:00`);
  return Number.isNaN(d.getTime()) ? undefined : d;
}
