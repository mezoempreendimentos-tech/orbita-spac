# Histórico de versões

## Gerenciamento de contas — 2026-09-11

- Substituídos os cartões genéricos de catálogo por lista com colunas próprias para identidade, acesso à plataforma, situação e ações. As regras genéricas de grid e margem dos cartões comprimiam os dados e desalinhavam o rótulo Administrador.
- Layout móvel com rótulos explícitos, quebra de e-mails longos e ações em largura disponível; tokens oficiais preservados em orbita-accounts.css.
- Correção do reset dos formulários após operações assíncronas e mensagens de sucesso anunciadas por role=status.
- Evidência: inspeção desktop e 360 px, filtro por e-mail, oito testes de políticas/filtros/autorização, TypeScript e build Vite.

## Integração no produto — 2026-09-11

- Motivo: profissionalização da apresentação institucional e dos controles, mantendo a identidade v1.0.0.
- Responsável: Codex, a pedido do mantenedor. Sem alteração de cores, nomes ou SVGs oficiais.
- Landing extraída para InstitutionalLanding, com módulos derivados do manifesto e apresentação do ciclo de contratação.
- Login passa a usar a assinatura oficial, com versão por tema; correção dos caminhos das fontes locais.
- Camada orbita-institutional.css refina os componentes existentes com tokens oficiais e controles acessíveis.
- Evidência: TypeScript e build Vite; landing inspecionada em desktop e 360 px, com 20 módulos e sem imagens quebradas. Validação autenticada e túnel acompanhados em docs/TODO_PROFISSIONALIZACAO.md.

## 1.0.0 - 2026-08-26

- Primeiro pacote de implementação da ÓRBITA.
- Inclusão das três hierarquias de assinatura da marca.
- Inclusão de ativos dos 3 subsistemas e 20 módulos.
- Exportação de pictogramas em 16, 20, 24 e 32 px.
- Inclusão de tokens em JSON, CSS, SCSS e TypeScript.
- Inclusão de estilos-base, componentes e tela demonstrativa.
- Inclusão de guias de integração, acessibilidade e governança.
