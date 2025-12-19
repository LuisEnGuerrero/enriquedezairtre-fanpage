param(
  [Parameter(Mandatory=$true)]
  [string]$Version
)

$PROJECT_ID = "zairtre-music"
$REGION = "us-central1"
$IMAGE = "us-central1-docker.pkg.dev/$PROJECT_ID/zairtre-repo/zairtre-app:$Version"

Write-Host " Deploying STAGING ($Version)" -ForegroundColor Cyan

gcloud run deploy zairtre-staging `
  --image $IMAGE `
  --region $REGION `
  --platform managed `
  --allow-unauthenticated `
  --memory 512Mi `
  --cpu 1 `
  --max-instances 2
