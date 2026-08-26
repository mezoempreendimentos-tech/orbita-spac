# Fluxo institucional DFD → PCA → abertura → TRILHA

## 1. Escopo e vocabulário institucional

Este documento descreve o fluxo de planejamento e contratação implementado na **ÓRBITA**, sistema institucional que registra documentos, responsabilidades, decisões, prazos, saldos e auditoria.

| Termo | Responsabilidade no fluxo |
|---|---|
| **PORTA / DFD** | Origina a demanda e seus itens, com autoria, unidade requisitante, estimativa, justificativas, rubrica e ciência do Financeiro. |
| **Financeiro** | Classifica a natureza de despesa e registra a ciência do gasto antes da triagem/consolidação administrativa. |
| **Diretoria de Administração** | Faz a triagem, consolida DFDs, cria/atualiza o PCA, gera o documento e conduz a publicação institucional. |
| **SPAC — Setor de Compras** | Consulta o PCA publicado, propõe grupos de abertura, indica modalidade e CNAE principal, realiza a análise preventiva e instaura a contratação autorizada. O SPAC não é o sistema. |
| **Presidência** | Delibera sobre DFD/PCA quando aplicável e decide o pedido de abertura como um todo. Pode autorizar a modalidade proposta, determinar outra modalidade, devolver ou não autorizar. |
| **TRILHA** | Recebe o processo instaurado, os itens e as quantidades autorizadas, preservando o vínculo de origem no PCA. |

A Presidência não edita o CNAE. O SPAC pode revisar o CNAE informado na DFD, sempre preservando o código original e o código final escolhido.

## 2. Sequência principal

| Fase | Responsável | Entrada | Resultado |
|---|---|---|---|
| 1. Elaboração da DFD | Setor requisitante | Demanda e um ou mais itens | DFD em rascunho ou enviada para o fluxo institucional |
| 2. Financeiro | Financeiro | DFD com estimativa e objeto | Rubrica de despesa e ciência do gasto registradas |
| 3. Triagem e consolidação | Diretoria de Administração | DFDs aptas e grupos de consolidação | DFDs relacionadas a grupos ou incluídas diretamente em um PCA |
| 4. Deliberação do PCA | Presidência | Documento único do PCA | PCA aprovado para publicação, devolvido ou não autorizado |
| 5. Publicação do PCA | Diretoria de Administração | PCA autorizado e referência de publicação | PCA publicado e itens operacionais disponíveis ao SPAC |
| 6. Pedido de abertura | SPAC | PCA publicado, itens selecionados, quantidades, modalidade proposta, CNAE e análise | Pedido de abertura do grupo enviado à Presidência |
| 7. Decisão presidencial | Presidência | Pedido e versão ativa | Grupo autorizado, devolvido ou não autorizado; modalidade final registrada |
| 8. Instauração | SPAC | Pedido autorizado e válido | Processo criado na TRILHA com os itens, quantidades e modalidade final |
| 9. Execução e encerramento | TRILHA / Compras | Processo e etapas | Contratação finalizada com sucesso ou sem sucesso; DFDs participantes notificadas |

## 3. PCA e ponte itemizada

O PCA possui uma ponte operacional explícita denominada `pcaDemandItems`. Cada registro relaciona um item do PCA à DFD e ao item original da DFD. Essa ponte é a fonte para seleção, análise preventiva, reserva de quantidade, instauração e cálculo de saldo.

A ponte é criada quando o PCA é criado e também quando uma atualização publicada acrescenta novas DFDs. Na implantação do modelo itemizado, os PCAs anteriores são preenchidos por migração idempotente a partir dos vínculos históricos de consolidação, vínculos diretos e atualizações publicadas. Somente itens confirmados e aprovados pela Presidência entram no saldo operacional.

O código exibido na ponte identifica o item operacional do PCA. A ordem de criação é determinística dentro de cada PCA; a origem completa continua disponível pelos campos da DFD e do item original. Alterações de nomenclatura ou convenção de subitens devem ser tratadas como evolução específica do modelo, sem alterar os vínculos históricos.

## 4. Pedido de abertura por grupo e quantidade

