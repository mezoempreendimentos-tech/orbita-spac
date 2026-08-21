# Especificação funcional inicial — ÓRBITA v1

> **Nota de conformidade.** Este documento organiza requisitos de sistema a partir do material fornecido e de fontes públicas. Ele não substitui a validação do jurídico, do controle interno e da área de compras antes da operação real.

## Objetivo da primeira versão operacional

A primeira versão deve deixar de ser uma simulação e permitir que uma demanda real seja formalizada, vinculada ao planejamento, conduzida por etapas configuradas, documentada, devolvida para correção quando necessário, acompanhada por responsáveis e encerrada com histórico auditável. O primeiro processo configurado será **Contratação Direta**, porque o fluxo Bizagi fornecido contém suas decisões, responsabilidades e documentos. O mesmo motor atenderá Licitação por meio de um modelo de processo distinto, preservando as etapas compartilhadas e trocando apenas as regras da fase externa.

## Recorte funcional por prioridade

| Entrega | Capacidades da primeira versão | Situação de desenvolvimento |
|---|---|---|
| Fundamentos | Autenticação, unidade organizacional, papéis, usuários, permissões e memória de auditoria | Base obrigatória |
| PORTA | DFD estruturado, anexos, responsáveis, classificação, estimativa inicial e envio para análise | Primeira frente operacional |
| AGENDA | Vínculo com item do PAC, registro de demanda superveniente e histórico de alterações | Primeira frente operacional |
| TRILHA | Processo por etapas, responsáveis, pré-requisitos, checklists, documentos requeridos, transições, devoluções e dispensas justificadas | Núcleo do sistema |
| LUPA / RÉGUA / TERMÔMETRO | Registros estruturados de ETP, TR, pesquisa de preços e documentos vinculados | Núcleo de instrução |
| LASTRO / ORÁCULO | Solicitações, manifestações, decisão de dotação, pareceres e correções | Núcleo de instrução |
| MAESTRO — contratação direta | Aviso, propostas, habilitação, escolha de fornecedor, parecer referencial/jurídico, saneamento, ato decisório e retorno ao ponto correto | Primeiro fluxo externo |
| ECO / VITRINE | Fila de publicações, comprovantes, registro de destino e consulta pública separada | Necessário para transparência |
| ÁGUIA / FAROL / MAPA / MEMÓRIA | Painel de pendências, prazos, busca processual e trilha de eventos | Visão de operação e governança |
| ELO / VIGIA | Cadastro de contrato, vigências e ocorrências de fiscalização | Entrega posterior, com estrutura já prevista |
| BÚSSOLA / ÍMÃ / OFICINA / ATLAS | Indicadores, fornecedores, modelos e base de conhecimento | Entrega posterior, com dados-base previstos |

## Papéis iniciais e segregação de funções

| Papel | Responsabilidades no sistema | Limites de decisão |
|---|---|---|
| Demandante | Cria DFD, corrige informações solicitadas e acompanha a própria demanda | Não aprova o próprio processo em etapas de validação |
| Chefe do Setor de Compras | Valida checklists, saneia falhas materiais, encaminha para decisão e encerra registros | Não substitui parecer jurídico ou autorização da Presidência |
| Compras / Instrumentalização | Elabora TR, registra pesquisa de preços, prepara publicações e documentos de instrução | Atua dentro das tarefas delegadas pela TRILHA |
| Contabilidade | Registra disponibilidade, adequação ou necessidade de alteração orçamentária | Não autoriza contratação |
| Jurídico | Emite parecer, recomendações e manifestação referencial quando aplicável | Não executa decisão de autorização |
| Agente de Contratação | Conduz avisos, propostas, habilitação, escolha de fornecedor e instrução da fase externa | Não autoriza o ato final |
| Autoridade competente | Autoriza, anula ou revoga com motivação obrigatória | Só decide em processo instruído e encaminhado |
| Gestão e fiscalização contratual | Assume o processo de acompanhamento após a contratação | Não altera a instrução encerrada sem evento formal |
| Administrador | Mantém cadastros, modelos e regras de acesso | Não substitui papéis de negócio no processo |

