[CmdletBinding()]
param(
  [string]$ProjectDirectory = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path,
  [string]$BackupDirectory = "D:\Orbita-Backups",
  [ValidateSet("MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN")]
  [string]$DayOfWeek = "SUN",
  [ValidatePattern("^([01][0-9]|2[0-3]):[0-5][0-9]$")]
  [string]$StartTime = "03:00",
  [ValidateRange(2, 52)]
  [int]$KeepWeeks = 8
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$backupScript = Join-Path $PSScriptRoot "backup-orbita.ps1"
if (-not (Test-Path -LiteralPath $backupScript -PathType Leaf)) { throw "backup-orbita.ps1 não foi encontrado." }
if (-not (Test-Path -LiteralPath (Join-Path $ProjectDirectory "compose.yaml") -PathType Leaf)) { throw "compose.yaml não foi encontrado em '$ProjectDirectory'." }

New-Item -ItemType Directory -Force -Path $BackupDirectory | Out-Null
$taskName = "ÓRBITA - backup semanal local"
$command = "powershell.exe -NoProfile -ExecutionPolicy Bypass -File `"$backupScript`" -ProjectDirectory `"$ProjectDirectory`" -BackupDirectory `"$BackupDirectory`" -KeepWeeks $KeepWeeks"

& schtasks.exe /Create /TN $taskName /TR $command /SC WEEKLY /D $DayOfWeek /ST $StartTime /IT /RL LIMITED /F
if ($LASTEXITCODE -ne 0) { throw "O Agendador de Tarefas não aceitou a rotina semanal." }

Write-Host "Rotina '$taskName' criada para $DayOfWeek às $StartTime."
Write-Host "Ela será executada quando o usuário do Docker Desktop estiver conectado ao Windows."
Write-Host "Para executar uma cópia de teste agora: schtasks.exe /Run /TN `"$taskName`""