O SPAC não abre automaticamente o PCA inteiro. Na AGENDA, ele seleciona um ou mais itens do PCA publicado e informa a quantidade que pretende instaurar naquele pedido. Um pedido com mais de um item exige objeto integrado que explique a contratação conjunta.

> **Regra de saldo:** se um item do PCA prevê 13 cursos e o primeiro pedido solicita 1 curso, o pedido reserva 1 e o saldo disponível passa a ser 12. Novos pedidos podem consumir o saldo remanescente, inclusive até 13 pedidos de uma unidade, desde que cada pedido seja autorizado e não haja quantidade já reservada ou consumida.

| Informação | Regra operacional |
|---|---|
| Quantidade total | É a quantidade do item da DFD transportada para o item do PCA. |
| Quantidade reservada | Soma quantidades de versões em análise presidencial ou autorizadas. Pedidos devolvidos e não autorizados não permanecem reservando saldo. |
| Quantidade consumida/ativa | Soma quantidades dos itens já copiados para processos ativos ou encerrados com sucesso. Processos encerrados sem sucesso liberam a quantidade para novo planejamento. |
| Saldo disponível | Quantidade total menos reservas e consumo efetivo, nunca inferior a zero. |
| Excesso | O servidor rejeita quantidade zero, negativa ou superior ao saldo; a interface mostra total, reservado e saldo antes do envio. |
| Concorrência | A criação bloqueia as linhas dos itens selecionados durante o recálculo transacional, evitando que duas solicitações simultâneas ultrapassem o saldo. |

O valor estimado do pedido é calculado proporcionalmente à quantidade selecionada para planejamento. Esse valor é uma estimativa operacional e não substitui a apuração do valor efetivo da contratação.

## 5. CNAE principal e análise preventiva do PCA

Cada pedido de abertura registra uma única **subclasse CNAE principal**. A consulta é feita no serviço oficial de subclasses do IBGE, com cache no servidor e preservação do código, descrição, classe-base, fonte e versão consultadas. O código original informado na DFD e o código final indicado pelo SPAC permanecem separados no histórico da versão.

A análise do PCA é sempre obrigatória. A ÓRBITA compara o pedido com os demais itens do mesmo PCA, sem afirmar irregularidade e sem bloquear automaticamente a contratação. Os possíveis pontos de relação são apresentados como alerta informativo para apoiar a decisão preventiva do SPAC.

| Correspondência informativa | Critério |
|---|---|
| Mesma subclasse | Código final do pedido igual ao código final histórico de outro item do PCA. |
| Mesmo CNAE original | Código originalmente informado na DFD igual ao de outro item. |
| Mesma classe-base | Classe-base do código final igual à de outro item. |
| Termos relevantes | Pelo menos dois termos relevantes do objeto coincidem, desconsiderando palavras genéricas e variações de acentuação. |

Sem alerta, basta a declaração formal de que o PCA foi analisado. Havendo alerta, o SPAC deve registrar justificativa formal explicando a análise e a razão pela qual os itens não serão contratados conjuntamente, ou por que o agrupamento escolhido continua adequado. A correspondência não é acusação de fracionamento e não substitui a análise jurídica ou de controle interno.

## 6. Versões e decisões da Presidência

Um pedido devolvido permanece com o mesmo identificador e recebe nova versão. A nova versão recalcula os itens, quantidades, saldo, CNAE e análise, mantendo o histórico da versão anterior. A reapresentação deve informar o que foi corrigido, alterado ou esclarecido e não pode trocar silenciosamente o PCA do pedido devolvido.

Um pedido não autorizado encerra sua decisão. Um novo pedido pode ser criado com referência ao pedido anterior e deve explicar formalmente as alterações ou esclarecimentos que justificam a nova apresentação. O pedido anterior continua disponível para consulta e auditoria.

A decisão presidencial alcança **todo o grupo** selecionado na versão. Nas autorizações, a Presidência pode manter a modalidade proposta ou determinar outra modalidade oficial. A modalidade determinada deve existir e estar ativa na lista administrativa `MODALIDADES_CONTRATACAO`; o valor persistido é o código da modalidade, não o rótulo livre digitado pelo usuário.

