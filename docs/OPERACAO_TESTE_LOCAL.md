# ÓRBITA — ambiente de teste e túnel

## Estado em 11/09/2026

- Aplicação: http://localhost:8080
- Acesso externo: https://blurred-scant-cried.ngrok-free.dev
- Containers existentes: `standalone-orbita-1` e `orbita-mariadb-local`.
- Banco conectado à rede `standalone_default` com alias `mariadb`.
- Build atualizado em `/app/dist` do container existente. Recriar o container a partir da imagem antiga perde essa atualização; antes de recriar, gerar imagem a partir deste checkout.
- Mezo: conta administrativa existente preservada; Débora: acesso administrativo completo; requisitante@gmail.com: usuário com perfil demandante na unidade CMFI. Senhas de teste definidas conforme solicitação do mantenedor, armazenadas com hash; não registradas neste documento.

## Iniciar

1. Abrir Docker Desktop e aguardar o motor responder.
2. Executar `docker start orbita-mariadb-local standalone-orbita-1`.
3. Conferir `Invoke-RestMethod http://localhost:8080/api/health`.
4. Se não houver ngrok ativo, executar:

```powershell
& 'C:\Tools\ngrok\ngrok.exe' http http://127.0.0.1:8080 --domain=blurred-scant-cried.ngrok-free.dev
```

Nesta sessão, ngrok foi iniciado em processo separado e oculto. Logs em `standalone/tunnel-watchdog.log.stdout` e `.stderr` (ignorados pelo Git). Não foi instalado serviço nem reinício automático do túnel após reiniciar o Windows.

## Diagnóstico

- `docker ps`: estado dos containers.
- `docker logs standalone-orbita-1 --tail 30`: inicialização da aplicação.
- `Invoke-RestMethod http://127.0.0.1:4040/api/tunnels`: destino e URL do túnel.
- Health deve apresentar `status: ok` e `db: ok`.
- Erro `ENOTFOUND mariadb`: conferir se o banco está na mesma rede da aplicação e tem o alias `mariadb`.

## Recuperação realizada

O log do Docker Desktop 4.53.0 mostrou falhas de remoção de sockets AF_UNIX em `Docker/run/dockerInference` e `docker-secrets-engine/engine.sock`. O WSL respondia, suas distribuições estavam paradas e havia espaço livre em disco. As duas pastas de sockets foram preservadas com sufixo `recovery-<data-hora>`, com os processos Docker encerrados, e o Desktop foi iniciado novamente. A recuperação conjunta permitiu a inicialização. Não houve restauração de fábrica, exclusão de volumes ou recriação do banco.

Um relato equivalente está em https://github.com/docker/desktop-feedback/issues/460. Reinícios após encerramento inesperado podem repetir a falha; não usar restauração de fábrica como primeira medida.

## Validação e limites

- Health pelo túnel: HTTP 200, banco saudável.
- Ambas as contas: login HTTP 200, sessão confirmada por `auth.me` e consulta a `workspace.status` pelo endereço HTTPS.
- Dez testes de autenticação, autorização, logout e download passaram.
- Na revisão de contas: oito testes de filtros, políticas de contas e autorização passaram, além de TypeScript e build Vite. Débora acessou a API administrativa (200); requisitante autenticou e recebeu 403 nessa API, como esperado para seu perfil.
- Lista de contas conferida no navegador em desktop e 360 px: colunas alinhadas, filtro por e-mail funcional e sem transbordamento horizontal. Build atualizado confirmado pelo túnel (HTTP 200).
- Download anônimo em `/files/*`: HTTP 401. A rota agora exige sessão; a política granular por documento permanece pendente e não é certificada por esta validação.
- Bloqueados usuário inativo na autenticação da sessão e troca do próprio e-mail para endereço mestre reservado. Revogação geral após redefinição de senha ainda pendente.
- Computador hospedeiro, Docker e ngrok precisam permanecer ligados. Não foi testado a partir de um segundo computador físico; o domínio externo foi testado por HTTPS a partir do hospedeiro.
- Dados e fluxos reais não foram alterados durante os testes, além da configuração das contas solicitadas.
