$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$frontend = Join-Path $root "frontend"

Set-Location $frontend

if (-not (Test-Path "node_modules")) {
  Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
  npm install
}

npm run dev -- --host 127.0.0.1 --port 5173
