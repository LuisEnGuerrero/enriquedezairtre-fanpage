# cleanup-nextauth-safe.ps1
# ------------------------------------------------------------
# Limpieza segura de NextAuth -> migración a lib/auth.ts
# No usa regex frágiles. Line-based. PowerShell-safe.
# ------------------------------------------------------------

$ErrorActionPreference = "Stop"

Write-Host "Starting safe NextAuth cleanup..." -ForegroundColor Cyan

# ---------- Helpers ----------

function Save-IfChanged {
  param($Path, $NewContent)

  $OldContent = Get-Content -LiteralPath $Path -Raw
  if ($OldContent -ne $NewContent) {
    Set-Content -LiteralPath $Path -Value $NewContent -Encoding UTF8
    return $true
  }
  return $false
}

function Ensure-Import {
  param($Content, $ImportLine)

  if ($Content -notmatch [regex]::Escape($ImportLine)) {
    return "$ImportLine`n$Content"
  }
  return $Content
}

# ---------- 1) API routes ----------

$apiFiles = Get-ChildItem -Path "src/app/api" -Recurse -Filter "route.ts" -File
$modified = @()

foreach ($file in $apiFiles) {
  $path = $file.FullName
  $lines = Get-Content -LiteralPath $path

  $usesNextAuth = $false
  foreach ($l in $lines) {
    if ($l -match "next-auth" -or $l -match "authOptions") {
      $usesNextAuth = $true
      break
    }
  }

  if (-not $usesNextAuth) { continue }

  Write-Host "Cleaning $path" -ForegroundColor Yellow

  $newLines = @()

  foreach ($line in $lines) {

    # ❌ Quitar imports NextAuth
    if ($line -match "getServerSession" -and $line -match "next-auth") { continue }
    if ($line -match "authOptions" -and $line -match "nextauth") { continue }

    # ❌ Quitar llamadas a getServerSession(...)
    if ($line -match "getServerSession") { continue }

    # ❌ Quitar guards basados en session
    if ($line -match "session\.user" -or $line -match "Unauthorized") { continue }

    $newLines += $line
  }

  $content = ($newLines -join "`n")

  # ¿Ruta admin?
  $isAdmin = ($path -match "\\app\\api\\admin\\") -or ($path -match "/app/api/admin/")

  if ($isAdmin) {
    $content = Ensure-Import $content 'import { requireAdmin } from "@/lib/auth";'
  } else {
    $content = Ensure-Import $content 'import { requireUser } from "@/lib/auth";'
  }

  # Insertar guard dentro del try { ... }
  if ($content -notmatch "requireUser" -and $content -notmatch "requireAdmin") {

    if ($isAdmin) {
      $guard = "    await requireAdmin();"
    } else {
      $guard = "    await requireUser();"
    }

    $content = $content -replace "try\s*\{", "try {`n$guard"
  }

  if (Save-IfChanged $path $content) {
    $modified += $path
  }
}

# ---------- 2) Fix AuthProvider import ----------

$layout = "src/app/layout.tsx"
if (Test-Path $layout) {
  $layoutContent = Get-Content $layout -Raw

  $fixed = $layoutContent `
    -replace "import\s+\{\s*AuthProvider\s*\}.*AuthProvider", `
             'import AuthProvider from "@/components/providers/AuthProvider"'

  if (Save-IfChanged $layout $fixed) {
    $modified += (Resolve-Path $layout).Path
    Write-Host "Fixed AuthProvider import" -ForegroundColor Yellow
  }
}

# ---------- Report ----------

Write-Host ""
Write-Host "Cleanup complete." -ForegroundColor Green
Write-Host "Modified files:" -ForegroundColor Cyan
$modified | Sort-Object | ForEach-Object { Write-Host " - $_" }

Write-Host ""
Write-Host "Next step:" -ForegroundColor Magenta
Write-Host "  npx tsc --noEmit"
