# Estratégia de Implantação

> Como o sistema sai do código e vira software rodando.

## Cenários de implantação

A ÓRBITA suporta 3 cenários, cada um com trade-offs próprios. A escolha depende do porte e exigência de soberania do cliente.

### Cenário 1 — Desenvolvimento e testes (agora, F0-F1)

**Onde:** máquina local de cada desenvolvedor.

**Stack:**
- Docker Compose com Postgres 16, Kafka, Keycloak, Camunda 8, MinIO, Redis
- IDEs (IntelliJ, VS Code)
- Sem cloud, sem custos recorrentes

**Quem opera:** a equipe técnica (você + Débora + Mavis).

**Configuração inicial:**

```powershell
# Pré-requisitos
winget install Docker.DockerDesktop

# Subir infraestrutura de dev
docker compose -f infra/docker/docker-compose.dev.yml up -d

# Verificar
docker compose -f infra/docker/docker-compose.dev.yml ps
```

### Cenário 2 — Homologação (F1+)

**Onde:** uma VM cloud pequena ou servidor on-prem dedicado.

**Stack:**
- Mesma do dev, mas exposta na rede interna
- Domínio próprio (ex: `homolog.orbita.spac.gov.br`)
- Backups diários
- Observabilidade básica (Grafana + Prometheus)

**Quem opera:** Débora (homologação funcional) + você (decisões).

### Cenário 3 — Produção (F2+)

**Onde:** cloud soberana (recomendado) ou on-prem.

**Stack:**
- Kubernetes gerenciado
- PostgreSQL com alta disponibilidade
- Kafka em cluster (3+ brokers)
- Camunda Zeebe em cluster
- CDN/WAF na frente do portal público
- Backups automatizados
- Observabilidade completa
- DR (disaster recovery) com RPO ≤ 30min, RTO ≤ 4h

## Modelos de comercialização

### SaaS multi-tenant (recomendado)

| Aspecto | Detalhe |
|---|---|
| Hospedagem | Operada por Mezo Empreendimentos |
| Isolamento | Schema-per-tenant no Postgres + RLS + namespace por tenant no K8s |
| Onboarding | Self-service via portal, com aprovação para gov |
| Receita | Mensalidade por tenant + número de usuários |
| Suporte | Incluído no plano básico, premium pago |

**Pro:** escala, receita recorrente, menor custo por cliente
**Contra:** exige confiança do cliente em soberania de dados (mitigado com cloud brasileira)

### On-premise por cliente (premium)

| Aspecto | Detalhe |
|---|---|
| Distribuição | Helm chart instalável + container images |
| Isolamento | Total (cluster dedicado do cliente) |
| Onboarding | Time da Mezo Empreendimentos instala e treina |
| Receita | Licença anual + setup + suporte premium |
| Suporte | SLA contratual (4h, 8h, ou 24h) |

**Pro:** soberania total, ticket maior, atende clientes que proíbem cloud externa
**Contra:** vocês viram eterna equipe de suporte e instalação

### Híbrido (recomendado para ir ao mercado)

SaaS como default, on-premise como escape hatch para clientes premium (União, grandes estados, estatais).

## Pipeline de CI/CD

```
PR aberto
   ↓
GitHub Actions: lint + build + testes
   ↓
Code review (você ou Débora aprova)
   ↓
Merge em develop
   ↓
Deploy em homologação (automático)
   ↓
Validação com usuários (Débora)
   ↓
Promoção para main (PR)
   ↓
Deploy em produção (manual, com OK de você)
```

**Ferramentas:**
- GitHub Actions — CI
- ArgoCD ou GitHub Actions — CD
- Terraform — IaC
- Helm — pacotes Kubernetes
- Snyk/Trivy — segurança de imagens

## Decisões pendentes

| Decisão | Quando decidir | Responsável |
|---|---|---|
| Cloud soberana (Magalu/OVH) vs hyperscaler (AWS/Azure) | Ao entrar em F2 | Você |
| Modelo de comercialização default (SaaS vs on-prem) | Antes de F3 | Você + jurídico |
| Pricing (mensalidade SaaS, licença on-prem) | Antes de F3 | Você |
| Onboarding de cliente (self-service vs assistido) | F3 | Você + Mavis |
| LGPD: DPO próprio ou compartilhado | Antes de F2 | Você |

## Resumo executivo

| Cenário | Quando | Onde | Quem opera |
|---|---|---|---|
| Dev local | F0-F1+ | Notebook | Equipe técnica |
| Homologação | F1+ | VM cloud pequena | Débora |
| Produção SaaS | F2+ | K8s em cloud soberana | Mezo Empreendimentos |
| Produção on-prem | F3+ | Datacenter do cliente | Cliente + Mezo |