## Regras obrigatórias do motor de workflow

O motor deve tratar cada processo como uma instância de fluxo tipado. Cada instância possui modalidade, tipo de contratação, situação atual, responsável atual, histórico completo, lista de documentos e tarefas derivadas. Nenhuma transição decisória deve ocorrer somente por alteração de status; a aplicação deve exigir a ação correspondente, a justificativa quando aplicável e o registro do autor e do momento.

| Regra | Comportamento exigido |
|---|---|
| Pré-requisitos | Uma etapa só pode avançar quando suas tarefas, documentos e checklists obrigatórios estiverem concluídos ou formalmente dispensados. |
| Devolução | A devolução precisa informar destino, motivo, responsável, prazo e itens a corrigir. O evento permanece registrado sem apagar a etapa anterior. |
| Dispensa | Uma etapa dispensável exige fundamento, autoridade responsável e documento de suporte quando aplicável. |
| Decisão | Autorizar, anular, revogar, escolher fornecedor ou rejeitar recomendação requer motivação registrada e perfil autorizado. |
| Versionamento | Documentos estruturados e modelos precisam manter versão, situação e vínculo com a etapa que os produziu. |
| Arquivamento | Só é permitido após checklist de arquivamento e atualização da demanda de origem. |
| Auditoria | Criação, edição, anexação, comentário, decisão, alteração de responsável e publicação geram eventos imutáveis na MEMÓRIA. |

## Modelo de dados inicial

As entidades fundamentais serão `Organização`, `Unidade`, `Perfil de processo`, `Usuário`, `Papel`, `Processo de contratação`, `Demanda/DFD`, `Item PAC`, `Etapa de workflow`, `Tarefa`, `Transição`, `Checklist`, `Item de checklist`, `Documento`, `Manifestação`, `Publicação`, `Prazo`, `Fornecedor`, `Proposta` e `Evento de auditoria`. A modelagem deve distinguir o estado do processo do estado das tarefas para permitir caminhos não lineares e retornos formais.

## Integrações e limites de operação

O PNCP é apresentado oficialmente como ponto centralizado de transparência e também disponibiliza materiais de integração para sistemas de contratações.[1] A primeira versão operacional deve registrar **o que precisa ser publicado, quando, por quem e com qual comprovante**. A transmissão automática para destinos externos será ativada somente depois de recebermos credenciais, documentação atualizada e homologação em ambiente próprio do órgão; até lá, a fila de publicação e o comprovante preservam controle e rastreabilidade sem afirmar que houve envio externo.

As regras de contratação serão configuráveis e revisáveis. A Lei nº 14.133/2021 se aplica às administrações públicas diretas, autárquicas e fundacionais, inclusive aos órgãos do Poder Legislativo municipal no desempenho de função administrativa, e estabelece princípios como planejamento, transparência, segregação de funções e segurança jurídica.[2] Esses princípios sustentam o desenho de perfis, auditoria e workflow, mas parâmetros locais — alçadas, prazos, listas de verificação, atos normativos e destinos de publicação — não serão codificados como regras imutáveis sem validação do órgão.

## Critérios de aceite da primeira operação

Uma equipe autorizada deverá conseguir iniciar uma demanda, anexar documentos, relacioná-la ao PAC, iniciar um processo de contratação direta, cumprir ou dispensar etapas justificadamente, enviar tarefas para os responsáveis previstos, registrar manifestação orçamentária e jurídica, devolver uma etapa para correção, registrar uma decisão final, gerar itens de publicação e consultar a linha do tempo imutável do processo. O administrador deverá conseguir consultar pendências, prazos e responsáveis sem enxergar documentos fora de sua permissão.

## Referências

[1] [Portal Nacional de Contratações Públicas — página oficial](https://www.gov.br/rededeparcerias/pt-br/servicos/portal-nacional-de-contratacoes-publicas-pncp)

[2] [Lei nº 14.133, de 1º de abril de 2021 — Planalto](https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/l14133.htm)
