# PORTA/DFD — decisões e implementação

**Projeto:** Órbita — Plataforma Integrada de Contratações  
**Escopo:** PORTA/DFD, aprovação presidencial, calendário institucional, avisos internos e encerramento da contratação  
**Autor:** Manus AI  
**Data:** 26 de agosto de 2026

## 1. Regra institucional consolidada

A DFD representa uma **demanda institucional**, podendo conter um ou mais itens relacionados. A PORTA formaliza a necessidade; ela não escolhe modalidade, não define fornecedor e não instaura diretamente o processo de contratação.

O fluxo implementado é:

> **Rascunho → Enviada → Em análise da Diretoria → Devolvida ou Encaminhada à Presidência → Aprovada, Aprovada parcialmente ou Rejeitada → Consolidação/PCA → Abertura → TRILHA → Encerramento com sucesso ou sem sucesso.**

Toda DFD submetida deve chegar à Presidência para decisão. A Diretoria pode analisar, solicitar complementação e registrar pendências, mas não pode aceitar nem rejeitar definitivamente a DFD.

## 2. Decisões confirmadas

| Tema | Regra definida |
|---|---|
| Unidade da DFD | Uma DFD corresponde a uma demanda e pode conter vários itens. |
| Rascunhos | Rascunhos persistentes ficam na tela inicial dos demandantes; podem ser criados, retomados e enviados sem gerar uma nova DFD. |
| Vínculo ao PCA | O ano de referência e a natureza são informados na DFD; o item e os subitens do PCA nascem posteriormente na consolidação e preservam a origem de cada DFD. |
| Justificativa | A justificativa geral deve ter no mínimo 1.000 caracteres. O backend também valida a regra; o texto de bloqueio é firme e institucional. |
| Triagem | A Diretoria pode iniciar análise e devolver para complementação, mas não decide o mérito final. |
| Prazo final | Toda DFD pendente é encaminhada à Presidência quando vence o prazo configurado, mesmo que o requisitante não tenha corrigido a demanda. |
| Presidência | É a única autoridade para aprovação integral, aprovação parcial e rejeição da DFD. |
| Aprovação parcial | O Presidente seleciona os itens aprovados e pode informar o valor aprovado por item; nenhum valor pode superar a estimativa do item. |
| Anexos | A PORTA aceita documentos de apoio iniciais, separados dos documentos produzidos durante a contratação. |
| Avisos | A primeira etapa usa avisos internos persistentes, visíveis à Diretoria e ao requisitante. Chatbots e e-mail ficam para uma etapa futura. |
| Proteção de dados | A avaliação LGPD detalhada fica suspensa. A sinalização existente permanece apenas como informação inicial, sem construir ainda o processo protegido. |
| Encerramento | A última etapa da TRILHA registra explicitamente contratação finalizada com sucesso ou sem sucesso e publica o evento na DFD. |

## 3. Alterações implementadas

| Área | Resultado |
|---|---|
| Modelo de dados | Novos estados `presidency_review` e `partially_accepted`, campos de decisão presidencial na DFD, decisão e valor aprovado por item, resultado de encerramento do processo e tabela de notificações direcionadas. |
| Calendário | A Administração ganhou configuração para prazo de submissão/conferência de DFD, prazo de consolidação e prazo final de aprovação de DFD. As chaves são compartilhadas entre Administração, serviço de planejamento e scheduler. |
| Rascunhos | Foram criadas operações para criar, listar, consultar, salvar e retomar rascunhos por requisitante. O envio de um rascunho reaproveita a mesma DFD e substitui seus itens de forma controlada. |
| Presidência | O controle individual da DFD apresenta os itens, seleção para aprovação parcial, valores aprovados por item, aprovação integral e rejeição. A permissão de decisão exige o papel `autoridade_competente`. |
| Consolidação | A consolidação rejeita DFDs que não estejam aprovadas integral ou parcialmente pela Presidência. |
| Prazo | A rotina de atualização encaminha idempotentemente todas as DFDs submetidas, em análise ou devolvidas cujo prazo presidencial venceu. A elevação dos alertas continua funcionando como redundância. |
| Avisos internos | Avisos são criados para a Diretoria e para o requisitante em decisões presidenciais e no encerramento da contratação. Há contador na campainha, listagem na ÁGUIA e marcação individual ou em lote como lido. |
| Compras | O fechamento da última etapa aceita `success` ou `failure`, registra a escolha na contratação e cria evento auditável na DFD. |
| PORTA | O ano de referência, a justificativa mínima e a orientação contextual aparecem no formulário. O item do PCA não é selecionado na PORTA; a tela de RASCUNHOS passa a ser a entrada dos usuários sem acesso à equipe de planejamento. |
| Acesso | A consulta do painel completo da AGENDA foi restringida no backend aos perfis institucionais autorizados, além do redirecionamento visual de demandantes para RASCUNHOS. |
| Migração | Foi gerada a migração Drizzle `0022_amused_luminals.sql` e seu snapshot correspondente. |