| Ação presidencial | Efeito |
|---|---|
| Autorizar | Autoriza todo o grupo com a modalidade proposta na versão. |
| Autorizar outra modalidade | Autoriza todo o grupo com fluxo e modalidade oficial definidos pela Presidência. |
| Devolver | Encerra a versão como devolvida, libera a reserva e habilita a reapresentação do mesmo pedido. |
| Não autorizar | Encerra o pedido como não autorizado, libera a reserva e permite novo pedido referenciado. |

A autorização é válida até a instauração. Depois que o processo é criado, a modalidade vigente pertence à TRILHA e só pode ser alterada pelo fluxo formal de mudança de modalidade.

## 7. Instauração na TRILHA

O SPAC só pode instaurar um pedido autorizado. A ÓRBITA seleciona a versão autorizada mais recente e copia para a TRILHA:

| Registro | Conteúdo copiado |
|---|---|
| Processo | Título do grupo, fluxo final, modalidade final, valor estimado e etapa inicial. |
| Itens do processo | Item do PCA, DFD, item original, sequência, quantidade autorizada, unidade e estimativa proporcional. |
| Auditoria | Pedido, versão, itens, quantidades, modalidade e usuário responsável pela instauração. |
| Alertas e privacidade | Aviso de instauração e, quando aplicável, avaliação de privacidade vinculada ao processo. |

A DFD não é marcada como integralmente consumida quando somente parte de sua quantidade foi instaurada. O estado operacional do item do PCA é recalculado a partir de reservas e processos. A DFD participante recebe o resultado final da contratação — sucesso ou fracasso — juntamente com as demais DFDs do grupo, sem duplicar o aviso para o mesmo processo.

## 8. Alteração de modalidade dentro da TRILHA

Após a instauração, o SPAC pode propor alteração de modalidade mediante justificativa formal. A proposta registra modalidade e fluxo anteriores, modalidade e fluxo pretendidos, fundamento e usuário solicitante. A Presidência decide em formulário próprio.

| Ação | Resultado |
|---|---|
| Autorizar | Atualiza a modalidade e o fluxo vigentes do processo, preservando o histórico anterior. |
| Devolver | Retorna a proposta ao SPAC para esclarecimento, sem alterar o processo. |
| Não autorizar | Mantém a modalidade vigente e encerra a proposta. |

A alteração não é feita por edição direta do processo e não altera o CNAE principal do pedido. Toda decisão permanece auditável.

## 9. Segregação, alertas e auditoria

A ÓRBITA aplica segregação por responsabilidade: o SPAC solicita e instaura; a Presidência decide; a Diretoria de Administração administra o PCA; o Financeiro classifica a despesa antes da triagem. Cada mudança relevante gera evento de auditoria, alerta institucional e, quando aplicável, checklist ou documento vinculado.

Os alertas de análise do PCA têm finalidade preventiva. Eles não afirmam fracionamento irregular, não substituem decisão da autoridade competente e não impedem o SPAC de apresentar justificativa formal para prosseguir.

## 10. Compatibilidade e implantação

A migração `0026_opening_request_groups.sql` cria as tabelas itemizadas de PCA, versões, análises, itens de processo e alterações de modalidade; torna `opening_requests.demandId` opcional para suportar grupo; adiciona quantidade e unidade aos itens administrativos; e faz o preenchimento inicial dos vínculos históricos de PCA de forma idempotente.

O fluxo novo é exposto por procedimentos tRPC de prévia, criação/reapresentação, decisão e instauração. O caminho legado de criação unitária foi mantido apenas como compatibilidade interna para registros antigos; a operação da AGENDA utiliza o contrato novo com PCA, itens, quantidades, CNAE e declaração de análise.

## 11. Homologação institucional

Antes do uso oficial, a Administração, a Presidência, o controle interno e a área jurídica devem homologar a lista de modalidades, os modelos de checklist, os prazos, a convenção definitiva dos códigos de subitens e os documentos obrigatórios. A ÓRBITA controla o fluxo aprovado e preserva evidências; não substitui a competência institucional de decidir.
