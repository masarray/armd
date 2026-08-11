. "$PSScriptRoot\common.ps1"
Initialize-Dependencies

Invoke-Npm "run clean"
Invoke-Npm "run check"
Invoke-Npm "run desktop:dist"

$artifacts = Get-ChildItem "$ProjectRoot\release\Inkwell-*.exe" -ErrorAction SilentlyContinue | Sort-Object Name
if (-not $artifacts) { throw "No release EXE artifacts were produced." }

$checksumPath = Join-Path $ProjectRoot "release\SHA256SUMS.txt"
$checksumLines = $artifacts | ForEach-Object {
  $hash = (Get-FileHash -Algorithm SHA256 $_.FullName).Hash.ToLowerInvariant()
  "$hash  $($_.Name)"
}
$checksumLines | Set-Content -Encoding ascii $checksumPath

Write-Host "`nRelease files:" -ForegroundColor Green
$artifacts | ForEach-Object {
  Write-Host ("  {0}  ({1:N1} MB)" -f $_.FullName, ($_.Length / 1MB))
}
Write-Host "  $checksumPath"
Start-Process explorer.exe -ArgumentList (Join-Path $ProjectRoot "release")
