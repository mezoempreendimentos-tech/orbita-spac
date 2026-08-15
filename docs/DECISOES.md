# Decisões Arquiteturais (ADRs)

> Architecture Decision Records — registro imutável das decisões importantes do projeto. Cada ADR é numerado, datado e descreve contexto, decisão e consequências.

## ADR-001 — Monolito Modular como estilo arquitetural

**Data:** 2026-08-15
**Status:** ✅ Aceita
**Decisor:** Mavis (proposta), você (aprovação)

### Contexto

O sistema tem 19 módulos que gravitam em torno de um único agregado de domínio (a `Contratação`). Construir 19 microsserviços desde o dia 1 traz custo operacional alto (rede, transações distribuídas, observabilidade distribuída) sem benefício proporcional, dado que o domínio é coeso.

### Decisão

Adotar **Monolito Modular** com Spring Modulith:
- 1 deploy, 1 banco principal
- Bounded contexts explícitos verificados em build (ArchUnit)
- Event-driven interno via Kafka para comunicação assíncrona
- Evolução para microsserviços seletivos a partir de F3

### Consequências

**Positivas:**
- Consistência transacional forte no fluxo principal
- Equipe 2+1 consegue operar sem virar refém de K8s distribuído
- Evolução modular sem reescrita

**Negativas:**
- Acoplamento de deploy (1 release afeta 19 módulos)
- Necessidade de disciplina com ArchUnit pra manter fronteiras
- Performance: tudo compete pelo mesmo pool de recursos (mitigado com profiles e auto-scaling)

## ADR-002 — Camunda 8 como motor de workflow da Trilha

**Data:** 2026-08-15
**Status:** ✅ Aceita

### Contexto

A Trilha é descrita como um orquestrador: identifica etapas, controla pré-requisitos, distribui responsabilidades, permite retorno para correção, e não segue caminho linear. Isso é literalmente um motor de BPMN.

### Decisão

Adotar **Camunda 8** (Zeebe + Operate + Tasklist + Modeler) como motor de workflow:
- Modelagem em BPMN 2.0 (padrão da indústria)
- Versionamento de fluxo nativo
- Auditoria nativa
- Tasklist para trabalho humano (substitui UI custom para LUPA, RÉGUA, etc.)

### Consequências

**Positivas:**
- Não reinventar a roda (BPMN é padrão)
- Suporte a múltiplas modalidades de licitação como subprocessos
- Time de sustentação menor (Camunda é maduro)

**Negativas:**
- Lock-in parcial (mitigado: Camunda Community é open source, Zeebe tem API aberta)
- Custo de treinamento da equipe
- Operação adicional (Zeebe precisa de cluster)

## ADR-003 — Event sourcing parcial para o agregado Contratação

**Data:** 2026-08-15
**Status:** ✅ Aceita

### Contexto

O módulo MEMÓRIA precisa preservar todo o histórico do processo. A forma ingênua (tabela `audit_log` separada, escrita em cada operação) gera acoplamento e o problema do "dual write".

### Decisão

Adotar **event sourcing parcial**: cada mudança de estado do agregado `Contratação` é um evento imutável publicado no Kafka. O estado atual é uma projeção. A MEMÓRIA materializa esses eventos para consulta.

### Consequências

**Positivas:**
- Auditoria por construção
- Reconstrução determinística de qualquer estado passado
- LGPD-friendly (pseudonimização na projeção, evento bruto preservado)

**Negativas:**
- Complexidade adicional no time
- Eventual consistency (mitigado com projection read-after-write no agregado principal)
- Custo de storage maior (log retido por anos)

## ADR-004 — Schema-per-tenant para multi-tenancy

**Data:** 2026-08-15
**Status:** ✅ Aceita (com escopo F2+)

### Contexto

A ÓRBITA será comercializada para outros órgãos. Multi-tenancy é requisito para SaaS. LGPD exige isolamento de dados entre clientes.

### Decisão

Adotar **schema-per-tenant** no PostgreSQL:
- Cada tenant tem seu próprio schema (`tenant_<id>`)
- Row-level security no schema público
- Conexão de banco com `search_path` ajustado por tenant
- Migrations rodam em todos os schemas (Flyway com placeholders)

### Consequências

**Positivas:**
- Isolamento físico de dados (LGPD tranquilo)
- Backup/restore por tenant
- Migração de tenant entre clusters facilitada

**Negativas:**
- Mais complexidade operacional
- Migrations precisam ser testadas com todos os schemas
- Limite prático de ~1000 tenants por cluster (mitigado com sharding futuro)

## ADR-005 — Java 21 + Spring Boot 3 como stack principal

**Data:** 2026-08-15
**Status:** ✅ Aceita

### Contexto

Sistema crítico de governo com alta transacionalidade. Equipe 2+1, baixa tolerância a retrabalho por escolha de stack imatura.

### Decisão

Adotar **Java 21 LTS + Spring Boot 3 + Spring Modulith**:
- LTS, records, pattern matching, virtual threads
- Ecossistema maduro (Spring Cloud, Spring Data, Spring Security, Spring Integration)
- Spring Modulith para enforcement de bounded contexts

### Consequências

**Positivas:**
- Maturidade operacional alta
- Mão de obra encontrável no mercado brasileiro
- Compatibilidade com todo o ecossistema (Camunda, Kafka clients, OpenAPI)
- LTS com suporte estendido

**Negativas:**
- Tempo de boot maior que Go/Node (mitigado com GraalVM Native Image em F4+)
- Curva de aprendizado do Spring Modulith

## ADR-006 — Comercialização como SaaS híbrido

**Data:** 2026-08-15
**Status:** 🟡 Aceita com decisão final pendente (você + jurídico)
**Decisor:** Você

### Contexto

A plataforma será inicialmente um protótipo no SPAC e futuramente comercializada para outros órgãos. Modelo de negócio afeta arquitetura, suporte e go-to-market.

### Decisão proposta (Mavis)

Adotar modelo **híbrido**:
- **SaaS multi-tenant** como default (escala, receita recorrente)
- **On-premise via Helm chart** como escape hatch para clientes premium
- **Cloud soberana** (MagaluCloud/OVH BR) como hospedagem padrão

### Decisão final

A ser tomada por você + jurídico antes de F3.

### Consequências

**Positivas:**
- Cobre o mercado (pequenos clientes SaaS, grandes clientes on-prem)
- Maximiza receita potencial
- Mantém soberania como opção

**Negativas:**
- Mais código (dois modos de deploy)
- Mais documentação
- Mais suporte a treinar

## ADR-007 — Workflow "Mavis prepara, equipe commita e pusha"

**Data:** 2026-08-15
**Status:** ✅ Aceita

### Contexto

Equipe 2+1 (você, Débora, Mavis). Mavis é IA sem credencial de GitHub. Compartilhar PAT é vetor de ataque. Mavis rodar `git push` direto na sua máquina causa atrito operacional.

### Decisão

Adotar workflow **"Mavis prepara, equipe commita e pusha"**:
- Mavis escreve código, cria commits locais
- Mavis prepara scripts de push (comandos prontos pra colar)
- Equipe revisa, valida, executa push
- Credenciais nunca saem das máquinas humanas
- Mavis nunca tem acesso direto a tokens

### Consequências

**Positivas:**
- Zero credencial compartilhada com IA
- Humano no loop de toda publicação
- Rastreabilidade clara

**Negativas:**
- Velocidade menor (humano como gate)
- Possível gargalo se você não estiver disponível

---

*Novos ADRs são adicionados conforme decisões forem tomadas. Formato inspirado em [adr.github.com](https://adr.github.com).*
