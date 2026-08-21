# Fluxo institucional corrigido — DFD, PCA e contratação

> **Regra central.** A DFD formaliza a necessidade do setor requisitante. Ela **não** define modalidade nem instaura processo de contratação. A modalidade é tratada somente após a publicação do PCA, na solicitação de abertura do processo de contratação dirigida à Presidência.

## Sequência operacional

| Fase | Responsável principal | Registro na ÓRBITA | Resultado esperado |
|---|---|---|---|
| 1. DFD | Setor requisitante | DFD, objeto, justificativa, quantitativos, prazo e estimativa inicial | Demanda enviada à Diretoria de Administração |
| 2. Triagem | Diretoria de Administração | Recebimento, análise e classificação de similaridade | DFD pendente, devolvida ou elegível para consolidação |
| 3. Consolidação | Diretoria de Administração | Grupo de demandas similares e minuta de PCA | Um PCA agrega demandas compatíveis em documento único |
| 4. Deliberação | Presidência | Aprovação ou rejeição do PCA, com motivação | PCA autorizado para publicação ou devolvido/rejeitado |
| 5. Publicação | Diretoria de Administração | Documento PCA, tabela de demandas e comprovante de publicação | PCA publicado e disponibilizado ao Setor de Compras |
| 6. Abertura de contratação | Setor de Compras | Solicitação de abertura vinculada a uma demanda/PCA publicado, com modalidade proposta | Pedido de autorização presidencial de abertura |
| 7. Autorização de abertura | Presidência | Decisão sobre abertura e modalidade de contratação | Processo de contratação pode ser instaurado ou é devolvido/rejeitado |
| 8. Instauração | Setor de Compras | Processo de contratação e trilha aplicável | Início da contratação direta ou licitação na TRILHA |

## Separação de decisões

| Decisão | Momento correto | Quem decide | O que a ÓRBITA bloqueia antes dela |
|---|---|---|---|
| Selecionar modalidade | Solicitação de abertura do processo, após PCA publicado | Presidência, a partir da proposta de Compras | A DFD não contém campo de modalidade nem cria processo |
| Consolidar demandas | Fase de planejamento | Diretoria de Administração | Setor requisitante não altera um PCA consolidado |
| Autorizar/rejeitar PCA | Antes da publicação | Presidência | Compras não recebe PCA não publicado |
| Instaurar contratação | Depois de autorização de abertura/modalidade | Setor de Compras | Não há TRILHA de contratação sem autorização presidencial registrada |

## Estados fundamentais

### DFD

`rascunho` → `enviada_administração` → `em_triagem` → `consolidada_no_pca` → `aguardando_publicação_pca` → `publicada_no_pca` → `aguardando_abertura_de_contratação` → `processo_instaurado`.

Uma DFD também pode ser `devolvida` para o requisitante ou `rejeitada` com motivação institucional.

### PCA

`rascunho` → `em_consolidação` → `aguardando_presidência` → `autorizado_para_publicação` → `publicado` → `encaminhado_para_compras`.

O PCA pode retornar a `em_consolidação` ou ser `rejeitado` pela Presidência, sempre com justificativa e evento de auditoria.

### Solicitação de abertura de contratação

`rascunho` → `aguardando_presidência` → `autorizada` ou `devolvida/rejeitada`. Somente a situação `autorizada` habilita a criação de `procurement_processes` e a seleção da trilha de contratação direta ou licitação.

## Impacto nos módulos

| Módulo | Ajuste necessário |
|---|---|
| PORTA | Cria apenas DFD; remove modalidade e botão de criação de processo. |
| AGENDA | Recebe DFD, permite consolidar demandas similares em PCA e monta a tabela de demandas. |
| Presidência | Recebe caixas de decisão para PCA e para solicitação de abertura de contratação. |
| ECO | Prepara e registra a publicação do PCA com documento e comprovante. |
| MAESTRO / TRILHA | Só ficam disponíveis depois da autorização presidencial de abertura e modalidade. |
| ÁGUIA / MAPA | Distinguem demandas, PCA publicado, pedidos de abertura e processos instaurados. |

## Capacidades transversais obrigatórias

| Transversal | DFD | PCA | Abertura e contratação |
|---|---|---|---|
| Perfis e segregação | Garante autoria do setor requisitante. | Restringe consolidação à Administração e deliberação à Presidência. | Restringe proposta de abertura a Compras e decisão à Presidência. |
| MEMÓRIA / auditoria | Registra criação, envio e devolução. | Registra agrupamento, alterações, decisão e publicação. | Registra proposta de modalidade, autorização e instauração. |
| Documentos e OFICINA | Vincula DFD e modelos obrigatórios. | Gera PCA consolidado e tabela de demandas. | Vincula solicitação de abertura, decisão e documentos da TRILHA. |
| FAROL / alertas | Avisa DFD sem triagem ou devolvida. | Avisa PCA pendente de decisão ou publicação. | Avisa pedido de abertura e etapas com prazo vencido. |
| ECO / publicação | Não se aplica como publicação externa. | Controla preparação, destino, comprovante e situação do PCA. | Controla futuras publicações da contratação. |
| PRIVACIDADE LGPD | Permite sinalizar tratamento de dados na necessidade. | Consolida riscos comuns e encaminhamentos. | Mantém avaliação vinculada ao processo instaurado. |
| MAPA / pesquisa | Localiza DFD por objeto, unidade e situação. | Localiza PCA, tabela de demandas e publicação. | Localiza autorização e processo por modalidade/situação. |
| ÍMÃ / fornecedores | Não se aplica. | Não se aplica. | Fica disponível após a abertura autorizada, durante instrução e seleção. |
| BÚSSOLA / indicadores | Mede volume, origem e tempo de triagem. | Mede consolidação, decisões e publicação de PCA. | Mede tempo de abertura, modalidade e evolução das contratações. |

## Limite de conformidade

A configuração das alçadas, da forma de publicação e dos documentos obrigatórios deve ser homologada pela área jurídica, controle interno e Presidência antes de uso oficial. A ÓRBITA registra e controla as decisões; ela não substitui a competência institucional de decidir.
