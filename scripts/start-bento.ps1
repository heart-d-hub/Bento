param(
  [string]$AppPath = "",
  [switch]$OpenPgAdmin
)

$ErrorActionPreference = "Stop"

function Write-Step([string]$msg) {
  Write-Host "[BENTO] $msg" -ForegroundColor Cyan
}

function Ensure-PostgresRunning {
  $knownNames = @("postgresql-x64-17", "postgresql-x64-16", "postgresql-x64-15", "postgresql")
  $services = @()

  foreach ($name in $knownNames) {
    $svc = Get-Service -Name $name -ErrorAction SilentlyContinue
    if ($svc) { $services += $svc }
  }

  if ($services.Count -eq 0) {
    $services = Get-Service -ErrorAction SilentlyContinue |
      Where-Object { $_.Name -match '^postgres' -or $_.DisplayName -match 'PostgreSQL' }
  }

  if ($services.Count -eq 0) {
    Write-Warning "PostgreSQL service was not found. Start it manually if needed."
    return $false
  }

  $svc = $services | Select-Object -First 1
  if ($svc.Status -ne "Running") {
    Write-Step "Starting PostgreSQL service: $($svc.Name)"
    Start-Service -Name $svc.Name
    $svc.WaitForStatus("Running", (New-TimeSpan -Seconds 15))
  } else {
    Write-Step "PostgreSQL service already running: $($svc.Name)"
  }

  if ($services.Count -gt 1) {
    Write-Step "Detected PostgreSQL services: $((($services | Select-Object -ExpandProperty Name) -join ', '))"
  }

  return $true
}

function Resolve-AppPath([string]$explicitPath) {
  if ($explicitPath -and (Test-Path $explicitPath)) { return (Resolve-Path $explicitPath).Path }

  $candidates = @(
    "D:\Bento\Bento\src-tauri\target\release\app.exe",
    "D:\Bento\Bento\dist\app.exe"
  )
  foreach ($path in $candidates) {
    if (Test-Path $path) { return (Resolve-Path $path).Path }
  }
  return $null
}

function Open-OptionalPgAdmin {
  if (-not $OpenPgAdmin) { return }
  $pgAdminExe = "${env:ProgramFiles}\pgAdmin 4\runtime\pgAdmin4.exe"
  if (Test-Path $pgAdminExe) {
    Write-Step "Opening pgAdmin4"
    Start-Process -FilePath $pgAdminExe
  } else {
    Write-Warning "pgAdmin4 not found at default path."
  }
}

Write-Step "Preparing Bento startup"
Ensure-PostgresRunning | Out-Null
Open-OptionalPgAdmin
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path

$resolvedApp = Resolve-AppPath -explicitPath $AppPath
if (-not $resolvedApp) {
  throw "Cannot find standalone Bento executable. Build release first (`npm run tauri:build`) or pass -AppPath `"C:\path\to\app.exe`"."
}

Write-Step "Launching Bento app: $resolvedApp"
Start-Process -FilePath $resolvedApp -WorkingDirectory $projectRoot
Write-Step "Done. You can use Bento without Cursor."
