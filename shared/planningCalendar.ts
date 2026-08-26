export const planningCalendarKeys = {
  dfdPreparationStart: "planning.calendar.dfd_preparation_start",
  dfdPreparationEnd: "planning.calendar.dfd_preparation_end",
  dfdConsolidationStart: "planning.calendar.dfd_consolidation_start",
  dfdConsolidationEnd: "planning.calendar.dfd_consolidation_end",
  dfdApprovalStart: "planning.calendar.dfd_approval_start",
  dfdApprovalDeadline: "planning.calendar.dfd_approval_deadline",
} as const;

export const planningCalendarDefinitions = [
  { key: planningCalendarKeys.dfdPreparationStart, label: "Início da confecção de DFDs", description: "Data a partir da qual os setores requisitantes podem preparar e enviar DFDs." },
  { key: planningCalendarKeys.dfdPreparationEnd, label: "Fim da confecção de DFDs", description: "Data limite do ciclo de confecção e envio de DFDs." },
  { key: planningCalendarKeys.dfdConsolidationStart, label: "Início da consolidação de DFDs", description: "Data de início da análise e agrupamento de DFDs pela Diretoria." },
  { key: planningCalendarKeys.dfdConsolidationEnd, label: "Fim da consolidação de DFDs", description: "Data limite para a Diretoria concluir a consolidação das DFDs." },
  { key: planningCalendarKeys.dfdApprovalStart, label: "Início da aprovação de DFDs", description: "Data de abertura da janela de deliberação presidencial." },
  { key: planningCalendarKeys.dfdApprovalDeadline, label: "Prazo final para encaminhamento das DFDs", description: "Ao atingir esta data, toda DFD enviada e ainda não decidida será encaminhada à Presidência, mesmo que esteja devolvida ou sem complementação." },
] as const;

export function parsePlanningCalendarDate(value: string | null | undefined) {
  if (!value?.trim()) return null;
  const parsed = new Date(value.length === 10 ? `${value}T23:59:59.999Z` : value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
