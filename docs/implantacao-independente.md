# Implantação independente do Sistema ÓRBITA

Este procedimento instala a ÓRBITA em infraestrutura controlada pela Câmara, com autenticação local, banco MariaDB e arquivos persistidos em volume próprio. O conjunto não depende de serviços de autenticação, hospedagem, armazenamento ou métricas da plataforma de desenvolvimento.

## Arquitetura de referência

| Componente | Responsabilidade | Persistência |
|---|---|---|
| ÓRBITA | Interface web, API e regras do fluxo de contratações | Imagem Docker e volume de arquivos |
| MariaDB 11 | Dados institucionais, auditoria e vínculos documentais | Volume de banco |
| Proxy reverso institucional | HTTPS, domínio público e encaminhamento para a porta da aplicação | Configuração do servidor |
| Google Drive, opcional | Pastas e documentos autorizados individualmente por servidor | Conta Google de cada usuário |

## Requisitos

O servidor deve possuir Docker Engine e Docker Compose atuais, espaço para os volumes de banco e de documentos, além de DNS e certificado TLS. O endereço público precisa estar definido antes do primeiro uso do Google Drive, pois ele compõe a URL de retorno OAuth.

## Variáveis de ambiente

Copie `standalone/environment.template.txt` para um arquivo privado chamado `standalone/environment`. Não versionar esse arquivo. As chaves obrigatórias estão na tabela abaixo.

| Variável | Finalidade |
|---|---|
| `APP_PORT` | Porta exposta localmente pela aplicação, usualmente `8080`. |
| `APP_ORIGIN` | URL pública canônica com HTTPS, sem barra final. |
| `JWT_SECRET` | Chave de pelo menos 32 caracteres que assina sessões e protege os tokens do Drive. |
| `LOCAL_ADMIN_EMAIL` | E-mail do primeiro administrador local. |
| `LOCAL_ADMIN_NAME` | Nome institucional do primeiro administrador. |
| `LOCAL_ADMIN_PASSWORD` | Senha inicial do administrador; remover após o primeiro acesso. |
| `MYSQL_PASSWORD` | Senha exclusiva do usuário de aplicação no banco. |
| `MYSQL_ROOT_PASSWORD` | Senha administrativa exclusiva do MariaDB. |
| `GOOGLE_OAUTH_CLIENT_ID` e `GOOGLE_OAUTH_CLIENT_SECRET` | Necessárias somente para a integração individual com Drive. |

## Inicialização e migração de banco

No diretório `standalone`, carregue as variáveis e suba os serviços. O contêiner executará automaticamente `drizzle-kit migrate` antes de iniciar a aplicação.

```bash
set -a && . ./environment && set +a
docker compose up -d --build
docker compose logs -f orbita
```

Para trazer informações da instalação existente, exporte um dump da base de origem, restaure-o primeiro em um ambiente de homologação e valide os dados do fluxo, usuários, links do Drive e documentos. O banco atual deve ser preservado até a aprovação formal da migração. Faça também a cópia dos objetos de arquivo existentes para o volume correspondente, mantendo as chaves de armazenamento já registradas na base.

## Primeiro acesso e usuários mestres

Ao primeiro login com as credenciais definidas nas variáveis, o sistema cria o administrador local. As contas locais usam senha protegida por derivação `scrypt` e sessão assinada de 12 horas. Os e-mails `carlos@fozdoiguacu.pr.leg.br` e `debora@fozdoiguacu.pr.leg.br` recebem o perfil administrativo automaticamente quando suas contas locais forem provisionadas.

O arquivo com a senha de bootstrap deve ser removido ou ter esse valor inutilizado após o primeiro acesso. A criação dos demais usuários deve seguir o procedimento técnico aprovado pela Câmara, sempre registrando senha protegida e o papel institucional correspondente.

## Google Drive por autorização individual

No projeto Google Cloud institucional, crie uma credencial OAuth de aplicativo Web e inclua exatamente a URL abaixo como URI de redirecionamento autorizado:

```text
https://SEU_DOMINIO/api/integrations/google-drive/callback
```

Substitua `SEU_DOMINIO` pelo domínio de `APP_ORIGIN`, preencha as credenciais no arquivo privado e reinicie o serviço. Cada servidor autoriza a própria conta do Google; a autorização não usa conta de serviço nem Apps Script.

## Backup, atualização e recuperação

Mantenha backups testados do volume `orbita_db`, do volume `orbita_files` e do arquivo de configuração privado. Antes de toda atualização, valide a nova versão em homologação, execute backup e depois atualize com `docker compose up -d --build`. O proxy reverso e o banco devem receber as atualizações de segurança de acordo com a política de TI institucional.
