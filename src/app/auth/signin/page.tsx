// src/app/auth/signin/page.tsx

export const dynamic = "force-dynamic";

import React, { Suspense } from 'react'
import ClientSignIn from './ClientSignIn'

export default function SignInPage() {
  return (
    <Suspense fallback={<div>Cargando…</div>}>
      <ClientSignIn />
    </Suspense>
  )
}
