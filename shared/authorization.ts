export function canActOnWorkflowByRole(platformRole: "user" | "admin", processRoles: string[], requiredRole: string) {
  return platformRole === "admin" || processRoles.includes("administrador") || processRoles.includes(requiredRole);
}
