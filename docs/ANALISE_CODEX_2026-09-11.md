# Avaliação técnica e de produto — ÓRBITA

Data: 11/09/2026. Escopo: leitura do repositório, seis documentos de marca, manifesto, autenticação local, armazenamento, amostra de serviços e testes, CI, instalação e prévia pública no navegador. Não houve alteração no código da aplicação nem em dados institucionais.

**Parecer**

A ÓRBITA tem uma base de domínio relevante: planejamento, DFD, PCA, abertura, responsabilidades, documentos e auditoria já aparecem em serviços e regras testáveis. A identidade aprovada também fornece uma arquitetura de informação útil. A prioridade é tornar a implementação consistente com essa promessa e corrigir falhas de controle de acesso e operação antes de ampliar o catálogo de módulos.

Esta avaliação não certifica segurança, conformidade jurídica ou funcionamento integral em produção. As telas autenticadas foram analisadas no código; não houve acesso a uma sessão operacional ou execução de transações no banco.

**O que preservar**

- Os três subsistemas: Fluxo da Contratação, Transparência e Inteligência e Suporte, com suas cores oficiais e distribuição 10/2/8.
- Os vinte nomes e pictogramas, cada um com seu significado funcional. Lastro sustenta o orçamento; Oráculo representa análise jurídica; Memória preserva rastreabilidade. Esses significados devem orientar funcionalidades e localização dos documentos.
- As assinaturas oficiais, suas versões negativas, Noto Sans local, tokens, tamanhos e estados acessíveis. O componente Wordmark já seleciona os ativos por tema.
- A landing escura e a preferência de tema no ambiente operacional, conforme briefing.
- As verificações de papel no backend, transações já presentes em operações de planejamento e registros de auditoria. São pontos de apoio para evolução incremental.

**Achados prioritários — segurança e operação**

1. **P0 — Promoção administrativa condicionada a e-mail editável.** `server/selfhost/localAuthRoutes.ts:43` permite ao usuário alterar seu próprio e-mail, verificando duplicidade. `server/selfhost/localAuth.ts:52` concede papel admin aos endereços mestres fixos. Se um desses endereços estiver livre, a combinação permite a uma conta comum assumir esse endereço e receber papel administrativo no próximo login. O caminho está identificado no código; não foi explorado em banco real. Proposta: concessão administrativa por identidade estável e ação autorizada, sem promoção derivada de campo editável; preservar os administradores institucionais legítimos. Aceite: alterar o próprio e-mail nunca concede privilégios, inclusive com endereço reservado ainda não cadastrado.

2. **P1 — Inativação não encerra efetivamente o acesso da sessão existente.** `server/selfhost/localAuth.ts:71` retorna o usuário sem conferir `active`. O middleware protegido exige somente usuário presente. O login confere atividade, mas requisições posteriores não. Tokens duram 12 horas. Redefinir a senha também não muda um identificador de versão de sessão. Proposta: rejeitar conta inativa em cada autenticação e implementar revogação de sessões. Aceite: cookie anterior à inativação deixa de acessar qualquer procedimento protegido; redefinição de senha revoga sessões conforme política explícita.

3. **P1 — Arquivos de processo são servidos sem autorização.** `server/selfhost/localStorageRoutes.ts:6` publica `/files/*` sem autenticação ou consulta da permissão do documento. `server/storage.ts:48` chama de URL assinada um endereço público sem assinatura. Uploads de planejamento e processo usam esse armazenamento. Em ambiente em que a rota funciona, conhecer a URL basta para solicitar o arquivo, independentemente das regras de leitura do processo. Não foi baixado documento institucional para testar isso. Proposta: separar publicação deliberada de documento público e download autenticado de anexo interno, aplicando autorização ao documento. Aceite: anônimo recebe somente artefatos efetivamente publicados; usuário sem acesso ao processo não obtém seus anexos.

