. "$PSScriptRoot\common.ps1"
Initialize-Dependencies

Invoke-Npm "run clean"
Invoke-Npm "run check"
Invoke-Npm "run desktop:pack"

$exe = Join-Path $ProjectRoot "release\win-unpacked\Inkwell.exe"
if (-not (Test-Path $exe)) { throw "Built application was not found: $exe" }
Write-Host "Launching production build..." -ForegroundColor Green
Start-Process -FilePath $exe -WorkingDirectory (Split-Path $exe)
