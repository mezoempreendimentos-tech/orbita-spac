export type DashboardAlertIdentity = { id: number | string; source: "process" | "planning" };

export function dashboardAlertKey(alert: DashboardAlertIdentity) {
  return `${alert.source}-${alert.id}`;
}