4. **P1 — Upload e download local falham em Windows.** `server/storage.ts:34` e `server/selfhost/localStorageRoutes.ts:10` comparam caminhos resolvidos com prefixo terminado em `/`. No Windows, `path.resolve` produz separadores `\`. Reprodução local com `data/files/exemplo.pdf`: caminho interno legítimo foi rejeitado (`accepted: false`). Proposta: validar contenção com operações de caminho portáveis e rejeitar escapes e caminhos absolutos. Aceite: arquivo interno funciona em Windows e Linux; tentativas de sair da raiz continuam bloqueadas.

5. **P1 — Instalação pode iniciar com migrations incompletas.** `standalone/entrypoint.sh:67` canaliza a migração para `tail`, e a validação final aceita qualquer banco com pelo menos uma tabela (`:74`). Um banco parcialmente migrado pode satisfazer essa condição. Proposta: preservar o resultado e log da migração e validar a versão esperada do schema; eventual exceção de ferramenta deve exigir evidência específica de conclusão. Aceite: falha deliberada de migration interrompe a inicialização com diagnóstico; instalação limpa e atualização são exercitadas.

6. **P1 — Testes não bloqueiam a entrega.** `.github/workflows/ci.yml:76` usa `continue-on-error: true` para toda a etapa, embora o comentário justifique apenas testes de credenciais Google. Proposta: tornar os testes obrigatórios; separar integrações dependentes de configuração e tratá-las explicitamente. Aceite: falha em autorização, DFD ou marca impede aprovação do pipeline, sem exigir credenciais externas para testes unitários.

**Achados de produto e marca**

7. **P1 — Os destinos não correspondem integralmente ao manifesto.** Em `client/src/pages/Home.tsx:1921`, Lastro é “Documentos vinculados”, em vez de dotação e adequação orçamentária. Em `:1987`, Oráculo encaminha para PrivacyPage. Atlas consta no menu (`:522`) e nas telas válidas, mas não tem ramificação de conteúdo nem placeholder; alcança o retorno final de carregamento. Lupa, Régua e Termômetro têm placeholders. Nove módulos usam um painel operacional compartilhado, com diferentes graus de especialização. Proposta: matriz de maturidade por módulo, contendo responsabilidade, entregas atuais, lacunas e próxima ação. Corrigir os destinos preservando nomes, cores e pictogramas; não redefinir o módulo para acomodar uma tela já existente.

8. **P2 — A landing promete mais maturidade do que a navegação entrega.** O navegador confirmou “20 módulos operacionais” (`Home.tsx:392`), apesar das lacunas acima. Também exibe conteúdo de implementação — “Como a ÓRBITA deve parecer”, “Como a ÓRBITA funciona na tela” e explicações sobre pictogramas oficiais. Na largura inicial observada, textos laterais do cartão da marca aparecem cortados. Proposta: apresentar benefícios e o percurso institucional, preservar os ativos oficiais e transferir explicações de design para o catálogo técnico. Usar uma descrição fiel, como “20 módulos na arquitetura da plataforma”, acompanhada de disponibilidade quando necessário. Aceite: nenhuma promessa de módulo pronto sem fluxo correspondente, nenhuma legenda cortada e hierarquia institucional clara.

9. **P2 — A fonte canônica é duplicada na implementação.** Home mantém LANDING_SUBSYSTEMS, LANDING_MODULES e SUBSYSTEM_NAV manualmente. `client/src/index.css:40` redeclara tokens já importados. Isso amplia os pontos que precisam de atualização coordenada. Proposta: derivar identidade e hierarquia do manifesto e mapear rotas/capacidades em configuração tipada separada; extrair Pkt e Wordmark para componentes compartilhados; consumir os tokens oficiais diretamente. Aceite: cada módulo pertence a exatamente um subsistema, possui ativo válido e destino explícito; a integração não redefine valores da marca informalmente.

10. **P2 — Navegação perde contexto e preferência de tema.** `Home.tsx:1957` usa `replaceState`, e a seleção do processo fica somente em estado React (`:1953`). Atualizar a página perde o processo escolhido; as trocas internas não criam histórico normal de navegação. Separadamente, `client/index.html` força escuro por pathname, mas as telas reais usam hash: `/#agenda` também tem pathname `/`. ThemeProvider lê esse tema e grava a preferência, podendo sobrescrever a escolha clara ao recarregar. Proposta: endereços que incluam módulo e entidade, histórico navegável e separação entre tema forçado da landing e preferência pessoal. Aceite: recarregar um processo preserva seu contexto, Voltar funciona e a preferência clara sobrevive ao acesso à landing.

