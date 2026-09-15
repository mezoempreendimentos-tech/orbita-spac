# keep-tunnel.ps1 - watchdog do ngrok para sobreviver a morte do bash tool
#
# Roda em loop infinito, checa o endpoint admin do ngrok a cada 30s.
# Se nao ha tunel ativo, mata qualquer ngrok orfao e sobe um novo.
#
# Lancamento:
#   Start-Process powershell -ArgumentList '-NoProfile','-ExecutionPolicy','Bypass','-File',"<abs>\scripts\keep-tunnel.ps1" -WindowStyle Hidden
#
# Logs: standalone\tunnel-watchdog.log (rotacionado a cada religada)
# Para parar: taskkill /IM powershell.exe /FI "WINDOWTITLE eq *keep-tunnel*"
#            ou simplesmente: Get-Process powershell | Where-Object {$_.Path -like '*keep-tunnel*'} | Stop-Process

$ErrorActionPreference = 'Stop'

$ngrok     = 'C:\Tools\ngrok\ngrok.exe'
$domain    = 'blurred-scant-cried.ngrok-free.dev'
$localPort = 3000
$apiUrl    = 'http://127.0.0.1:4040/api/tunnels'
$logDir    = 'C:\Users\mezoe\Orbita - MINIMAX\standalone'
$logFile   = Join-Path $logDir 'tunnel-watchdog.log'
$interval  = 30  # segundos entre checagens

function Write-Log([string]$msg) {
  $stamp = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss')
  Add-Content -Path $logFile -Value "[$stamp] $msg"
}

Write-Log "watchdog iniciado (intervalo=${interval}s, dominio=$domain)"

while ($true) {
  try {
    $r = Invoke-WebRequest -Uri $apiUrl -UseBasicParsing -TimeoutSec 4
    $j = $r.Content | ConvertFrom-Json
    $active = $j.tunnels -and $j.tunnels.Count -gt 0 -and $j.tunnels[0].public_url -like "*$domain*"
  } catch {
    $active = $false
  }

  if (-not $active) {
    Write-Log "tunnel_down — religando $domain -> $localPort"
    Get-Process -Name ngrok -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    Start-Process -FilePath $ngrok -ArgumentList @('http','--domain',$domain,"$localPort",'--log=stdout') `
      -RedirectStandardOutput (Join-Path $logDir 'ngrok.out.log') `
      -RedirectStandardError  (Join-Path $logDir 'ngrok.err.log') `
      -NoNewWindow
    # espera o endpoint admin voltar
    $ready = $false
    for ($i=0; $i -lt 20; $i++) {
      Start-Sleep -Seconds 1
      try {
        $r = Invoke-WebRequest -Uri $apiUrl -UseBasicParsing -TimeoutSec 2
        $j = $r.Content | ConvertFrom-Json
        if ($j.tunnels -and $j.tunnels.Count -gt 0) {
          Write-Log "tunnel_up — $($j.tunnels[0].public_url)"
          $ready = $true
          break
        }
      } catch { }
    }
    if (-not $ready) { Write-Log "tunnel nao respondeu em 20s; seguind with next check" }
  }

  Start-Sleep -Seconds $interval
}
