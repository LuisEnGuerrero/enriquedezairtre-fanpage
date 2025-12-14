/**
 * update-cloudrun-env.js
 *
 * Lee env.cloudrun y sincroniza todas las variables con Cloud Run automáticamente.
 *
 * Uso:
 *   node scripts/update-cloudrun-env.js
 */

import fs from "fs";
import { execSync } from "child_process";

console.log("📦 Leyendo variables desde .env.cloudrun");

const raw = fs.readFileSync(".env.cloudrun", "utf8");
const vars = {};

raw.split("\n").forEach((line) => {
  if (!line.trim() || line.startsWith("#")) return;
  const [key, ...rest] = line.split("=");
  let value = rest.join("=").trim();

  // Quitar comillas externas
  if (value.startsWith('"') && value.endsWith('"')) {
    value = value.slice(1, -1);
  }

  // Normalizar private key
  if (key === "FIREBASE_PRIVATE_KEY") {
    value = value.replace(/\\n/g, "\\n").replace(/\r/g, "");
  }

  vars[key] = value;
});

console.log("🔍 Variables procesadas:");
console.log(vars);

// Build de argumentos
const envArgs = Object.entries(vars)
  .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
  .join(",");

const cmd = `gcloud run services update zairtre-cloudrun --region=us-central1 --set-env-vars=${envArgs}`;

console.log("\n▶ Ejecutando:\n", cmd, "\n");

try {
  execSync(cmd, { stdio: "inherit" });
  console.log("✅ Variables actualizadas correctamente en Cloud Run");
} catch (err) {
  console.error("❌ ERROR ejecutando comando:", err);
}
