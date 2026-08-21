export type MapaDateField = "createdAt" | "updatedAt";
export type MapaDeadline = { dueAt?: Date | string | null };
export type MapaFilterItem = { unitNames: string[]; createdAt?: Date | string | null; updatedAt?: Date | string | null; deadlineAlerts: MapaDeadline[] };

function timestamp(value: Date | string | null | undefined) {
  if (!value) return null;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : null;
}

export function filterMapaItems<T extends MapaFilterItem>(items: T[], input: { unitName: string; dateField: MapaDateField; startDate?: string; endDate?: string }) {
  const start = input.startDate ? timestamp(`${input.startDate}T00:00:00`) : null;
  const end = input.endDate ? timestamp(`${input.endDate}T23:59:59.999`) : null;
  return items.filter(item => {
    const unitMatches = !input.unitName || item.unitNames.includes(input.unitName);
    const value = timestamp(item[input.dateField]);
    const startMatches = start === null || (value !== null && value >= start);
    const endMatches = end === null || (value !== null && value <= end);
    return unitMatches && startMatches && endMatches;
  });
}

export function deadlineSummary(alerts: MapaDeadline[], now = new Date()) {
  const nowValue = now.getTime();
  return alerts.reduce((summary, alert) => {
    const dueAt = timestamp(alert.dueAt);
    if (dueAt === null) return summary;
    if (dueAt < nowValue) summary.overdue += 1;
    else summary.pending += 1;
    return summary;
  }, { pending: 0, overdue: 0 });
}
