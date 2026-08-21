[CmdletBinding()]
param(
  [string]$ProjectDirectory = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path,
  [string]$BackupDirectory = "D:\Orbita-Backups",
  [ValidateRange(2, 52)]
  [int]$KeepWeeks = 8
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Require-Command([string]$Name) {
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "O comando '$Name' não foi encontrado. Instale e inicie o Docker Desktop antes de executar o backup."
  }
}

function Write-BackupLog([string]$Message) {
  $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  Write-Host "[$timestamp] $Message"
}

function Get-HashManifest([string]$Directory) {
  Get-ChildItem -LiteralPath $Directory -File -Recurse |
    ForEach-Object {
      [PSCustomObject]@{
        arquivo = $_.FullName.Substring($Directory.Length).TrimStart("\\")
        bytes = $_.Length
        sha256 = (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash
      }
    }
}

function Get-EnvironmentValue([string]$Path, [string]$Key) {
  $line = Get-Content -LiteralPath $Path | Where-Object { $_ -match "^$([regex]::Escape($Key))=" } | Select-Object -First 1
  if (-not $line) { return $null }
  return $line.Substring($Key.Length + 1).Trim().Trim('"').Trim("'")
}

$ProjectDirectory = (Resolve-Path -LiteralPath $ProjectDirectory).Path
$composeFile = Join-Path $ProjectDirectory "compose.yaml"
$environmentFile = Join-Path $ProjectDirectory "environment"
$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$startedAt = (Get-Date).ToUniversalTime()
$executionStatus = "failed"
$failureSummary = $null
$workingDirectory = $null
$finalDirectory = $null

if (-not (Test-Path -LiteralPath $composeFile -PathType Leaf)) { throw "compose.yaml não foi encontrado em '$ProjectDirectory'." }
if (-not (Test-Path -LiteralPath $environmentFile -PathType Leaf)) { throw "environment não foi encontrado em '$ProjectDirectory'." }

Require-Command docker

New-Item -ItemType Directory -Force -Path $BackupDirectory | Out-Null
$lockFile = Join-Path $BackupDirectory ".orbita-backup.lock"

try {
  $lock = [System.IO.File]::Open($lockFile, [System.IO.FileMode]::CreateNew, [System.IO.FileAccess]::Write, [System.IO.FileShare]::None)
} catch {
  throw "Já existe uma cópia em execução ou interrompida. Verifique '$lockFile' antes de iniciar outra."
}

try {
  $timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
  $workingDirectory = Join-Path $BackupDirectory ".orbita-$timestamp.partial"
  $finalDirectory = Join-Path $BackupDirectory "orbita-$timestamp"
  New-Item -ItemType Directory -Force -Path $workingDirectory | Out-Null

  Write-BackupLog "Verificando os serviços da ÓRBITA."
  $services = @(& docker compose --env-file $environmentFile -f $composeFile ps --status running --services)
  if ($LASTEXITCODE -ne 0 -or $services -notcontains "mariadb" -or $services -notcontains "orbita") {
    throw "A ÓRBITA e o MariaDB precisam estar em execução antes do backup. Execute 'docker compose --env-file environment up -d' na pasta standalone."
  }

  Write-BackupLog "Copiando os parâmetros e arquivos de implantação."
  Copy-Item -LiteralPath $environmentFile -Destination (Join-Path $workingDirectory "environment") -Force
  Copy-Item -LiteralPath $composeFile -Destination (Join-Path $workingDirectory "compose.yaml") -Force
  foreach ($fileName in @("Dockerfile", "entrypoint.sh")) {
    $source = Join-Path $ProjectDirectory $fileName
    if (Test-Path -LiteralPath $source -PathType Leaf) { Copy-Item -LiteralPath $source -Destination (Join-Path $workingDirectory $fileName) -Force }
  }
  Copy-Item -LiteralPath $scriptRoot -Destination (Join-Path $workingDirectory "windows") -Recurse -Force

  Write-BackupLog "Gerando cópia consistente do banco de dados."
  $databaseFile = Join-Path $workingDirectory "orbita.sql"
  $dump = @(& docker compose --env-file $environmentFile -f $composeFile exec -T mariadb sh -lc 'exec mariadb-dump --user=root --password="$MARIADB_ROOT_PASSWORD" --single-transaction --routines --events --databases orbita' 2>&1)
  if ($LASTEXITCODE -ne 0) { throw "Não foi possível exportar o banco de dados: $($dump -join [Environment]::NewLine)" }
  [System.IO.File]::WriteAllLines($databaseFile, [string[]]$dump, [System.Text.UTF8Encoding]::new($false))
  if ((Get-Item -LiteralPath $databaseFile).Length -lt 128) { throw "A exportação do banco parece vazia; o backup foi interrompido por segurança." }

  Write-BackupLog "Copiando os arquivos institucionais do volume local."
  $containerId = (& docker compose --env-file $environmentFile -f $composeFile ps -q orbita).Trim()
  if (-not $containerId) { throw "Não foi possível localizar o contêiner da ÓRBITA para copiar os arquivos." }
  & docker cp "${containerId}:/var/lib/orbita/files" $workingDirectory
  if ($LASTEXITCODE -ne 0) { throw "Não foi possível copiar os arquivos locais da ÓRBITA." }
  $filesDirectory = Join-Path $workingDirectory "files"
  if (-not (Test-Path -LiteralPath $filesDirectory -PathType Container)) { throw "A cópia dos arquivos locais não foi encontrada." }
  $filesArchive = Join-Path $workingDirectory "arquivos-institucionais.zip"
  Compress-Archive -LiteralPath $filesDirectory -DestinationPath $filesArchive -CompressionLevel Optimal
  Remove-Item -LiteralPath $filesDirectory -Recurse -Force

  $manifest = [PSCustomObject]@{
    sistema = "ÓRBITA"
    criadoEm = (Get-Date).ToUniversalTime().ToString("o")
    computador = $env:COMPUTERNAME
    projeto = $ProjectDirectory
    retencaoSemanas = $KeepWeeks
    arquivos = @(Get-HashManifest $workingDirectory)
  }
  $manifest | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $workingDirectory "manifesto.json") -Encoding UTF8

  Rename-Item -LiteralPath $workingDirectory -NewName (Split-Path -Leaf $finalDirectory)
  $executionStatus = "success"
  Write-BackupLog "Backup concluído em '$finalDirectory'."

  $oldBackups = Get-ChildItem -LiteralPath $BackupDirectory -Directory -Filter "orbita-*" | Sort-Object CreationTime -Descending | Select-Object -Skip $KeepWeeks
  foreach ($oldBackup in $oldBackups) {
    Write-BackupLog "Removendo backup antigo: $($oldBackup.Name)."
    Remove-Item -LiteralPath $oldBackup.FullName -Recurse -Force
  }
} catch {
  $failureSummary = $_.Exception.Message
  Write-BackupLog "Backup interrompido: $failureSummary"
  throw
} finally {
  $reportToken = Get-EnvironmentValue $environmentFile "BACKUP_REPORT_TOKEN"
  $appOrigin = Get-EnvironmentValue $environmentFile "APP_ORIGIN"
  if ($reportToken -and $appOrigin) {
    $recordedDirectory = if ($executionStatus -eq "success") { $finalDirectory } else { $workingDirectory }
    $backupSizeBytes = if ($recordedDirectory -and (Test-Path -LiteralPath $recordedDirectory)) { [int64](Get-ChildItem -LiteralPath $recordedDirectory -File -Recurse | Measure-Object -Property Length -Sum).Sum } else { 0 }
    $report = @{ status = $executionStatus; startedAt = $startedAt.ToString("o"); completedAt = (Get-Date).ToUniversalTime().ToString("o"); backupDirectory = $recordedDirectory; backupSizeBytes = $backupSizeBytes; errorSummary = $failureSummary } | ConvertTo-Json -Compress
    try { Invoke-RestMethod -Method Post -Uri ($appOrigin.TrimEnd("/") + "/api/selfhost/backups/report") -Headers @{ Authorization = "Bearer $reportToken" } -ContentType "application/json" -Body $report | Out-Null } catch { Write-BackupLog "Não foi possível registrar o resultado no painel: $($_.Exception.Message)" }
  } else { Write-BackupLog "Relatório ao painel não configurado: defina BACKUP_REPORT_TOKEN e APP_ORIGIN no arquivo environment." }
  if ($lock) { $lock.Dispose() }
  if (Test-Path -LiteralPath $lockFile) { Remove-Item -LiteralPath $lockFile -Force }
}
