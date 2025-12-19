param (
  [ValidateSet("staging", "prod")]
  [string]$Env = "staging"
)

$ErrorActionPreference = "Stop"

Write-Host " Release pipeline started ($Env)" -ForegroundColor Cyan

# ---------------------------------
# 1) TypeScript
# ---------------------------------
Write-Host " TypeScript check..." -ForegroundColor Cyan
npx tsc --noEmit

# ---------------------------------
# 2) Versioning
# ---------------------------------
Write-Host " Versioning..." -ForegroundColor Cyan

$version = & .\scripts\tag-release.ps1 -Type patch | Select-Object -Last 1

if (-not $version) {
  throw "tag-release.ps1 no devolvió la versión. Asegura que haga Write-Output del tag al final."
}

$version = $version.Trim()

Write-Host " Version created: $version" -ForegroundColor Green


# ---------------------------------
# 3) Build image
# ---------------------------------
Write-Host " Building container..." -ForegroundColor Cyan
& .\scripts\build-image.ps1 -Version $version

# ---------------------------------
# 4) Deploy
# ---------------------------------
if ($Env -eq "prod") {
  Write-Host " Deploying to PRODUCTION" -ForegroundColor Red
  & .\scripts\deploy-prod.ps1 -Version $version
}
else {
  Write-Host " Deploying to STAGING" -ForegroundColor Yellow
  & .\scripts\deploy-staging.ps1 -Version $version
}

Write-Host " Release completed successfully" -ForegroundColor Green
