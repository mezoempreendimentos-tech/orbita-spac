# ÓRBITA — Edição auto-hospedada

Esta edição executa a aplicação em infraestrutura própria, com **MariaDB**, arquivos em volume local, autenticação por e-mail e senha institucional e integração opcional com Google Drive. Ela não usa hospedagem, autenticação, armazenamento ou analytics da plataforma de desenvolvimento. O procedimento completo está em [`docs/implantacao-independente.md`](../docs/implantacao-independente.md).

> A migração de dados do ambiente atual deve ser conduzida com cópia do banco e validação institucional. Não elimine o ambiente atual antes de validar usuários, arquivos e integrações em homologação.

## Pré-requisitos

Instale Docker Engine e Docker Compose em um servidor Linux sob gestão da Câmara. Crie também um DNS com HTTPS, preferencialmente por proxy reverso institucional (Nginx, Caddy ou Traefik). A aplicação escuta na porta definida em `APP_PORT`.

## Primeira execução

Copie `standalone/environment.template.txt` para `standalone/environment`, substitua todas as senhas de exemplo e defina `APP_ORIGIN` como a URL pública definitiva. Em seguida, no diretório `standalone`, execute:

```bash
docker compose --env-file environment up -d --build
```

O contêiner aplica automaticamente as migrações do Drizzle e cria o primeiro administrador local a partir de `LOCAL_ADMIN_EMAIL` e `LOCAL_ADMIN_PASSWORD` quando esse usuário fizer o primeiro login. Depois do acesso inicial, a senha de bootstrap deve ser removida do arquivo `environment` e as contas adicionais devem ser provisionadas pela administração técnica usando hashes de senha.

## Banco de dados, arquivos e backup

O banco persiste no volume `orbita_db`; arquivos que antes eram encaminhados ao armazenamento gerenciado são gravados em `orbita_files`. Para a primeira instalação em **Windows**, utilize a rotina semanal automatizada em [`windows/README.md`](./windows/README.md). Ela cria uma exportação consistente do banco, cópia dos arquivos e manifesto de integridade, com retenção configurável. Para restaurar dados já existentes, importe um dump MySQL/TiDB compatível no MariaDB de homologação antes da troca de ambiente e execute uma conferência de integridade dos vínculos de documentos.

## Google Drive

Para manter a integração individual, crie no Google Cloud uma credencial OAuth Web própria para a nova URL. Cadastre exatamente o retorno abaixo no Google Cloud Console:

```text
https://SEU_DOMINIO/api/integrations/google-drive/callback
```

Preencha `GOOGLE_OAUTH_CLIENT_ID` e `GOOGLE_OAUTH_CLIENT_SECRET` no arquivo `environment`. Cada servidor continuará autorizando sua própria conta institucional; os tokens seguem criptografados pela chave `JWT_SECRET`.

## Operação e atualizações

Para atualizar, faça backup dos volumes, obtenha a nova versão do código e execute `docker compose up -d --build` com as variáveis carregadas. Para acompanhar a inicialização, use `docker compose logs -f orbita`. Não publique o arquivo `environment`, o dump de banco ou os volumes em repositórios.
