export type LocalAccountFilterStatus = "all" | "active" | "inactive";

type SearchableLocalAccount = { name: string | null; email: string | null; active: boolean };

const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").trim();

export function filterLocalAccounts<T extends SearchableLocalAccount>(accounts: T[], query: string, status: LocalAccountFilterStatus) {
  const normalizedQuery = normalize(query);
  return accounts.filter(account => {
    const matchesStatus = status === "all" || (status === "active" ? account.active : !account.active);
    const haystack = normalize(`${account.name ?? ""} ${account.email ?? ""}`);
    return matchesStatus && (!normalizedQuery || haystack.includes(normalizedQuery));
  });
}
