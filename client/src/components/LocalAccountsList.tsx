type Account = {
  id: number;
  name: string | null;
  email: string | null;
  role: "user" | "admin";
  active: boolean;
  lastSignedIn: Date;
};

export default function LocalAccountsList({
  accounts,
  onManage,
}: {
  accounts: Account[];
  onManage: (id: number) => void;
}) {
  return (
    <ul className="accounts-directory" aria-label="Contas cadastradas">
      <li className="accounts-directory-row accounts-directory-row--head" aria-hidden="true">
        <span>Conta</span>
        <span>Acesso à plataforma</span>
        <span>Situação</span>
        <span>Ações</span>
      </li>
      {accounts.map(account => {
        const initials = (account.name || account.email || "?")
          .slice(0, 1)
          .toUpperCase();
        const lastAccess =
          Number.isFinite(account.lastSignedIn.getTime()) &&
          account.lastSignedIn.getTime() > 0
            ? new Intl.DateTimeFormat("pt-BR", {
                dateStyle: "short",
                timeStyle: "short",
              }).format(account.lastSignedIn)
            : "ainda não acessou";
        return (
          <li className="accounts-directory-row" key={account.id}>
            <div className="accounts-directory-cell accounts-directory-identity">
              <span className="accounts-directory-avatar" aria-hidden="true">{initials}</span>
              <div className="accounts-directory-identity-text">
                <strong>{account.name || "Sem nome"}</strong>
                <span className="accounts-directory-email">{account.email || "E-mail não informado"}</span>
                <small className="accounts-directory-meta">Último acesso: {lastAccess}</small>
              </div>
            </div>
            <div className="accounts-directory-cell">
              <span className="accounts-directory-mobile-label">Acesso à plataforma</span>
              <span
                className={`accounts-access-badge ${account.role === "admin" ? "accounts-access-admin" : ""}`}
              >
                {account.role === "admin" ? "Administrador" : "Usuário"}
              </span>
              <small className="accounts-directory-meta">
                {account.role === "admin" ? "Administrador da plataforma" : "Sem perfil de processo"}
              </small>
            </div>
            <div className="accounts-directory-cell">
              <span className="accounts-directory-mobile-label">Situação</span>
              <span
                className={`accounts-state-badge ${account.active ? "accounts-state-active" : ""}`}
              >
                <i aria-hidden="true" />
                {account.active ? "Ativa" : "Inativa"}
              </span>
            </div>
            <div className="accounts-directory-cell accounts-directory-actions">
              <button
                className="button button-outline accounts-directory-manage"
                type="button"
                onClick={() => onManage(account.id)}
                aria-label={`Gerenciar conta de ${account.name || account.email || account.id}`}
              >
                Gerenciar
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
