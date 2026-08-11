Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$script:ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $script:ProjectRoot

function Assert-Command([string]$Name, [string]$InstallHint) {
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "$Name was not found. $InstallHint"
  }
}

function Initialize-Dependencies {
  Assert-Command "node" "Install Node.js 22 LTS or newer, then run this file again."
  Assert-Command "npm" "Install Node.js with npm, then run this file again."

  $nodeVersionText = (& node -p "process.versions.node").Trim()
  $nodeVersion = [version]$nodeVersionText
  if ($nodeVersion -lt [version]"22.12.0") {
    throw "Node.js 22.12.0 or newer is required. Installed: $nodeVersion"
  }

  Write-Host "Checking dependencies..." -ForegroundColor Cyan
  & npm.cmd install --no-audit --no-fund
  if ($LASTEXITCODE -ne 0) { throw "npm install failed." }
}

function Invoke-Npm([string]$Arguments) {
  Write-Host "> npm $Arguments" -ForegroundColor DarkCyan
  $parts = $Arguments -split " "
  & npm.cmd @parts
  if ($LASTEXITCODE -ne 0) { throw "npm $Arguments failed with exit code $LASTEXITCODE." }
}