11. **P2 — Acessibilidade precisa de verificação comportamental.** Botões de abrir e fechar navegação em Home não têm nome acessível explícito; o sino comunica basicamente uma contagem. Existem bases positivas, como aria-current e aria-expanded nos grupos. Proposta: nomes claros, foco após navegação, teclado e testes de layout reais nas larguras do guia. Os oito testes móveis atuais comparam strings de código e não medem a interface renderizada. Aceite: completar uma tarefa essencial por teclado, identificar todos os botões por nome e manter ações legíveis a 360 px e com zoom.

**Evolução funcional proposta**

- No Porta, tornar sempre explícitos estado do rascunho, última gravação, campos pendentes e diferença entre salvar e encaminhar; verificar recuperação após interrupção. O código já tem wizard, itens confirmados, revisão e rascunhos: evoluir esses mecanismos.
- Na Agenda, privilegiar filas por responsabilidade: o que depende de mim, motivação da devolução e próxima ação. Reaproveitar os papéis existentes, sem confundir restrição visual com autorização de backend.
- Na Trilha, fazer do processo a referência contínua entre DFD, PCA, abertura, documentos e decisões. Incluir o identificador na URL e mostrar autor, versão, data e relação entre artefatos.
- Em Lastro, estruturar a informação orçamentária conforme o domínio aprovado; em Oráculo, organizar encaminhamento e análise jurídica; em Elo/Vigia, tratar gestão e fiscalização como entregas próprias. Detalhes normativos exigem levantamento específico com o órgão.
- Em Memória, oferecer histórico pesquisável de atos e alterações. Em Eco/Vitrine, distinguir preparação para publicação de publicação realizada e verificável.

**Sequência de entrega e demonstração de capacidade**

| Entrega | Resultado verificável |
|---|---|
| 1. Controles críticos | Corrigir promoção por e-mail, inativação/sessões, acesso a arquivos e caminhos Windows; adicionar testes de regressão com usuários e documentos isolados. |
| 2. Confiabilidade | CI obrigatório, migrations verificadas e recuperação de instalação demonstrada em ambiente descartável. |
| 3. Coerência da marca | Manifesto consumido pela UI, Atlas com destino explícito, Lastro/Oráculo alinhados ao significado, disponibilidade honesta na landing. |
| 4. Fluxo representativo | Demonstrar DFD → revisão → PCA → abertura com papéis diferentes, devolução motivada, persistência, anexos autorizados e histórico. |

O critério para avaliar uma substituição de agente deve ser uma entrega pequena com diff revisável, testes passando e demonstração do fluxo, preservando os ativos aprovados. Uma análise isolada mostra capacidade de diagnóstico; não comprova ainda a execução integral do produto.

**Verificações realizadas e limites**

- TypeScript: `node node_modules/typescript/bin/tsc --noEmit --pretty false`, sem diagnósticos após liberar leitura das dependências. A execução inicial sob restrição produziu erros de resolução; esses erros não foram atribuídos ao projeto.
- Testes: `node node_modules/vitest/vitest.mjs run shared server/selfhost/localAuth.test.ts server/authorization.test.ts --reporter=dot`. Resultado: 28 arquivos, 27 aprovados e 1 com falhas; 68 testes, 60 aprovados e 8 falhas em `shared/mobileLayoutRegression.test.ts`. Não representa a suíte completa.
- Prévia Vite: landing inspecionada no navegador no tamanho inicial e em 360 × 800. Em 360 px, sem imagens quebradas e sem transbordamento horizontal global na verificação feita. Isso não substitui uma avaliação de acessibilidade ou dos formulários autenticados.
- Windows: reprodução isolada, sem gravar anexos, demonstrou rejeição indevida de caminho interno.
- Leitura de código confirmou os caminhos relatados; não houve tentativa de exploração, login institucional, acesso a documento privado, execução de migrations ou teste de restauração.
- Não foi executado build de produção, suíte completa, E2E autenticado, teste de carga ou auditoria de dependências.
- Nenhuma mudança de framework ou de banco é pré-requisito para corrigir estes achados. A justificativa para uma migração deve vir de necessidade mensurável, e não somente da preferência por uma stack.

O briefing também precisa de uma atualização pontual: referencia manifests de dependências em client/server, enquanto este checkout usa package.json na raiz; cita ORM 0.31, enquanto a dependência declarada é drizzle-orm ^0.44.5. Evitar incluir valores de credenciais nos exemplos versionados.
