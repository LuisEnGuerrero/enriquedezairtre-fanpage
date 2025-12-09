#!/bin/sh
set -e

echo "📦 Entrypoint iniciado (Firestore Mode)..."

echo "---------------------------------------------"
echo "  🔧 Variables detectadas:"
echo "  RESET_FIRESTORE = ${RESET_FIRESTORE}"
echo "  SEED_FIRESTORE  = ${SEED_FIRESTORE}"
echo "  NODE_ENV        = ${NODE_ENV}"
echo "  PORT            = ${PORT}"
echo "---------------------------------------------"

# --------------------------------------------------------------------
#  FIRESTORE RESET / SEED (Opcional según variables de entorno)
# --------------------------------------------------------------------

if [ "$RESET_FIRESTORE" = "true" ]; then
  echo "🧹 RESET_FIRESTORE=true → Ejecutando reset-firestore.js..."
  if node scripts/reset-firestore.js; then
    echo "✔ Reset completado."
  else
    echo "❌ Error ejecutando reset-firestore.js (pero continuamos para evitar fallar deploy)"
  fi
elif [ "$SEED_FIRESTORE" = "true" ]; then
  echo "🌱 SEED_FIRESTORE=true → Ejecutando seed-firestore.js..."
  if node scripts/seed-firestore.js; then
    echo "✔ Seed completado."
  else
    echo "❌ Error ejecutando seed-firestore.js (pero continuamos para evitar fallar deploy)"
  fi
else
  echo "ℹ No se ejecutará reset/seed. Usa RESET_FIRESTORE=true o SEED_FIRESTORE=true"
fi

# --------------------------------------------------------------------
#  INICIO DEL SERVIDOR NEXT.JS (Standalone)
# --------------------------------------------------------------------

echo "🚀 Iniciando servidor Next.js en puerto ${PORT:-3000}..."
exec node server.js
