# Evidências de validação técnica — ÓRBITA v1

## Verificações automatizadas

| Verificação | Resultado | Evidência |
|---|---|---|
| Tipos TypeScript | Aprovada | `pnpm check` concluído sem erros. |
| Testes automatizados | Aprovados | Logout, sequências de contratação direta e licitação, sinais LGPD e política de acesso LGPD. |
| Autenticação e autorização | Aprovadas | Procedure tRPC protegida rejeita contexto anônimo; matriz de permissões valida acessos positivos e negativos por papel. |
| Compilação de produção | Aprovada | `pnpm build` concluiu a geração do cliente e do servidor. |
| Rotas protegidas | Aprovadas | Área operacional e PRIVACIDADE exigem sessão autenticada; a interface não expõe dados operacionais fora da sessão. |

## Cenário ponta a ponta controlado

Foi executado um processo explicitamente identificado como **PLACEHOLDER** para validar criação de demanda, tarefa obrigatória, conclusão de tarefa, anexo de documento, conclusão de checklist, transição para a etapa seguinte, avaliação LGPD, registro de risco e decisão humana. A validação retornou resultado aprovado, com a etapa seguinte `ETP` e **nove eventos de auditoria**: criação do processo, criação/atualização de tarefa, upload de documento, atualização de checklist, conclusão de workflow, salvamento de avaliação LGPD, risco e decisão de privacidade.

> O cenário e seus registros de banco foram removidos após a validação. A unidade institucional definitiva **Câmara Municipal de Foz do Iguaçu — SPAC** permanece cadastrada, sem processos, documentos ou decisões administrativas fictícias.
