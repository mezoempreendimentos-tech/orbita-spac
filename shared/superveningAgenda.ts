export type SuperveningAgendaDemand = {
  publicId: string;
  isSupervening: boolean;
  status: string;
};

export type SuperveningAgendaAlert = {
  entityType: string;
  entityPublicId: string;
  dueAt?: Date | string | null;
  status: string;
};

const awaitingAdministrativeApproval = new Set(["submitted", "under_review"]);

export function filterSuperveningDemands<T extends { demand: SuperveningAgendaDemand }>(rows: T[], onlySupervening: boolean) {
  return onlySupervening ? rows.filter(row => row.demand.isSupervening) : rows;
}

export function superveningApprovalDeadlineAlerts<T extends { demand: SuperveningAgendaDemand }>(rows: T[], alerts: SuperveningAgendaAlert[]) {
  const alertsByDemand = new Map(alerts.filter(alert => alert.entityType === "demand" && alert.status === "open" && alert.dueAt).map(alert => [alert.entityPublicId, alert]));
  return rows.flatMap(row => {
    if (!row.demand.isSupervening || !awaitingAdministrativeApproval.has(row.demand.status)) return [];
    const alert = alertsByDemand.get(row.demand.publicId);
    return alert ? [{ demandPublicId: row.demand.publicId, dueAt: alert.dueAt! }] : [];
  });
}
