export type OpeningAnalysisCandidate = {
  pcaItemId: number;
  demandId?: number | null;
  title: string;
  cnaeFinalCode?: string | null;
  cnaeOriginalCode?: string | null;
  cnaeBaseCode?: string | null;
  estimatedValue?: string | number | null;
};

export type OpeningAnalysisMatch = OpeningAnalysisCandidate & {
  matchType: "same_subclass" | "same_original_subclass" | "same_base_class" | "similar_object_terms";
  matchingTerms: string[];
};

const ignoredTerms = new Set([
  "a", "as", "ao", "aos", "da", "das", "de", "do", "dos", "e", "em", "na", "nas", "no", "nos", "o", "os", "para", "por", "que", "um", "uma", "uns", "umas",
  "aquisicao", "aquisicoes", "contratacao", "contratacoes", "contratar", "servico", "servicos", "material", "materiais", "necessidade", "necessidades", "objeto", "itens", "item", "fornecimento", "fornecer",
]);

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
}

export function relevantObjectTerms(value: string) {
  return Array.from(new Set(normalize(value).replace(/[^a-z0-9]+/g, " ").split(/\s+/).filter(term => term.length >= 4 && !ignoredTerms.has(term))));
}

function sameCode(first?: string | null, second?: string | null) {
  if (!first || !second) return false;
  return normalize(first).replace(/[^a-z0-9]/g, "") === normalize(second).replace(/[^a-z0-9]/g, "");
}

export function analyzePcaOpeningMatches(target: OpeningAnalysisCandidate, candidates: OpeningAnalysisCandidate[]): OpeningAnalysisMatch[] {
  const targetTerms = relevantObjectTerms(target.title);
  const matches: OpeningAnalysisMatch[] = [];
  for (const candidate of candidates) {
    if (candidate.pcaItemId === target.pcaItemId) continue;
    const push = (matchType: OpeningAnalysisMatch["matchType"], matchingTerms: string[] = []) => {
      if (!matches.some(item => item.pcaItemId === candidate.pcaItemId && item.matchType === matchType)) matches.push({ ...candidate, matchType, matchingTerms });
    };
    if (sameCode(target.cnaeFinalCode, candidate.cnaeFinalCode)) push("same_subclass");
    if (sameCode(target.cnaeOriginalCode, candidate.cnaeOriginalCode)) push("same_original_subclass");
    if (sameCode(target.cnaeBaseCode, candidate.cnaeBaseCode)) push("same_base_class");
    const candidateTerms = relevantObjectTerms(candidate.title);
    const overlap = targetTerms.filter(term => candidateTerms.includes(term));
    if (overlap.length >= 2) push("similar_object_terms", overlap);
  }
  return matches;
}

export function hasRequiredOpeningAnalysis(analysisAcknowledged: boolean, alertsFound: boolean, formalJustification?: string | null) {
  if (!analysisAcknowledged) return false;
  return !alertsFound || Boolean(formalJustification?.trim());
}
