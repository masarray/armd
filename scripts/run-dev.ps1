. "$PSScriptRoot\common.ps1"
Initialize-Dependencies

$vite = $null
try {
  Write-Host "Starting Vite on http://127.0.0.1:8080 ..." -ForegroundColor Cyan
  $vite = Start-Process -FilePath "cmd.exe" -ArgumentList "/d", "/c", "npm run dev" -WorkingDirectory $ProjectRoot -PassThru

  $ready = $false
  for ($i = 0; $i -lt 80; $i++) {
    Start-Sleep -Milliseconds 250
    if ($vite.HasExited) { throw "Vite exited before the development server became ready." }
    try {
      $client = [System.Net.Sockets.TcpClient]::new()
      $client.Connect("127.0.0.1", 8080)
      $client.Dispose()
      $ready = $true
      break
    } catch {}
  }
  if (-not $ready) { throw "Vite did not become ready on port 8080." }

  $env:ELECTRON_RENDERER_URL = "http://127.0.0.1:8080"
  Invoke-Npm "run desktop:dev"
} finally {
  Remove-Item Env:ELECTRON_RENDERER_URL -ErrorAction SilentlyContinue
  if ($vite -and -not $vite.HasExited) {
    & taskkill.exe /PID $vite.Id /T /F *> $null
  }
}