## 4. Regras de decisão presidencial

Na aprovação integral, todos os itens da DFD recebem decisão aprovada e, quando não informado valor específico, mantêm o valor estimado originalmente apresentado. Na aprovação parcial, pelo menos um item deve ser selecionado. O sistema soma os valores aprovados, registra o total na DFD e impede valores superiores à estimativa original de cada item.

Na rejeição, todos os itens recebem decisão rejeitada, o valor presidencial é zerado, a motivação é obrigatória e a DFD não pode entrar em consolidação. Toda decisão resolve os alertas abertos da DFD, gera evento na linha do tempo, gera auditoria e cria aviso interno para o requisitante e os perfis de gestão.

## 5. Regra de prazo e encaminhamento automático

O prazo final é configurado em Administração e consultado pela rotina de planejamento. O encaminhamento é idempotente: a mesma DFD não recebe múltiplos eventos ou avisos para o mesmo vencimento. A rotina mantém uma segunda camada de verificação quando o painel é acessado, mas o endpoint periódico é o mecanismo destinado à execução sem navegador aberto.

O endpoint de calendário deve ser publicado antes da criação do agendamento de produção. O callback já está montado em `/api/scheduled/planning-deadlines`; a criação ou ajuste do agendamento de produção deve ocorrer somente depois da publicação do site, conforme o procedimento de atualizações periódicas do projeto.

## 6. Validação executada

| Verificação | Resultado |
|---|---|
| TypeScript | Passou com `pnpm exec tsc --noEmit`. |
| Build | Passou com `pnpm build`. O Vite e o bundle do servidor foram gerados. |
| Suíte afetada | 25 testes passaram nos módulos de planejamento, políticas, rotas, justificativa e estado de revisão. |
| Suíte completa sem OAuth externo | 47 arquivos e 123 testes passaram, excluindo somente o teste que exige credenciais OAuth do Google Drive não disponíveis neste ambiente. |
| Diff | `git diff --check` passou sem erros de whitespace. |

## 7. Amostra visual da PORTA e da DFD

A rota pública `/#porta-preview` foi adicionada como prévia de conteúdo e linguagem. Ela apresenta a finalidade da PORTA, a sequência de preenchimento, a regra de ouro contra textos genéricos, um bloco de campos com ícones de orientação e uma DFD visual de exemplo com `DFD nº 1/2027 · V01`. A prévia é explicitamente não oficial e não cria registros.

Os tooltips dos campos da PORTA usam `title`, `aria-label` e `data-tooltip`, permitindo leitura por mouse, teclado e tecnologia assistiva. Os limites aparecem no próprio rótulo: objeto resumido até 60 caracteres, descrição detalhada com mínimo de 60 e justificativa com mínimo de 1.000.

## 8. Próxima discussão funcional

A PORTA/DFD está alinhada para o debate seguinte. A próxima decisão recomendada é a **AGENDA/PCA**, especialmente o critério de consolidação de demandas aprovadas parcialmente, a montagem do PCA anual a partir de uma ou mais consolidações e a autoridade de publicação antes da entrada do Setor de Compras.

## Referências

[1]: https://github.com/mezoempreendimentos-tech/orbita-spac/blob/main/client/src/pages/Home.tsx "Órbita — telas PORTA, RASCUNHOS, AGENDA e TRILHA"

[2]: https://github.com/mezoempreendimentos-tech/orbita-spac/blob/main/server/planningService.ts "Órbita — serviço de planejamento, rascunhos e prazos"

[3]: https://github.com/mezoempreendimentos-tech/orbita-spac/blob/main/server/planningTwoStageService.ts "Órbita — triagem e decisão presidencial da DFD"

[4]: https://github.com/mezoempreendimentos-tech/orbita-spac/blob/main/server/notificationService.ts "Órbita — avisos internos direcionados"

[5]: https://github.com/mezoempreendimentos-tech/orbita-spac/blob/main/drizzle/schema.ts "Órbita — modelo de dados"
