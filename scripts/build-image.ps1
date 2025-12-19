param (
  [Parameter(Mandatory = $true)]
  [string]$Version,

  [switch]$NoCache
)

$ErrorActionPreference = "Stop"

# ---------------------------------
# CONFIG
# ---------------------------------
$PROJECT_ID = "zairtre-music"
$REGION     = "us-central1"
$REPO       = "zairtre-repo"
$IMAGE_NAME = "zairtre-app"

$IMAGE = "${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/${IMAGE_NAME}:${Version}"
$IMAGE_LATEST = "${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/${IMAGE_NAME}:latest"

$PLATFORM = "linux/amd64"

Write-Host " Building Docker image" -ForegroundColor Cyan
Write-Host " Image: $IMAGE" -ForegroundColor Cyan

# ---------------------------------
# BUILD ARGS
# ---------------------------------
$buildArgs = @(
  "build",
  "--platform=$PLATFORM",
  "-t", $IMAGE,
  "-t", $IMAGE_LATEST
)

if ($NoCache) {
  $buildArgs += "--no-cache"
}

$buildArgs += "."

docker @buildArgs

Write-Host " Image ready:" -ForegroundColor Green
Write-Host "   - $IMAGE"
Write-Host "   - $IMAGE_LATEST"

Write-Host " Pushing images to Artifact Registry" -ForegroundColor Cyan

docker push $IMAGE
if ($LASTEXITCODE -ne 0) { throw "Docker push failed for $IMAGE" }

docker push $IMAGE_LATEST
if ($LASTEXITCODE -ne 0) { throw "Docker push failed for latest" }

Write-Host " Image pushed successfully" -ForegroundColor Green