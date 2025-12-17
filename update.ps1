# deploy.ps1
# Automatiza commit, push, build, push docker y despliegue en Cloud Run

# 1. Git add y commit con mensaje dinámico
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$commitMessage = "fix: NextAuth middlewares and route.ts update cookies ($timestamp)"

git add .
git commit -m "$commitMessage"

# 2. Git push (usa credenciales configuradas previamente en Git)
git push origin main

# 3. Docker build
docker build -t us-central1-docker.pkg.dev/zairtre-music/zairtre-repo/fanpage:FixMIddlewares .

# 4. Docker push
docker push us-central1-docker.pkg.dev/zairtre-music/zairtre-repo/fanpage:FixMIddlewares

# 5. Deploy en Cloud Run
gcloud run services update zairtre-cloudrun `
  --region us-central1 `
  --image us-central1-docker.pkg.dev/zairtre-music/zairtre-repo/fanpage:FixMIddlewares

# 6. Leer logs recientes
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=zairtre-cloudrun" `
  --limit=14 `
  --project=zairtre-music