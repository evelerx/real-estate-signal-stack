$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$backend = Join-Path $root "backend"
$venvPython = Join-Path $backend "venv\\Scripts\\python.exe"
$venvPip = Join-Path $backend "venv\\Scripts\\pip.exe"
$requirements = Join-Path $backend "requirements.txt"

if (-not (Test-Path $venvPython)) {
  Write-Host "Creating backend venv..." -ForegroundColor Yellow
  Set-Location $backend
  python -m venv venv
}

if (-not (Test-Path $venvPip)) {
  Write-Host "pip not found inside venv." -ForegroundColor Red
  exit 1
}

Set-Location $backend
if (Test-Path $requirements) {
  Write-Host "Installing backend dependencies from requirements.txt..." -ForegroundColor Yellow
  & $venvPip install -r $requirements
} else {
  Write-Host "Installing backend dependencies (default set)..." -ForegroundColor Yellow
  & $venvPip install fastapi uvicorn "python-jose[cryptography]" sqlalchemy pydantic
}

& $venvPython -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
