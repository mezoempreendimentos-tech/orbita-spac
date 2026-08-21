# Provisionamento de perfis institucionais

As contas que entram pela autenticação da plataforma são criadas com o papel técnico de plataforma `user`. Esse papel não é, por si só, um perfil funcional de contratação. As permissões do ÓRBITA são concedidas no diretório institucional, por unidade organizacional, na tabela de perfis de processo.

| Etapa | Responsável | Resultado esperado |
|---|---|---|
| Primeiro acesso | Usuário autenticado | A conta passa a constar no diretório de **PERFIS**. |
| Vinculação | Administrador institucional | Um ou mais perfis funcionais são associados à conta e à unidade, por exemplo `demandante`, `compras` ou `administrador`. |
| Reconhecimento | ÓRBITA | A interface e as rotas protegidas verificam os perfis ativos da unidade. O perfil `administrador` institucional autoriza Administração, OFICINA, catálogos, diretório e atualização de prazos, mesmo se a conta mantiver o papel técnico `user`. |

> A correção aplicada nesta iteração ajustou o **reconhecimento de autorização**: os perfis já atribuídos no diretório passam a ser considerados pela interface e pelas rotas administrativas. O sistema não concede automaticamente perfis funcionais a toda conta nova, pois essa concessão precisa respeitar a segregação de funções e uma decisão humana de administração.

Para uma nova conta atuar no sistema, o administrador deve aguardar o primeiro acesso, abrir **PERFIS**, selecionar a conta listada, escolher a unidade e atribuir somente os papéis necessários ao trabalho institucional.
