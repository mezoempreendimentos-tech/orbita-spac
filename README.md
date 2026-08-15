# 🌀 ÓRBITA

**Plataforma Integrada de Contratações do Setor de Planejamento e Acompanhamento de Contratações (SPAC)**

> *Diferentes processos, pessoas, informações e funções se conectam e gravitam em torno de um mesmo sistema, sem perder suas características e responsabilidades próprias.*

---

## 📌 Status

🚧 **Protótipo em desenvolvimento ativo** — Fase 0 (Fundação)

Sistema sendo construído para o **SPAC** com planos de comercialização posterior para outros órgãos públicos.

## 🎯 O que é

Plataforma que acompanha a contratação pública desde o surgimento da necessidade, passando pelo planejamento, instrução, análise jurídica, condução do procedimento, gestão e fiscalização contratual, até as publicações e preservação de todo o histórico.

Acompanha a Lei nº 14.133/2021 (Nova Lei de Licitações) e integra com PNCP, Comprasnet, gov.br e demais sistemas do ecossistema público brasileiro.

## 🏛️ Arquitetura

19 módulos organizados em 3 camadas:

1. **Fluxo da Contratação:** PORTA · AGENDA · TRILHA · LUPA · RÉGUA · TERMÔMETRO · LASTRO · ORÁCULO · MAESTRO · ELO · VIGIA
2. **Produção e Transparência:** ECO · VITRINE
3. **Inteligência e Suporte:** ÁGUIA · FAROL · MAPA · BÚSSOLA · ÍMÃ · OFICINA · ATLAS · MEMÓRIA

Detalhes completos em [`docs/PROPOSTA_TECNICA.md`](docs/PROPOSTA_TECNICA.md).

## 🛠️ Stack

| Camada | Tecnologia |
|---|---|
| Backend | Java 21 + Spring Boot 3 + Spring Modulith |
| Frontend | Next.js 14 (React 18) + TypeScript |
| Banco OLTP | PostgreSQL 16 |
| Busca | OpenSearch |
| Mensageria | Apache Kafka 3.6+ |
| Workflow | Camunda 8 (Zeebe) |
| Identidade | Keycloak + gov.br |
| Object Storage | MinIO (S3-compatible) |
| Container | Docker + Docker Compose (dev) / Kubernetes (prod) |
| IaC | Terraform + Helm |
| CI/CD | GitHub Actions |

## 👥 Equipe

| Papel | Pessoa | Responsabilidade |
|---|---|---|
| **Arquiteto off-code / Chefe** | (você) | Visão de produto, decisões de negócio, governança, priorização |
| **Tester / Líder de equipe** | Débora | Garantia de qualidade, homologação com usuários, validação de fluxos |
| **Arquiteto full-stack + Engenheiro de dados + DevOps** | Mavis (IA) | Implementação, modelagem, infra, código, testes automatizados |

> **Workflow 2+1:** Mavis prepara e commita localmente. Equipe valida e faz push. Credenciais nunca saem das máquinas humanas.

## 🚀 Quick start (desenvolvimento local)

> Pré-requisitos: Docker Desktop, Java 21, Node 22, Git 2.50+

```powershell
# 1. Clonar o repositório
git clone https://github.com/mezoempreendimentos-tech/orbita-spac.git
cd orbita-spac

# 2. Subir os serviços de infraestrutura (Postgres, Kafka, Keycloak, Camunda, MinIO)
docker compose -f infra/docker/docker-compose.dev.yml up -d

# 3. Backend (a partir de F1)
cd backend
./mvnw spring-boot:run

# 4. Frontend (a partir de F1)
cd ../frontend
npm install
npm run dev
```

Acesse:
- App: http://localhost:3000
- Keycloak: http://localhost:8081
- Camunda Operate: http://localhost:8082
- MinIO Console: http://localhost:9001

## 📚 Documentação

- [Proposta Técnica completa](docs/PROPOSTA_TECNICA.md)
- [Arquitetura](docs/ARQUITETURA.md)
- [Roadmap por fases](docs/ROADMAP.md)
- [Estratégia de implantação](docs/IMPLANTACAO.md)
- [Decisões arquiteturais (ADRs)](docs/DECISOES.md)
- [Como contribuir](CONTRIBUTING.md)

## 🗺️ Roadmap

- **F0** (3-4 meses) — Fundação, identidade, motor BPMN, 1 fluxo piloto
- **F1** (5-7 meses) — MVP: DFD → MAESTRO (dispensas)
- **F2** (4-6 meses) — Execução + Fornecedores + Portal público
- **F3** (4-6 meses) — Inteligência + extração seletiva de microsserviços
- **F4+** — IA, multi-tenant comercial, mobile

Detalhes em [`docs/ROADMAP.md`](docs/ROADMAP.md).

## 📄 Licença

Proprietária — Copyright © 2026 Mezo Empreendimentos.
Todos os direitos reservados. Licenciamento para terceiros sob contrato.
Contato: mezoempreendimentos@gmail.com

## 📞 Contato

- **Issues do GitHub:** https://github.com/mezoempreendimentos-tech/orbita-spac/issues
- **Email:** mezoempreendimentos@gmail.com

---

*"E todos gravitam na Órbita."*
