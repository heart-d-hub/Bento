param(
  [string]$AppPath = "",
  [switch]$OpenPgAdmin
)

$ErrorActionPreference = "Stop"

function Write-Step([string]$msg) {
  Write-Host "[BENTO] $msg" -ForegroundColor Cyan
}

function Ensure-PostgresRunning {
  $serviceNames = @("postgresql-x64-17", "postgresql-x64-16", "postgresql-x64-15", "postgresql")
  foreach ($name in $serviceNames) {
    $svc = Get-Service -Name $name -ErrorAction SilentlyContinue
    if (-not $svc) { continue }
    if ($svc.Status -ne "Running") {
      Write-Step "Starting PostgreSQL service: $name"
      Start-Service -Name $name
      $svc.WaitForStatus("Running", (New-TimeSpan -Seconds 15))
    } else {
      Write-Step "PostgreSQL service already running: $name"
    }
    return $true
  }
  Write-Warning "PostgreSQL service was not found. Start it manually if needed."
  return $false
}

function Resolve-AppPath([string]$explicitPath) {
  if ($explicitPath -and (Test-Path $explicitPath)) { return (Resolve-Path $explicitPath).Path }

  $candidates = @(
    "D:\Bento\Bento\src-tauri\target\release\app.exe",
    "D:\Bento\Bento\src-tauri\target\debug\app.exe",
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

$resolvedApp = Resolve-AppPath -explicitPath $AppPath
if (-not $resolvedApp) {
  throw "Cannot find Bento executable. Pass -AppPath `"C:\path\to\app.exe`""
}

Write-Step "Launching Bento app: $resolvedApp"
Start-Process -FilePath $resolvedApp
Write-Step "Done. You can use Bento without Cursor."
