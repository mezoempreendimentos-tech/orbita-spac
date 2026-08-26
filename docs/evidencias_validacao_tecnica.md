# Evidências de validação técnica — integração SPAC, PCA e TRILHA

## Verificações automatizadas

| Verificação | Resultado | Evidência |
|---|---|---|
| Tipos TypeScript | Aprovada | `pnpm exec tsc --noEmit` concluído sem erros após as alterações finais. |
| Suíte funcional | Aprovada | 50 arquivos e 136 testes passaram, excluindo somente `server/dfdPdfVerificationService.test.ts` e `server/googleOAuthCredentials.test.ts`, que dependem de segredo/endpoint externo não disponível nesta execução. |
| CNAE oficial | Aprovada | `server/cnaeService.test.ts` cobre pesquisa de subclasses, formatação `6201-5/00`, classe-base, fonte/versão IBGE e reutilização do cache. |
| Análise preventiva do PCA | Aprovada | `shared/openingRequestAnalysis.test.ts` cobre termos relevantes, mesma subclasse/classe-base e exigência condicional de justificativa. A consulta de produção compara todos os itens do PCA e exclui o próprio item selecionado. |
| Saldo quantitativo | Aprovada | `shared/openingRequestQuantities.test.ts` fixa o cenário de 13 unidades, reserva de 1 e saldo 12, além de bloquear excesso e saldo negativo. |
| Router e decisões legadas | Aprovada | `server/planningRouter.test.ts` e `server/planningDecisionService.test.ts` continuam passando, preservando o encaminhamento e a compatibilidade com registros antigos. |
| Compilação de produção | Aprovada | `pnpm build` concluiu a geração do cliente Vite e do servidor Express. O bundler emitiu apenas o aviso conhecido de chunks grandes do cliente. |
| Migração Drizzle | Aprovada | `drizzle/0026_opening_request_groups.sql` e `drizzle/meta/0026_snapshot.json` estão presentes; uma nova execução de `drizzle-kit generate` não criou diferença adicional. O journal mantém uma única entrada para a migração 0026. |
| Preview público | Aprovada | A aplicação local respondeu em `http://localhost:3000/`; a tela pública da ÓRBITA carregou a Identidade B sem exceções no console. |

## Regras funcionais verificadas no código

| Regra | Implementação validada |
|---|---|
| PCA itemizado | `pcaDemandItems` relaciona PCA, DFD e item original; criação de PCA, publicação de atualização e backfill histórico usam somente itens aprovados/confirmados. |
| Abertura parcial | O SPAC seleciona itens e informa quantidade por item; o servidor calcula saldo e bloqueia as linhas selecionadas dentro da transação antes de reservar. |
| Devolução/reapresentação | Pedido devolvido recebe nova versão no mesmo identificador, com justificativa de revisão e recálculo de saldo/análise. |
| Não autorização | Novo pedido pode referenciar o pedido anterior não autorizado e deve justificar a alteração; a reserva do pedido anterior não permanece ativa. |
| Decisão de grupo | A autorização, devolução ou não autorização é aplicada à versão inteira; a TRILHA copia todos os itens e quantidades da versão autorizada. |
| Modalidade final | A modalidade proposta e a modalidade determinada pela Presidência usam o valor da lista oficial ativa; o fluxo final também pode ser definido quando a decisão for diferente. |
| CNAE | Cada versão guarda CNAE original, subclasse final, classe-base, descrição, fonte e versão da consulta; a Presidência não edita esse dado. |
| Encerramento | O encerramento com sucesso consome a quantidade; o encerramento sem sucesso libera o saldo. Todas as DFDs participantes recebem o aviso final sem duplicidade por processo. |
| Alteração na TRILHA | O SPAC propõe e justifica; a Presidência autoriza, devolve ou não autoriza; somente a autorização altera o processo e o histórico anterior fica preservado. |

## Limites da validação

A execução local não aplicou a migração em um banco institucional nem realizou login com uma conta real para clicar nas telas protegidas. A validação autenticada deve ser realizada no ambiente de homologação, após aplicação da migração 0026, cadastro da lista `MODALIDADES_CONTRATACAO` e confirmação dos papéis institucionais.

A estimativa proporcional usada no pedido de abertura é adequada para planejamento, mas não substitui a apuração do valor efetivo da contratação. A convenção definitiva de códigos de subitens do PCA ainda deve ser homologada pela Administração antes do uso normativo.

**Autor:** Manus AI
