# Primeira instalação local da ÓRBITA — sem servidor contratado

Este guia permite iniciar a ÓRBITA em **um computador da Câmara**, inicialmente sem contratar servidor ou hospedagem. A instalação fica disponível somente enquanto esse computador estiver ligado e conectado à rede. Para a etapa inicial, recomenda-se que o acesso ocorra no próprio computador pela URL `http://localhost:8080`; assim, não é necessário abrir o sistema para a internet.

> Esta é uma configuração de implantação inicial, adequada para teste assistido e uso interno reduzido. O computador deve permanecer sob guarda da Câmara e ter backup regular. Antes de ampliar o acesso para outros computadores ou para a internet, a TI deve configurar HTTPS, controles de rede e rotina de cópias de segurança.

## O que será instalado

| Item | Função | Custo inicial |
|---|---|---|
| Docker Desktop | Executa a ÓRBITA e o banco sem instalar manualmente cada componente | Sem contratação de servidor |
| ÓRBITA | Sistema web, API e regras institucionais | Código já preparado |
| MariaDB | Banco local de processos, usuários e auditoria | Incluído na composição local |
| Volumes Docker | Mantêm os arquivos e o banco mesmo ao reiniciar os contêineres | Usa o disco do computador |

O Docker Desktop reúne Docker Engine, linha de comando e Docker Compose em um ambiente instalado localmente; o Compose é a ferramenta que inicia os serviços definidos no arquivo de composição. [1] [2]

## Antes de começar

Escolha um computador que permaneça ligado durante o expediente, tenha espaço livre para os documentos e seja acessível somente a pessoas autorizadas. Para a primeira etapa, **não compartilhe senhas por e-mail** e não publique a pasta da instalação em serviços de nuvem pessoal.

Instale o **Docker Desktop** compatível com Windows, macOS ou Linux e abra o programa uma vez após a instalação. A documentação oficial recomenda Docker Desktop como a forma mais simples de obter o Docker Compose. [1]

## Passo 1 — obter a pasta do sistema

Copie o código-fonte completo da ÓRBITA para uma pasta local, por exemplo `C:\Orbita` no Windows ou `~/orbita` no Linux/macOS. Dentro dela deve existir a pasta `standalone`, contendo `compose.yaml`, `Dockerfile` e `environment.template.txt`.

Abra um terminal nessa pasta `standalone`. No Windows, use o **PowerShell**; no Linux, use o terminal padrão.

## Passo 2 — preparar as senhas e parâmetros

Duplique o arquivo `environment.template.txt` e renomeie a cópia para `environment`, sem extensão. Edite a cópia com um editor de texto simples. Para a primeira execução no mesmo computador, mantenha:

```text
APP_PORT=8080
APP_ORIGIN=http://localhost:8080
```

Troque obrigatoriamente `JWT_SECRET`, `LOCAL_ADMIN_EMAIL`, `LOCAL_ADMIN_PASSWORD`, `MYSQL_PASSWORD` e `MYSQL_ROOT_PASSWORD`. Use senhas diferentes para o administrador e para o banco. A chave `JWT_SECRET` deve ter mais de 32 caracteres. O arquivo `environment` contém segredos e **não deve ser enviado por WhatsApp, e-mail ou incluído em repositórios**.

| Campo | Preenchimento inicial |
|---|---|
| `LOCAL_ADMIN_EMAIL` | E-mail institucional do primeiro administrador local |
| `LOCAL_ADMIN_NAME` | Nome que aparecerá no sistema |
| `LOCAL_ADMIN_PASSWORD` | Senha inicial forte; altere depois do primeiro acesso |
| `APP_ORIGIN` | `http://localhost:8080` para uso apenas naquele computador |

## Passo 3 — iniciar o sistema

No terminal aberto na pasta `standalone`, execute o comando abaixo. Na primeira vez pode levar alguns minutos, porque as imagens são criadas localmente.

