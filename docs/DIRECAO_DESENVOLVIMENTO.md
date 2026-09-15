# ÓRBITA — direção para a primeira operação completa

Data: 11/09/2026. Proposta de continuidade solicitada pelo mantenedor. Diagnóstico por leitura do código e dos requisitos; não representa homologação de todos os fluxos. Nesta revisão não foram alterados registros, permissões ou serviços.

## Objetivo de produto

Concluir uma contratação direta representativa, desde a DFD até contratação, publicação, acompanhamento e encerramento, preservando autoria, versões, responsabilidades e vínculos. A primeira entrega deve comprovar DFD → Financeiro → Administração → PCA deliberado e publicado → abertura autorizada → instauração na TRILHA. Expandir a instrução e a execução sobre esse percurso comprovado.

Referências: especificacao_v1.md, fluxo_dfd_pca_contratacao.md, manifesto oficial client/src/brand/manifests/icons.json e código atual. O histórico de itens marcados em todo.md não substitui evidência atual de funcionamento.

## Maturidade observada

| Área | Evidência atual | Próxima entrega necessária |
|---|---|---|
| Porta / Agenda | Serviços de DFD, financeiro, consolidação, PCA, versões, abertura itemizada e saldo; testes específicos de planejamento | Homologar percurso integrado com papéis separados, devolução, reapresentação e persistência |
| TRILHA | Etapas, tarefas, checklists, anexos, propostas, devolução, dispensa e encerramento em procurementService.ts | Conferir decisões e documentos exigidos por etapa, concorrência, reentrada após devolução e rastreabilidade completa |
| Lupa / Régua / Termômetro | Destinos de preparação em Home.tsx; modelos e geração de documentos existem em outras áreas | Telas e operações próprias para ETP, TR e pesquisa de preços, reaproveitando documentos e versões existentes |
| Lastro | Painel lista documentos de planejamento | Entregar dotação e adequação orçamentária, reaproveitando classificação financeira da DFD; preservar acervo em documentos do processo |
| Oráculo | Destino abre PrivacyPage | Separar consultoria/análise jurídica da análise transversal de privacidade, preservando esta última |
| Maestro | Painel de acesso aos processos; registro de propostas no serviço | Completar condução da contratação direta com análise, diligências, decisões e passagem à formalização |
| Eco / Vitrine | Painéis compartilham lista de PCAs publicados | Fila de publicações com comprovantes e disponibilização pública explicitamente autorizada |
| Elo / Vigia | Painéis consultam processos; a própria interface descreve fiscalização futura | Contratos, vigências, responsáveis e alterações; entregas, ocorrências e aceite da fiscalização |
| Águia / Farol / Mapa / Memória / Bússola | Consultas, alertas, eventos e indicadores básicos já presentes, parte em painel compartilhado | Pendências por responsável, histórico pesquisável e indicadores derivados das etapas efetivamente executadas |
| Ímã / Oficina | Cadastros de fornecedores, modelos, checklists e integração documental disponíveis | Validar reutilização no percurso piloto, versões e acesso aos documentos |
| Atlas | Destino explícito de preparação | Referências institucionais versionadas, vinculadas às etapas; depois do núcleo operacional |

## Ordem de execução e critérios de aceite

### 1. Base confiável de homologação

- Gerar imagem reproduzível do checkout: a atualização atual no container não sobrevive à recriação a partir da imagem antiga.
- Corrigir validação de migrations: entrypoint.sh aceita apenas contagem positiva de tabelas, insuficiente para provar schema completo.
- Tornar testes essenciais bloqueantes no CI, separando dependências externas; hoje a etapa de testes inteira usa continue-on-error.
- Demonstrar backup e restauração de banco e arquivos em ambiente isolado; verificar os scripts existentes antes de criar alternativas.
- Completar autorização por documento e revogação de sessões após redefinição de senha.
- Estabilizar inicialização de aplicação e túnel após reiniciar o hospedeiro.

Aceite: instalação e atualização reproduzíveis; restauração comprovada; sessão e documento negados a quem não tem acesso; endereço externo acessível após reinício. Manter o ambiente de testes separado dos registros institucionais.

### 2. Percurso de planejamento validado por responsabilidade

