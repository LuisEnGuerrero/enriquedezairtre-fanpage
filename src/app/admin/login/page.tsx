// src/app/admin/login/page.tsx

export const dynamic = "force-dynamic";

import React, { Suspense } from "react";
import ClientLogin from "./ClientLogin";

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div>Cargando…</div>}>
      <ClientLogin />
    </Suspense>
  );
}
