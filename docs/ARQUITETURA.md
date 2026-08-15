# Arquitetura

> Visão consolidada. Para a proposta completa com justificativas detalhadas, veja [`PROPOSTA_TECNICA.md`](PROPOSTA_TECNICA.md).

## Princípio-mestre

> *"A Trilha orquestra, mas o processo é um só."*

O sistema inteiro gravita em torno do agregado **`Contratação`**. Os 19 módulos são especializações, não sistemas independentes.

## Camadas

```
┌─────────────────────────────────────────────────────────────────────┐
│  Frontend (Next.js 14)                                              │
│  ┌────────────────────┐           ┌──────────────────────────┐      │
│  │ App interna (SPA)  │           │ VITRINE - portal público │      │
│  │ Débora + usuários  │           │ SSR/ISR, a11y, LGPD      │      │
│  └─────────┬──────────┘           └──────────┬───────────────┘      │
└────────────┼──────────────────────────────────┼──────────────────────┘
             │                                  │
             ▼                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│  API Gateway (Spring Cloud Gateway)                                 │
│  Autenticação, rate limit, roteamento                               │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
       ┌──────────────────────┴──────────────────────┐
       ▼                                             ▼
┌──────────────────────────┐         ┌─────────────────────────────┐
│  Monolito Modular        │         │  Camunda 8 (Zeebe)          │
│  (Java 21 + Spring Boot) │ ◄──────►│  Motor BPMN - orquestra     │
│                          │         │  a Trilha                   │
│  PORTA, AGENDA, TRILHA,  │         └─────────────────────────────┘
│  LUPA, RÉGUA, TERMÔMETRO,│
│  LASTRO, ORÁCULO,        │         ┌─────────────────────────────┐
│  MAESTRO, ELO, VIGIA,    │ ◄──────►│  Contextos reativos         │
│  ÍMÃ                     │ eventos │  ECO, MEMÓRIA, FAROL,       │
│                          │─────────│  BÚSSOLA                    │
└──────────┬───────────────┘         └──────────────┬──────────────┘
           │                                        │
           └────────────────┬───────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Dados & Mensageria                                                 │
│  PostgreSQL 16  │  OpenSearch  │  MinIO  │  Redis  │  Kafka 3.6+   │
└─────────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Identidade & Integração                                            │
│  Keycloak + gov.br  │  PNCP  │  Comprasnet  │  SIAFI  │  APIs      │
└─────────────────────────────────────────────────────────────────────┘
```

## Bounded contexts (DDD)

| Contexto | Módulos | Banco |
|---|---|---|
| `contratacao` | PORTA, AGENDA, TRILHA, LUPA, RÉGUA, TERMÔMETRO, LASTRO, ORÁCULO | schema `contratacao` |
| `licitacao` | MAESTRO | schema `licitacao` |
| `contrato` | ELO, VIGIA | schema `contrato` |
| `fornecedor` | ÍMÃ | schema `fornecedor` |
| `publicacao` | ECO | schema `publicacao` |
| `catalogo` | OFICINA, ATLAS | schema `catalogo` |
| `inteligencia` | ÁGUIA, FAROL, MAPA, BÚSSOLA | read models + DW |
| `memoria` | MEMÓRIA | append-only no `auditoria` + Kafka |
| `identidade` | auth | Keycloak |

## Eventos de domínio (publicados no Kafka)

| Tópico | Eventos | Consumido por |
|---|---|---|
| `contratacao.events.v1` | DemandaRecebida, DFDFormalizado, ETPIniciado, ETPConcluido, TRConcluido, PesquisaPrecoConcluida, DotacaoConfirmada, ParecerEmitido | MEMÓRIA, FAROL, BÚSSOLA, ECO |
| `licitacao.events.v1` | EditalPublicado, PropostaRecebida, JulgamentoRealizado, Adjudicacao, Homologacao | MEMÓRIA, ECO, FAROL |
| `contrato.events.v1` | ContratoAssinado, PagamentoRealizado, ProrrogacaoSolicitada, ContratoEncerrado | MEMÓRIA, FAROL, ÍMÃ |
| `fornecedor.events.v1` | FornecedorCadastrado, SancaoRegistrada, CertidaoVencendo | FAROL, BÚSSOLA |
| `publicacao.events.v1` | PublicacaoSolicitada, PublicacaoConfirmada, PublicacaoFalhou | VITRINE, FAROL |

## Princípios não-funcionais aplicados

- **Auditabilidade por construção** (event sourcing do agregado Contratação)
- **LGPD** (pseudonimização na projeção da MEMÓRIA, base legal explícita)
- **Resiliência** (circuit breaker, retry, fila de reprocessamento em todas as integrações externas)
- **Observabilidade** (correlation ID em 100% das requisições, tracing distribuído)
- **Acessibilidade** (WCAG 2.1 AA no Vitrine, e-MAG)
- **Versionamento imutável** (documentos content-addressable no MinIO)

## Decisões fundamentais

Veja [`DECISOES.md`](DECISOES.md) para os ADRs (Architecture Decision Records) detalhados.

| # | Decisão | ADR |
|---|---|---|
| ADR-001 | Monolito Modular como estilo arquitetural | [`DECISOES.md`](DECISOES.md#adr-001) |
| ADR-002 | Camunda 8 como motor de workflow da Trilha | [`DECISOES.md`](DECISOES.md#adr-002) |
| ADR-003 | Event sourcing parcial para a Contratação | [`DECISOES.md`](DECISOES.md#adr-003) |
| ADR-004 | Schema-per-tenant para multi-tenancy | [`DECISOES.md`](DECISOES.md#adr-004) |
| ADR-005 | Java 21 + Spring Boot 3 como stack principal | [`DECISOES.md`](DECISOES.md#adr-005) |

## Diagramas detalhados

- Fluxo de uma contratação completa: [`bpmn/flows/`](../../bpmn/flows/)
- Modelo de dados (ER): [`docs/MODELAGEM_DADOS.md`](MODELAGEM_DADOS.md) *(em construção)*
- Sequência de uma dispensa ponta a ponta: *(em construção)*
