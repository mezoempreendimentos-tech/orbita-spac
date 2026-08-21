# Requisitos oficiais — Assinatura Eletrônica gov.br

A integração com a API de Assinatura Eletrônica gov.br exige que a aplicação do órgão esteja previamente integrada ao **Login Único** e que o órgão solicite credenciais específicas para os ambientes de homologação e produção. A API usa OAuth 2.0, com autorização explícita do assinante, `client_id`, `client_secret` e uma URL de retorno pertencente ao domínio do órgão.

| Aspecto | Requisito levantado |
|---|---|
| Identidade do assinante | Conta gov.br com nível **prata ou ouro** para assinatura avançada. |
| Autorização | Consentimento explícito do usuário no fluxo OAuth; o escopo `sign` autoriza uma assinatura de hash por token. |
| Documento | Para PDF, a API pode gerar assinatura PKCS#7 destacada (`.p7s`) sobre o hash SHA-256 ou ser integrada a uma assinatura envelopada no PDF. |
| Homologação | O órgão deve obter credenciais, demonstrar login, assinatura, tratamento de conta sem nível suficiente e logout. |
| Validação | Documentos de produção podem ser validados pelo ITI. |

> A ÓRBITA não deve afirmar que um documento foi assinado pelo gov.br até receber a resposta da API e registrar o certificado, o identificador de assinatura, o hash do arquivo e a evidência de validação.

## Fontes oficiais

1. [Manual de Integração da API de Assinatura Eletrônica gov.br](https://manual-integracao-assinatura-eletronica.servicos.gov.br/pt-br/8.2/iniciarintegracao.html)
2. [Catálogo Conecta gov.br — Assinatura Digital Avançada](https://www.gov.br/conecta/catalogo/apis/assinatura-digital-avancada)
