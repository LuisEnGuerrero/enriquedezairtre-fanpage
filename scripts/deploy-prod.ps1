param(
  [Parameter(Mandatory=$true)]
  [string]$Version
)

$PROJECT_ID = "zairtre-music"
$REGION = "us-central1"
$IMAGE = "us-central1-docker.pkg.dev/$PROJECT_ID/zairtre-repo/zairtre-app:$Version"

Write-Host " Deploying PROD ($Version)" -ForegroundColor Red

gcloud run deploy zairtre-app `
  --image $IMAGE `
  --region $REGION `
  --platform managed `
  --allow-unauthenticated `
  --memory 512Mi `
  --cpu 1 `
  --max-instances 3 `
  --min-instances 1
