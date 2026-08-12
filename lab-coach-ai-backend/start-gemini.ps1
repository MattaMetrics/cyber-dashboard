# Gemini biometrics engine (port 8000). Run from repo root or this folder.
Set-Location $PSScriptRoot

if (-not (Test-Path ".env")) {
    Write-Host "Missing .env — copy .env.example to .env and set GEMINI_API_KEY." -ForegroundColor Yellow
    exit 1
}

Get-Content ".env" | ForEach-Object {
    if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
        $name = $matches[1].Trim()
        $value = $matches[2].Trim().Trim('"')
        Set-Item -Path "Env:$name" -Value $value
    }
}

Write-Host "Starting Gemini lab engine on http://127.0.0.1:8000 ..." -ForegroundColor Cyan
uvicorn main:app --reload --port 8000
