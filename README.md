# Sistema ÓRBITA

Plataforma institucional para planejamento, acompanhamento e formalização de contratações públicas. A versão atual implementa o fluxo **DFD → consolidação → PCA → deliberação → publicação → abertura → instauração**, com rastreabilidade, controles LGPD, integração individual ao Google Drive e edição auto-hospedável.

## Tecnologias

| Camada | Implementação |
|---|---|
| Interface | React 19, TypeScript, Vite e Tailwind CSS |
| Servidor | Node.js, Express e tRPC |
| Persistência | MariaDB/MySQL com Drizzle ORM |
| Autenticação local | Senhas com scrypt e sessões JWT |
| Implantação inicial | Docker Compose para Windows |

## Execução local inicial

A edição independente está em [`standalone/`](./standalone). Para uma instalação inicial em computador Windows, siga [`standalone/windows/README.md`](./standalone/windows/README.md). O procedimento completo, incluindo migração, OAuth do Google Drive e primeiro acesso, está em [`docs/implantacao-independente.md`](./docs/implantacao-independente.md).

> Os arquivos `environment`, dumps de banco, volumes Docker e demais segredos não devem ser enviados ao GitHub.

## Desenvolvimento

```bash
corepack enable
pnpm install
pnpm test
pnpm exec tsc --noEmit
pnpm build
```

## Documentação principal

| Tema | Documento |
|---|---|
| Implantação independente | [`docs/implantacao-independente.md`](./docs/implantacao-independente.md) |
| Primeira instalação local | [`docs/primeira-instalacao-local.md`](./docs/primeira-instalacao-local.md) |
| Backup semanal no Windows | [`standalone/windows/README.md`](./standalone/windows/README.md) |
| Fluxo institucional | [`docs/fluxo_dfd_pca_contratacao.md`](./docs/fluxo_dfd_pca_contratacao.md) |

## Segurança operacional

O repositório contém somente código e modelos de configuração. Antes de uma implantação, substitua senhas e tokens de exemplo, mantenha o arquivo `environment` fora do controle de versão e use uma unidade institucional protegida para os backups locais.
