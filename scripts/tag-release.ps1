param (
  [string]$Type = "patch" # major | minor | patch
)

$latestTag = git tag --sort=-v:refname | Select-Object -First 1
if (-not $latestTag) { $latestTag = "v0.0.0" }

$version = $latestTag.TrimStart("v").Split(".")
[int]$major = $version[0]
[int]$minor = $version[1]
[int]$patch = $version[2]

switch ($Type) {
  "major" { $major++; $minor=0; $patch=0 }
  "minor" { $minor++; $patch=0 }
  default { $patch++ }
}

$newTag = "v$major.$minor.$patch"

git tag $newTag
if ($LASTEXITCODE -ne 0) {
  throw "Git tag $newTag already exists. Aborting release."
}

git push origin $newTag

Write-Host " New tag: $newTag" -ForegroundColor Green

Write-Output $newTag