- Preparar cenário identificado em base de homologação com demandante, Financeiro, Administração, Presidência e Compras.
- Executar rascunho, envio, classificação financeira, devolução, correção, composição do PCA, deliberação, publicação documentada, abertura parcial por quantidade e instauração.
- Confirmar saldos e vínculos de origem; testar rejeição, duas reservas concorrentes e reapresentação.
- Corrigir cada falha encontrada e acrescentar regressão comportamental correspondente.
- Preservar processo/DFD selecionado na URL, recarga e histórico do navegador.

Aceite: cada papel executa apenas suas ações; todos conseguem identificar situação, responsável, pendência e próximo encaminhamento; dados e anexos persistem após recarga. As contas administrativas de teste continuam com o acesso solicitado, mas não servem como prova de segregação de funções.

### 3. Instrução completa

- Lupa: ETP com alternativas, conclusão, versão, responsável e devolução para ajuste.
- Régua: TR com objeto, requisitos, execução e critérios de aceite, ligado à versão utilizada na instrução.
- Termômetro: fontes, itens, valores, datas, memória de cálculo e justificativas de seleção ou exclusão.
- Lastro: manifestação orçamentária estruturada e encaminhamento, coerente com informações financeiras já existentes.
- Oráculo: solicitação de análise, parecer, recomendações e retorno para saneamento.
- Revisar o motor: a conclusão atual verifica tarefas e checklists, mas a exigência de documentos e decisões precisa ser demonstrada por etapa; dispensa e devolução também devem ter critérios próprios.

Aceite: processo mantém versões e decisões vinculadas; não avança sem requisitos aplicáveis; dispensas registram fundamento e responsável. Regras institucionais devem partir dos requisitos aprovados, sem inventar decisões automáticas.

### 4. Contratação direta e transparência

- Maestro: propostas, habilitação, diligências, escolha motivada e decisão competente, reaproveitando cadastro de fornecedores e propostas.
- Eco: preparar, registrar publicação e anexar comprovante, com destino, data e responsável.
- Vitrine: consultar somente conteúdo deliberadamente público.
- Integrações externas: distinguir preparação de transmissão efetiva; assinatura gov.br e publicação automatizada dependem da configuração e homologação correspondentes.

Aceite: concluir um caso de contratação direta e um caso devolvido ou encerrado sem sucesso; comprovar publicações e atualização de saldos e histórico. Ampliar licitação após esse percurso estabilizado.

### 5. Gestão e fiscalização contratual

- Elo: instrumento contratual, fornecedor, valores, vigências, responsáveis e alterações versionadas.
- Vigia: entregas, ocorrências, evidências, pendências, aceite e encerramento.
- Farol: alertas acionáveis de vigência e pendências; Memória: histórico transversal; Bússola: indicadores com definição e origem claras.

Aceite: contrato vinculado ao processo, ocorrência tratada, entrega registrada e encerramento rastreável. Só então considerar completo o alcance da DFD à execução contratual.

## Padrão de interface e marca em cada entrega

Manter três subsistemas, vinte módulos, cores, pictogramas e assinaturas oficiais. A função do módulo deve corresponder ao significado da marca: Lastro sustenta o orçamento; Oráculo concentra análise jurídica; Elo gerencia contratos; Vigia fiscaliza.

Cada tela deve responder: qual registro estou vendo, em que situação está, quem responde por ele, o que falta e qual ação posso executar. Aplicar componentes compartilhados de cabeçalho, lista, situação, formulário, documentos e histórico; validar desktop, celular, estados vazios e erros. Extrair gradualmente as páginas concentradas em Home.tsx durante as entregas, sem reescrita geral.

## Primeiro pacote recomendado

Combinar a base de homologação com o percurso Porta → Agenda → TRILHA. Entregar um roteiro executável, registro das falhas corrigidas, testes positivos/negativos por papel e demonstração navegável. Isso estabelece uma referência verificável para a implementação dos módulos de instrução.

Evitar abrir agora frentes de migração de banco, troca de roteador ou inteligência artificial generalizada. Não há evidência nesta revisão de que sejam pré-requisitos para completar o ciclo. A prioridade é reduzir lacunas funcionais e tornar cada entrega reproduzível.
