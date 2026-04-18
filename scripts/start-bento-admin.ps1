param(
  [string]$AppPath = "",
  [switch]$OpenPgAdmin = $true,
  [switch]$OpenPrismaStudio = $true
)

$ErrorActionPreference = "Stop"

Write-Host "[BENTO] Starting admin tools..." -ForegroundColor Yellow

$baseScript = Join-Path $PSScriptRoot "start-bento.ps1"
if (-not (Test-Path $baseScript)) {
  throw "Missing script: $baseScript"
}

& $baseScript -AppPath $AppPath -OpenPgAdmin:$OpenPgAdmin

if ($OpenPrismaStudio) {
  Write-Host "[BENTO] Opening Prisma Studio..." -ForegroundColor Yellow
  Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\..'; npx prisma studio"
}

Write-Host "[BENTO] Admin startup complete." -ForegroundColor Yellow
