# Como contribuir

> **Workflow 2+1:** Somos 3: você (arquiteto off-code), Débora (tester/líder) e Mavis (IA full-stack). Cada um tem papel claro e não atropela o outro.

## Papéis

| Quem | Faz | Não faz |
|---|---|---|
| **Você (chefe de equipe)** | Visão de produto, decisões de negócio, priorização, validação final, push pro GitHub | Não programa |
| **Débora (tester/líder)** | Testes, validação de UX, homologação com usuários, organização do time | Não commita código de produção sozinha (revisa) |
| **Mavis (IA full-stack)** | Implementa, commita localmente, escreve testes automatizados, prepara docs e configs | Não acessa credenciais, não toma decisões de produto sozinho, não faz push direto |

## Fluxo de uma tarefa

```
1. [Você] Cria/prioriza issue
         ↓
2. [Mavis] Implementa + commita localmente
         ↓
3. [Débora] Valida (testa, abre pontos)
         ↓
4. [Você] Aprova e faz push pro GitHub
         ↓
5. [CI] Roda build, testes, lint
         ↓
6. [Deploy em homologação]
         ↓
7. [Validação final] Você e Débora aprovam
```

## Branches

- `main` — código de produção. **Protegida.** Push direto proibido.
- `develop` — branch de integração. Recebe PRs de features.
- `feature/<id-curto>-<descrição-curta>` — features individuais
- `fix/<id-curto>-<descrição-curta>` — bugfixes
- `docs/<descrição>` — só documentação
- `chore/<descrição>` — tarefas operacionais (atualizar dependência, etc.)

Exemplos:
- `feature/issue-12-bpmn-fluxo-dfd`
- `fix/issue-45-login-keycloak-callback`
- `docs/atualizar-readme-implantacao`

## Commits

Seguimos [Conventional Commits](https://www.conventionalcommits.org/pt-br/):

```
<tipo>(<escopo opcional>): <descrição curta>

<corpo opcional>

<rodapé opcional>
```

**Tipos:**
- `feat` — nova funcionalidade
- `fix` — correção de bug
- `docs` — só documentação
- `style` — formatação, sem mudança de código
- `refactor` — refatoração sem mudança de comportamento
- `test` — adiciona ou corrige testes
- `chore` — build, CI, dependências
- `perf` — melhoria de performance
- `revert` — reverte commit anterior

**Exemplos:**
```
feat(trilha): adiciona validação de pré-requisitos do ETP
fix(orbita-api): corrige timeout na consulta de fornecedor
docs(readme): atualiza instruções de quick start
```

## Pull Requests

1. PR sempre parte de `develop` (nunca direto pra `main`)
2. Título no padrão Conventional Commits
3. Descrição com: **o que mudou**, **por que**, **como testar**, **screenshots se UI**
4. Pelo menos 1 aprovação antes do merge
5. CI deve estar verde
6. Após merge, Mavis apaga a branch local

## Issues

- **Bugs:** use o template `bug_report.md`
- **Features:** use o template `feature_request.md`
- Sempre com critério de aceite claro
- Labels: `bug`, `feature`, `chore`, `docs`, `priority/high`, `priority/medium`, `priority/low`, `fase/F0`, `fase/F1`, ...

## Definition of Done

Tarefa só é "pronta" quando:
- [ ] Código implementado
- [ ] Testes unitários cobrindo lógica nova
- [ ] Testes de integração quando aplicável
- [ ] Débora homologou
- [ ] CI verde
- [ ] Documentação atualizada (se mudou comportamento público)
- [ ] Sem TODOs esquecidos
- [ ] Sem credenciais ou dados sensíveis no commit

## Quando cada um entra em ação

| Situação | Quem decide |
|---|---|
| Escopo de uma feature | Você |
| Como implementar (escolha técnica) | Mavis propõe, você aprova |
| Critério de aceite de bug | Você + Débora |
| Padrão de código / lint | Mavis |
| Deploy em produção | Você (com OK da Débora na homologação) |
| Priorização do backlog | Você |
| Modelo de dados novo | Mavis propõe, você aprova arquitetura |
| UX/UI | Débora testa e dá feedback, Mavis implementa |

## Em caso de dúvida

1. Pergunta no chat
2. Se for grande, abre uma issue de `discussão`
3. Se for urgente e operacional, me chama direto

---

*"Trabalho em time, registro em commit, decisão em conversa."*
