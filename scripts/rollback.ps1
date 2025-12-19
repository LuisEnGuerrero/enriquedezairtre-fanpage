param([string]$Revision)

gcloud run services update-traffic zairtre-app `
  --to-revisions $Revision=100 `
  --region us-central1
