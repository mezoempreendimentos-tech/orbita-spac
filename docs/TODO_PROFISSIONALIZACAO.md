# ÓRBITA — profissionalização da interface e acesso pela internet

Solicitação: 11/09/2026. Manter estrutura funcional, três subsistemas, vinte módulos e marca oficial v1.0.0. Este plano complementa o histórico em todo.md.

**Direção aprovada para implementação**

Interface institucional, com hierarquia tipográfica clara, superfícies discretas, espaçamento consistente e cores oficiais com função de orientação. Landing escura; área operacional respeita a preferência do usuário. Preservar SVGs, Noto Sans e significados dos módulos. Não introduzir dados demonstrativos como registros reais.

**1. Primeira entrega visual**

- [x] Substituir o cartão de documentação da landing por uma apresentação do ciclo de contratação.
- [x] Usar o manifesto como fonte dos nomes, pictogramas e agrupamentos da landing.
- [x] Apresentar os vinte módulos sem declarar funcionalidades ainda não entregues.
- [x] Refinar sidebar, cabeçalho, títulos, formulários e superfícies existentes (implementado; revisão autenticada na etapa 2).
- [x] Corrigir nomes acessíveis dos controles e remover grupos recolhidos da tabulação (implementado; teclado autenticado na etapa 2).
- [x] Separar preferência pessoal de tema do tema forçado da landing (implementado; percurso autenticado na etapa 2).
- [x] Dar ao Atlas um destino explícito, sem carregamento interminável.
- [x] Verificar landing e login em desktop e 360 px no navegador; executar TypeScript e build completo.

**2. Validação no ambiente operacional**

- [x] Recuperar ou iniciar o banco existente, sem recriar volumes nem inserir dados oficiais.
- [ ] Revisar Águia, Porta, Agenda e Mapa autenticados em claro e escuro.
- [ ] Validar salvar rascunho, revisar DFD, consultar processo e abrir anexos.
- [ ] Verificar tabelas extensas, erros, estados vazios, carregamento e teclado.
- [ ] Alinhar Lastro e Oráculo ao significado do manifesto preservando acesso às funções existentes.
- [ ] Preservar contexto de processo na URL e histórico do navegador.

**3. Preparação para acesso externo**

- [x] Bloquear troca do próprio e-mail para endereço mestre reservado e acesso de conta inativa.
- [x] Validar cookies e login de ambas as contas pelo endereço HTTPS externo.
- [ ] Implementar revogação geral de sessões após redefinição de senha.
- [x] Exigir sessão nos downloads e corrigir caminhos de arquivo no Windows.
- [ ] Validar autorização granular por documento e publicações deliberadamente públicas.
- [x] Executar regressões de autenticação, autorização e download (10 testes aprovados).
- [x] Rodar build de produção com configuração local privada e porta definida.
- [x] Iniciar servidor e túnel ngrok sem dependência desta conversa.
- [x] Verificar endereço externo, health, login e consulta autenticada ao workspace.
- [ ] Validar navegação completa e anexos em um segundo computador.
- [x] Documentar iniciar, parar, diagnosticar e recuperar o túnel em OPERACAO_TESTE_LOCAL.md.

**Aceite final**

Acesso HTTPS em outro computador, com login institucional, dados persistentes e anexos autorizados; os três subsistemas e seus pictogramas preservados; interface utilizável em desktop e celular. Um túnel apontado apenas à landing não conta como entrega operacional completa. Disponibilidade depende de computador hospedeiro ligado, rede, banco, servidor e túnel ativos.

**Registro da primeira entrega**

Landing e login revistos em desktop e 360 × 800. Vinte módulos presentes, sem SVGs quebrados ou transbordamento horizontal global na checagem móvel. Navegação por âncoras conferida. TypeScript, Vite e esbuild passaram; caminhos das fontes corrigidos. O build mantém avisos sobre tamanho dos bundles existentes. A suíte completa não foi repetida nesta etapa visual; as oito falhas previamente identificadas nos testes por strings de layout permanecem pendentes.

O Docker estava desligado. Docker Desktop iniciado sem manipulação de volumes; a consulta de containers permaneceu sem resposta e foi interrompida. O ngrok está instalado, mas nenhum túnel foi ativado nesta etapa. O acesso operacional pela internet continua pendente das etapas 2 e 3. Não foram alterados dados institucionais ou credenciais.

**Atualização — recuperação para teste, 11/09/2026:** resolvidos os sockets travados do Docker; banco existente reconectado à rede da aplicação. Build atualizado, contas solicitadas configuradas e túnel HTTPS ativo. Logins de Mezo e Débora e workspace validados pela URL externa. Detalhes e limites em [OPERACAO_TESTE_LOCAL.md](OPERACAO_TESTE_LOCAL.md). O registro anterior descreve a primeira etapa e foi preservado como histórico.
