# Backup semanal local no Windows

Os dois scripts desta pasta fazem uma cópia local da instalação independente da ÓRBITA. A cópia inclui a exportação SQL do MariaDB, os arquivos institucionais, o arquivo privado `environment`, os arquivos de implantação e um manifesto com hashes SHA-256.

> A cópia contém senhas e dados institucionais. Escolha uma unidade criptografada e restrita à equipe autorizada. Para proteger contra falha física do computador, prefira uma unidade externa institucional ou um compartilhamento de rede controlado, não a mesma unidade em que a ÓRBITA está instalada.

## Criar a rotina semanal

Abra **PowerShell** como o mesmo usuário que utiliza o Docker Desktop. Vá até a pasta `standalone\windows` e execute, ajustando os caminhos se necessário:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\install-weekly-backup.ps1 -ProjectDirectory "C:\Orbita\standalone" -BackupDirectory "D:\Backups-Orbita" -DayOfWeek SUN -StartTime "03:00" -KeepWeeks 8
```

Antes de criar a rotina, preencha `BACKUP_REPORT_TOKEN` no arquivo `standalone\environment` com uma senha longa e exclusiva. O mesmo arquivo deve manter `APP_ORIGIN=http://localhost:8080` para a instalação que roda no próprio computador. Esse segredo autoriza apenas o script local a registrar o resultado da cópia no painel; não o compartilhe.

O Windows inclui o Agendador de Tarefas, capaz de executar programas em horários definidos. O comando `schtasks` permite criar uma tarefa semanal, indicando dia, horário e programa a executar. [1] [2]

A rotina inicial usa a conta do usuário que criou a tarefa e executa somente quando esse usuário estiver conectado ao Windows. Isso é intencional: o Docker Desktop local normalmente pertence a esse usuário, e a instalação inicial não precisa armazenar outra senha no Agendador.

| Parâmetro | Valor inicial | Finalidade |
|---|---:|---|
| `BackupDirectory` | `D:\Backups-Orbita` | Destino das cópias semanais |
| `DayOfWeek` | `SUN` | Domingo; aceite `MON` a `SUN` |
| `StartTime` | `03:00` | Horário de pouca utilização, em formato 24 horas |
| `KeepWeeks` | `8` | Mantém as oito cópias mais recentes |

## Fazer a primeira cópia de teste

Antes de aguardar a execução semanal, confirme uma cópia manual:

```powershell
.\backup-orbita.ps1 -ProjectDirectory "C:\Orbita\standalone" -BackupDirectory "D:\Backups-Orbita" -KeepWeeks 8
```

O backup conclui somente se os serviços `orbita` e `mariadb` estiverem em execução. Ao final, a pasta do backup terá o formato `orbita-AAAA-MM-DD_HH-mm-ss` e conterá `orbita.sql`, `arquivos-institucionais.zip`, `environment` e `manifesto.json`. Não apague a pasta `.partial` enquanto o script estiver sendo executado.

Para confirmar a tarefa criada, use:

```powershell
schtasks.exe /Query /TN "ÓRBITA - backup semanal local" /V /FO LIST
```

Após a primeira cópia, entre na ÓRBITA e abra **Configurações**. A seção **Backup local** exibirá o resultado e o histórico recente; a página principal exibirá um alerta se não houver cópia, se a última falhar ou se ultrapassar o prazo de oito dias.

## Restauração de teste

A restauração deve ser treinada em **outro computador ou em uma cópia isolada**, nunca diretamente sobre a instalação em uso. Pare a instalação de teste, restaure primeiro os arquivos e parâmetros e depois o banco:

```powershell
docker compose --env-file environment down
docker compose --env-file environment up -d mariadb
Get-Content "D:\Backups-Orbita\orbita-AAAA-MM-DD_HH-mm-ss\orbita.sql" | docker compose --env-file environment exec -T mariadb mariadb --user=root --password
docker compose --env-file environment up -d
```

Após restaurar, compare os arquivos listados no `manifesto.json` com `Get-FileHash` e valide uma DFD, um documento e uma conta local antes de usar a cópia. Não restaure um backup sobre a instalação ativa sem uma decisão administrativa e uma cópia de segurança atual.

## Referências

[1] [Microsoft Learn — Sobre o Agendador de Tarefas](https://learn.microsoft.com/en-us/windows/win32/taskschd/about-the-task-scheduler)

[2] [Microsoft Learn — schtasks create](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/schtasks-create)
