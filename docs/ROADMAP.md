# Roadmap

> Visão executiva. Para os detalhes técnicos de cada fase, veja [`PROPOSTA_TECNICA.md`](PROPOSTA_TECNICA.md#5-roadmap-de-desenvolvimento).

## Visão temporal

```
Hoje      F0 (3-4m)         F1 (5-7m)         F2 (4-6m)         F3 (4-6m)         F4+
 │        │                 │                 │                 │                 │
 ├────────┼─────────────────┼─────────────────┼─────────────────┼─────────────────┤
 │  Setup │  Fundação       │  MVP funcional  │  Execução +      │  Inteligência +  │  Evolução
 │  repo  │  + 1 fluxo      │  DFD→MAESTRO    │  Fornecedores +  │  extração        │  (IA, mobile,
 │  CI    │  BPMN real      │  (dispensas)    │  Portal público  │  seletiva        │  multi-tenant)
```

## F0 — Fundação (3-4 meses)

**Objetivo:** base técnica, identidade, modelagem inicial, 1 fluxo real funcionando ponta a ponta.

| Entrega | Detalhe |
|---|---|
| Infra | K8s config base, GitHub Actions CI, GHCR, Vault |
| Banco | Postgres 16 com Flyway, schemas por bounded context |
| Mensageria | Kafka KRaft + Schema Registry |
| Identidade | Keycloak com integração gov.br (OIDC) |
| Workflow | Camunda 8 instalado; modelado fluxo DFD → Aprovação → Conclusão |
| Design system | Figma + biblioteca Next.js base |
| App shell | Next.js com layout, auth, navegação |
| OFICINA | CRUD de modelos e versões |
| MEMÓRIA | Append-only + endpoint de consulta por processo |
| FAROL | 1 alerta dummy baseado em evento do Kafka |

**Marco:** homologação rodando, 1 fluxo de DFD ponta a ponta no Camunda, evento publicado no Kafka, MEMÓRIA recebendo, FAROL gerando alerta.

## F1 — MVP funcional (5-7 meses após F0)

**Objetivo:** primeiro processo de contratação real (simplificado) fluindo de PORTA até MAESTRO.

| Módulo | Escopo mínimo |
|---|---|
| PORTA | DFD completo, anexos, demandante, valor estimado, workflow "DFD → Aprovação chefia → AGENDA" |
| AGENDA | PAC, vincular DFD a item, registrar necessidade superveniente |
| TRILHA | Orquestração em Camunda, identifica etapas obrigatórias, distribui tarefas, controla pré-requisitos, permite retorno |
| LUPA | Editor de ETP, alternativas, matriz de risco |
| RÉGUA | Editor de TR, itens, critérios |
| TERMÔMETRO | Pesquisa manual + integração Painel de Preços, cálculo de valor estimado |
| LASTRO | Dotação orçamentária, natureza de despesa, status |
| ORÁCULO | Encaminhamento, manifestações, pareceres, controle de status |
| MAESTRO | Versão inicial — dispensas e inexigibilidades (mais simples) |
| FAROL | Alertas de prazo por etapa |
| MEMÓRIA | Histórico de eventos consultável por processo |
| OFICINA | Modelos de DFD, ETP, TR, minuta de contrato versionados |

**Integrações:** gov.br (identidade), Painel de Preços, PNCP (publicação inicial).

**Não entra em F1:** licitações complexas, ELO/VIGIA completos, ÍMÃ completo, BÚSSOLA, ÁGUIA, ATLAS, ECO/VITRINE plenos.

**Marco:** 1 processo de dispensa passando por todo o fluxo, homologado com 3-5 usuários-piloto do SPAC.

## F2 — Execução contratual, fornecedores e publicações (4-6 meses após F1)

| Módulo | Escopo |
|---|---|
| ELO | Vigência, prorrogações, reajustes, repactuações, garantias, pagamentos, encerramento |
| VIGIA | Cadastro de fiscais, ocorrências, irregularidades, notificações, sanções |
| ÍMÃ | Cadastro integrado, habilitação (Lei 14.133), PNCP, Comprasnet, APIs de certidões, histórico |
| ECO | Esteira de publicações, integração com PNCP, diário oficial |
| VITRINE | Portal público SSR/ISR, busca, a11y WCAG 2.1 AA, LGPD-compliant |
| MAESTRO | Pregão eletrônico, concorrência, lances, julgamento, habilitação, recursos, adjudicação, homologação |
| ORÁCULO | Integração com sistemas jurídicos (PGE, AGU) |
| OFICINA | Modelos de edital, atas, minutas, checklists |

**Marco:** fluxo completo Licitação → Contrato → Execução → Fiscalização → Publicação, com fornecedores integrados e portal público no ar.

## F3 — Inteligência e otimização (4-6 meses após F2)

| Módulo | Escopo |
|---|---|
| BÚSSOLA | Data mart: tempo médio, duração por etapa, modalidades, gargalos, séries históricas |
| ÁGUIA | Dashboard gerencial: pendências, prazos críticos, gargalos, drill-down |
| MAPA | Busca avançada (OpenSearch), filtros múltiplos, faceted search |
| ATLAS | Base de conhecimento: legislação, jurisprudência, FAQ, manuais internos |
| MEMÓRIA | Timeline visual, exportação de relatório de auditoria |
| FAROL | Antecipação preditiva (regras + ML) — alerta processos em risco de atraso |
| ÍMÃ | Recomendações, scoring de risco |

**Extrações arquiteturais (se justificadas por volume/segurança):**
- VITRINE → microsserviço público autônomo
- ÍMÃ → serviço isolado (integrações externas dominam)
- BÚSSOLA → serviço analítico com data store próprio

## F4+ — Evolução contínua

- IA aplicada: geração assistida de ETP/TR (RAG sobre OFICINA + ATLAS)
- Análise de risco de fornecedor com ML
- Multi-tenant comercial (SaaS) com onboarding automatizado
- Mobile para fiscais em campo (VIGIA mobile)
- API pública para integração com sistemas de outros órgãos
- Observabilidade avançada: APM, tracing distribuído, SLO/SLI formalizados

## Marcos de entrega (resumo)

| Marco | Fim previsto | Quem usa |
|---|---|---|
| M1 — Fundação com fluxo BPMN | F0 | Equipe técnica |
| M2 — MVP: dispensa ponta a ponta | F1 | 3-5 usuários-piloto SPAC |
| M3 — Licitação + Contrato + Publicação | F2 | SPAC inteiro |
| M4 — Inteligência + Multi-tenant | F3 | SPAC + 1-2 órgãos piloto |
| M5 — Comercialização ativa | F4+ | Clientes externos |

## Estratégia de rollout

- **Piloto F1:** 3-5 usuários-chave do SPAC, 1 modalidade (dispensa/inexigibilidade), homologação
- **Onda 1 F2:** SPAC inteiro em modo híbrido (paralelo ao legado se houver)
- **Onda 2 F3:** outros setores do órgão que demandam contratações
- **Go-live F3+/F4:** substituição do legado, Vitrine pública ativa
- **Adoção externa F5+:** multi-tenant SaaS, novos órgãos como clientes
