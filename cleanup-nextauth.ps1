Write-Host "Starting NextAuth cleanup..."

$nextAuthPath = "src/app/api/auth/[...nextauth]"
if (Test-Path $nextAuthPath) {
  Write-Host ("Removing " + $nextAuthPath)
  Remove-Item -Recurse -Force $nextAuthPath
}

$typesPath = "src/types/next-auth.d.ts"
if (Test-Path $typesPath) {
  Write-Host ("Removing " + $typesPath)
  Remove-Item -Force $typesPath
}

$authProvider = "src/components/providers/AuthProvider.tsx"
if (Test-Path $authProvider) {
  Write-Host ("Neutralizing " + $authProvider)
  Set-Content -Path $authProvider -Encoding UTF8 -Value "'use client';`r`n`r`nexport default function AuthProvider(props) {`r`n  return props.children;`r`n}`r`n"
}

Write-Host "Files still referencing next-auth:"
& rg "next-auth" src

Write-Host "Done."