```bash
docker compose --env-file environment up -d --build
```

Para acompanhar a inicialização, execute:

```bash
docker compose --env-file environment logs -f orbita
```

Quando aparecer a indicação de que o servidor está em execução, abra `http://localhost:8080` no navegador. O contêiner aplica automaticamente as migrações do banco antes de iniciar a aplicação.

## Passo 4 — primeiro acesso e usuários

Na tela **Entrar na área de trabalho**, informe `LOCAL_ADMIN_EMAIL` e `LOCAL_ADMIN_PASSWORD`. Depois de entrar, acesse **Contas locais** no menu de Governança para criar outros acessos, alterar nome, perfil e situação da conta.

Se um usuário esquecer a senha, ele usa a opção **Esqueci minha senha** na tela de login. A solicitação aparece em **Contas locais** para um administrador definir uma nova senha. Nesta versão inicial, esse fluxo não envia e-mail e não depende de serviço pago.

> Após confirmar o primeiro acesso, remova a senha de bootstrap do arquivo `environment` ou troque-a por um valor indisponível. As senhas de contas criadas no sistema permanecem protegidas por hash e não são exibidas na tela administrativa.

## Google Drive: configurar apenas quando necessário

É possível começar sem Google Drive. Nesse caso, mantenha `GOOGLE_OAUTH_CLIENT_ID` e `GOOGLE_OAUTH_CLIENT_SECRET` vazios; o painel **Configurações** mostrará que a integração ainda não está configurada.

Quando decidir ativá-lo, no Google Cloud Console crie uma credencial OAuth do tipo **Aplicativo da Web**, habilite as APIs Drive e Docs e cadastre este retorno para a instalação local:

```text
http://localhost:8080/api/integrations/google-drive/callback
```

O Google aceita URLs de máquina local para teste, mas a URI de retorno configurada precisa coincidir exatamente com a URI usada pela aplicação, inclusive protocolo, porta e barra final. [3] Preencha as duas credenciais no arquivo `environment`, reinicie a aplicação e conecte cada conta individual em **Configurações**.

## Operação diária, parada e backup

Para abrir o sistema nos dias seguintes, ligue o computador, abra Docker Desktop e execute `docker compose --env-file environment up -d` na pasta `standalone`. Para parar o sistema ao final de uma manutenção, use:

```bash
docker compose --env-file environment down
```

O comando `down` não deve apagar volumes. **Não use** o comando com `-v`, pois isso elimina os volumes locais. Para atualização futura, faça backup, substitua o código e rode novamente `docker compose --env-file environment up -d --build`.

O backup inicial deve incluir os volumes `orbita-visual-docs_orbita_db` e `orbita-visual-docs_orbita_files` (os nomes podem variar conforme a pasta do projeto) e o arquivo privado `environment`. A TI deve testar a restauração de uma cópia antes de depender desse ambiente para atividades críticas.

## Limites desta etapa inicial

| Situação | Comportamento nesta versão |
|---|---|
| Computador desligado | A ÓRBITA fica indisponível até ser ligado novamente |
| Acesso de outro computador | Não é recomendado sem configuração de rede e HTTPS pela TI |
| Recuperação de senha | Administrador redefine manualmente, sem serviço de e-mail |
| Google Drive | Opcional; requer OAuth individual e navegador no computador de instalação |
| Backup | Responsabilidade da Câmara no disco ou mídia institucional |

Quando a utilização crescer, a próxima evolução indicada é migrar os mesmos contêineres e volumes para um servidor institucional ou serviço contratado, mantendo as configurações e o banco já utilizados.

## Referências

[1] [Docker Docs — instalar Docker Compose](https://docs.docker.com/compose/install/)

[2] [Docker Docs — Docker Desktop](https://docs.docker.com/desktop/)

[3] [Google Developers — OAuth 2.0 para aplicativos de servidor Web](https://developers.google.com/identity/protocols/oauth2/web-server)
