# 🎤 **Enrique de Zairtre — Plataforma Oficial & Fan Experience**

### **Next.js App Router · Firebase Auth · Firestore · Cloud Run · Arquitectura de Producción**

Este proyecto es la **plataforma oficial** de *Enrique de Zairtre*, un artista conceptual que fusiona rock, folk latino y narrativa poética.

Más que una fanpage, este repositorio representa una **aplicación web moderna de nivel productivo**, diseñada con criterios reales de **seguridad**, **escalabilidad**, **mantenibilidad** y **arquitectura cloud profesional**.

Este README está pensado para:

* ✅ Reclutadores técnicos
* ✅ Ingenieros/as senior evaluando arquitectura
* ✅ Desarrolladores/as interesados en buenas prácticas
* ✅ Revisiones de portafolio de nivel profesional

---

## 🚀 Visión General del Proyecto

La plataforma evoluciona desde una fanpage hacia un **ecosistema digital completo**, con:

* 🎧 **Streaming de música** con reproductor persistente
* ⭐ **Sistema de favoritos**
* 🎵 **Playlists oficiales y personalizadas**
* 🎛️ **Panel administrativo protegido**
* 👥 **Gestión de usuarios (fans / admin)**
* 🔐 **Autenticación segura con Google (Firebase Auth)**
* ☁️ **Infraestructura serverless y containerizada**

Todo el sistema está diseñado para **ejecutarse en entornos Linux**, desplegado mediante **contenedores Docker** en **Google Cloud Run**.

---

## 🏗️ Arquitectura de Alto Nivel

### 1️⃣ Enfoque Serverless + Containers

* **Cloud Run** ejecuta el backend como contenedor Docker (Linux)
* **Firestore** como base de datos NoSQL escalable
* **Firebase Storage** para audios, imágenes y recursos
* **Firebase Hosting** como frontend gateway con rewrites a Cloud Run

```
Usuario → Firebase Hosting → Cloud Run (Next.js)
                             ↓
                        Firestore / Storage
```

---

### 2️⃣ Autenticación moderna y segura (SIN NextAuth)

La autenticación se implementa con un **flujo profesional usado en producción**:

1. Login con Google usando **Firebase Auth (cliente)**
2. Obtención de **ID Token**
3. Intercambio por **Session Cookie httpOnly** en `/api/login`
4. Validación server-side con **Firebase Admin SDK**
5. Protección de rutas mediante **middleware**

✔ Cookies seguras
✔ Sin tokens expuestos al cliente
✔ Roles validados en backend
✔ Compatible con Edge + Node runtimes

---

### 3️⃣ Control de acceso por roles

Roles soportados:

* **admin**
* **fan**

La asignación se realiza automáticamente en el endpoint de sincronización de usuario:

```ts
if (email === ADM1N_EM41L) role = "admin"
else role = "fan"
```

El sistema incluye:

* Middleware de protección para `/admin/*`
* Protección de `/api/admin/*`
* Bloqueo inmediato de usuarios no autorizados

---

## 🔐 Seguridad de Producción

* Session Cookies `httpOnly`
* Validación de sesión en backend (Firebase Admin)
* Middleware Edge para control de acceso
* Separación clara cliente / servidor
* Eliminación total de NextAuth y dependencias innecesarias
* Redirección forzada a dominio canónico (`zairtre.site`)

---

## 📦 Stack Tecnológico

### Frontend / Framework

* **Next.js (App Router)**
* React
* TypeScript
* Tailwind CSS
* shadcn/ui
* Radix UI
* Framer Motion

### Backend / Cloud

* Firebase Auth
* Firebase Admin SDK
* Firestore
* Firebase Storage
* Docker (Linux)
* Google Cloud Run
* Firebase Hosting (rewrites)

---

## 📁 Estructura del Proyecto

```
src/
├── app/
│   ├── (public)/              # UI pública
│   ├── admin/                 # Panel administrativo
│   └── api/                   # API serverless
│       ├── login/             # Crear sesión
│       ├── logout/            # Cerrar sesión
│       ├── me/                # Usuario actual
│       ├── admin/             # Endpoints protegidos
│
├── components/
│   ├── ui/
│   ├── player/
│   └── music/
│
├── lib/
│   ├── firebaseClient.ts      # Firebase client SDK
│   ├── firebaseAdmin.ts       # Firebase Admin SDK
│   ├── auth.ts                # Helpers de sesión / roles
│
├── scripts/
│   ├── seed-firestore.js
│   └── reset-firestore.js
│
├── middleware.ts              # Middleware global (admin + canonical)
└── Dockerfile
```

---

## 🌱 Seeds y Reset del Sistema

### Seed inicial

```bash
npm run seed
```

Crea:

* Usuario administrador
* Canciones
* Playlists
* Datos base del sistema

### Reset completo

```bash
npm run reset
```

* Limpia Firestore
* Limpia Firebase Storage
* Ejecuta nuevamente el seed

---

## ⚙️ Variables de Entorno (Producción)

### Cliente (Firebase)

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

### Backend / Cloud Run

```
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

ADM1N_EM41L=correo_admin
SESSION_COOKIE_NAME=__session
SESSION_EXPIRES_DAYS=7
CANONICAL_HOST=zairtre.site
```

❌ **No se utilizan variables NEXTAUTH_***
❌ **NextAuth no forma parte del sistema**

---

## 🐳 Deploy (Producción Real)

El proyecto se despliega mediante:

1. **Docker build** (Linux target)
2. **Push a Artifact Registry**
3. **Deploy a Cloud Run**
4. **Firebase Hosting como gateway**

```bash
docker build -t us-central1-docker.pkg.dev/PROJECT/REPO/APP:prod .
docker push us-central1-docker.pkg.dev/PROJECT/REPO/APP:prod
gcloud run deploy zairtre-cloudrun --image ...
```

---

## 🧠 Enfoque de Ingeniería

Este proyecto demuestra:

* Arquitectura moderna y desacoplada
* Autenticación profesional sin dependencias innecesarias
* Seguridad real (no solo “login funcional”)
* Preparación para entornos Linux desde Windows
* Buen uso de contenedores y serverless
* Código mantenible y escalable

---

## 🎵 Propósito Artístico

La tecnología está al servicio de una narrativa artística:
sonido, identidad, estética y experiencia se integran en una sola plataforma.

---


## 🔐 Security Model (Enterprise-Grade)

Esta plataforma implementa un **modelo de seguridad multicapa**, diseñado bajo principios de **Zero Trust**, **defensa en profundidad** y **mínimo privilegio**, adecuado para entornos de **producción real** y despliegues en la nube.

---

### 1️⃣ Principios de Seguridad

El sistema se fundamenta en los siguientes principios:

* **Zero Trust**: ninguna petición es confiable por defecto.
* **Server-side authority**: toda validación crítica ocurre en el servidor.
* **Least Privilege**: los usuarios solo acceden a lo estrictamente necesario.
* **Separation of concerns**: autenticación, autorización y lógica de negocio están desacopladas.
* **Fail closed**: ante cualquier error, el acceso es denegado.

---

### 2️⃣ Identidad y Autenticación

#### Flujo de Autenticación

La identidad del usuario se gestiona mediante **Firebase Authentication (Google OAuth)**, siguiendo un patrón seguro de intercambio de tokens:

1. El cliente autentica al usuario mediante Google OAuth (Firebase Auth).
2. Firebase devuelve un **ID Token de corta duración**.
3. El cliente envía el ID Token al endpoint `/api/login`.
4. El backend valida el token usando **Firebase Admin SDK**.
5. Se emite una **Session Cookie httpOnly**, firmada y gestionada por Firebase.
6. El cliente opera únicamente con la cookie; **nunca almacena tokens sensibles**.

**Ventajas clave:**

* No se exponen tokens JWT en el frontend.
* Protección automática contra XSS y token leakage.
* Rotación y revocación de sesiones controlada por el backend.

---

### 3️⃣ Gestión de Sesión

* **Session Cookies**:

  * `httpOnly`
  * `secure`
  * `sameSite=lax`
  * Expiración controlada (`SESSION_EXPIRES_DAYS`)

* **Validación server-side**:

  * Cada petición protegida valida la sesión usando Firebase Admin SDK.
  * Las sesiones revocadas o expiradas son rechazadas automáticamente.

* **Logout seguro**:

  * Eliminación explícita de la cookie.
  * Invalidación inmediata de la sesión en el backend.

---

### 4️⃣ Autorización Basada en Roles (RBAC)

El sistema implementa **Role-Based Access Control (RBAC)**:

| Rol     | Capacidades                                    |
| ------- | ---------------------------------------------- |
| `fan`   | Acceso a funcionalidades públicas              |
| `admin` | Acceso completo a panel y APIs administrativas |

* El rol se almacena en Firestore y **no puede ser alterado desde el cliente**.
* La asignación inicial es automática y controlada por el backend.
* El rol es validado **en cada request protegida**.

```ts
if (user.role !== 'admin') {
  denyAccess()
}
```

---

### 5️⃣ Protección de Rutas y APIs

#### Middleware Edge (Primera Barrera)

Un **middleware global en Edge Runtime** protege:

* `/admin/*`
* `/api/admin/*`

Funciones clave:

* Verificación de existencia de sesión.
* Validación de rol mediante `/api/me`.
* Redirección o bloqueo inmediato ante acceso no autorizado.
* Protección previa a la ejecución del código de aplicación.

#### Validación Backend (Segunda Barrera)

Incluso si el middleware es bypassed:

* Cada endpoint administrativo vuelve a validar:

  * Sesión
  * Rol
* El backend **no confía en el middleware como única defensa**.

---

### 6️⃣ Seguridad de API

* Validación estricta de inputs.
* Respuestas de error controladas (sin filtrado de información sensible).
* Separación clara entre APIs públicas y administrativas.
* Uso de métodos HTTP semánticamente correctos (`GET`, `POST`, `PUT`, `DELETE`).

---

### 7️⃣ Seguridad de Infraestructura

* **Cloud Run**:

  * Contenedores aislados.
  * Escalado automático.
  * Sin acceso directo al sistema operativo.
* **Docker**:

  * Imágenes Linux reproducibles.
  * Sin dependencias del entorno host.
* **Variables sensibles**:

  * Inyectadas únicamente en runtime.
  * Nunca versionadas.
  * Sin exposición al cliente.

---

### 8️⃣ Dominio Canónico y Mitigación de Riesgos

* Redirección forzada al dominio canónico (`zairtre.site`).
* Prevención de:

  * Session fixation
  * Host header attacks
  * Ambientes de ejecución no autorizados

---

### 9️⃣ Defensa ante Amenazas Comunes

| Amenaza               | Mitigación                           |
| --------------------- | ------------------------------------ |
| XSS                   | Cookies httpOnly                     |
| CSRF                  | sameSite cookies + server validation |
| Token theft           | Tokens nunca accesibles al cliente   |
| Privilege escalation  | RBAC server-side                     |
| Session hijacking     | Cookies secure + revocación          |
| Acceso directo a APIs | Middleware + validación backend      |

---

### 🔟 Auditoría y Mantenibilidad

* Código de seguridad centralizado y auditable.
* Eliminación completa de dependencias obsoletas (NextAuth).
* Arquitectura fácilmente extensible para:

  * MFA
  * Nuevos providers OAuth
  * Políticas de seguridad adicionales

---

# 🚀 Deployment Pipeline (Staging & Production)

Esta aplicación se despliega mediante un **pipeline automatizado y reproducible**, basado en **Docker + Google Cloud Run**, siguiendo buenas prácticas de **CI/CD manual controlado**.

El flujo soporta:

* ✔️ Entornos **staging** y **production**
* ✔️ Versionado automático vía **git tags**
* ✔️ Rollback seguro a revisiones previas
* ✔️ Uso de **Google Secret Manager**
* ✔️ Control de costos en Cloud Run
* ✔️ Health checks y readiness probes

---

## 🧱 Infraestructura Base

Antes del primer despliegue, deben existir los siguientes recursos en GCP:

```bash
# APIs necesarias
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com
```

```bash
# Artifact Registry (una sola vez)
gcloud artifacts repositories create zairtre-repo \
  --repository-format=docker \
  --location=us-central1 \
  --description="Zairtre containers"
```

> El repositorio **zairtre-repo** almacena las imágenes Docker versionadas.

---

## 🐳 Contenedor Docker (Producción)

La aplicación se empaqueta usando un **Dockerfile multi-stage optimizado**, que:

* Construye Next.js en modo `standalone`
* Genera una imagen final **ligera**
* Escucha en el **puerto 8080** (Cloud Run standard)

Variables clave dentro del contenedor:

```dockerfile
ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080
```

Cloud Run inyecta el puerto automáticamente, por lo que **no se usa docker-compose en producción**.

---

## 🔐 Gestión de Secretos (Secret Manager)

Todas las credenciales sensibles se almacenan en **Google Secret Manager** y se inyectan en runtime:

```bash
gcloud secrets create FIREBASE_PRIVATE_KEY --data-file=-
gcloud secrets create FIREBASE_CLIENT_EMAIL --data-file=-
gcloud secrets create ADM1N_EM41L --data-file=-
```

En Cloud Run, los secretos se asocian al servicio:

```bash
--set-secrets FIREBASE_PRIVATE_KEY=FIREBASE_PRIVATE_KEY:latest
```

✔️ Ningún secreto vive en el repositorio
✔️ Ningún `.env` en producción
✔️ Rotación segura y auditable

---

## 🏷️ Versionado Automático (Git Tags)

El versionado sigue **SemVer** (`vX.Y.Z`) y se genera automáticamente:

```bash
.\scripts\tag-release.ps1 -Type patch
```

Esto:

* Calcula la siguiente versión
* Crea el `git tag`
* Lo empuja al repositorio remoto

El mismo tag se usa para **nombrar la imagen Docker**, evitando inconsistencias.

---

## 🚦 Entornos Soportados

| Entorno | Servicio Cloud Run | Tráfico |
| ------- | ------------------ | ------- |
| staging | `zairtre-staging`  | Interno |
| prod    | `zairtre-app`      | Público |

Cada entorno usa:

* Imagen distinta
* Variables de entorno independientes
* Escalado controlado

---

## ▶️ Despliegue Manual (Recomendado)

### 🔹 Staging

```powershell
.\scripts\deploy-staging.ps1
```

### 🔹 Producción

```powershell
.\scripts\deploy-prod.ps1
```

Ambos scripts:

1. Construyen la imagen Docker
2. La suben a Artifact Registry
3. Despliegan a Cloud Run
4. Configuran recursos, puertos y secretos
5. Crean una nueva **revision inmutable**

---

## 🧠 Script Orquestador (One-Command Deploy)

Para evitar errores humanos y discrepancias de versión, el proyecto incluye un **script orquestador**:

```powershell
.\scripts\release.ps1 -Env prod
```

Este script ejecuta **en orden**:

1. `npx tsc --noEmit`
2. `tag-release.ps1`
3. `deploy-(staging|prod).ps1`
4. Verificación del servicio en Cloud Run

✔️ Una sola fuente de verdad
✔️ Sin versionado manual
✔️ Reproducible y auditable

---

## ♻️ Rollback Seguro

Cloud Run mantiene **todas las revisiones**.

Rollback inmediato:

```bash
gcloud run services update-traffic zairtre-app \
  --to-revisions zairtre-app-00012-abc=100
```

✔️ Sin rebuild
✔️ Sin downtime
✔️ Reversible en segundos

---

## ❤️ Health Checks & Readiness

El contenedor expone correctamente el puerto `8080`, y Cloud Run gestiona:

* Startup probe
* Readiness automática
* Restart en fallos

Opcionalmente puede añadirse:

```ts
GET /api/health
```

Para chequeos externos o monitoreo.

---

## 💸 Control de Costos (Cloud Run)

Configuración aplicada:

* `min-instances = 0` → **$0 en idle**
* `max-instances = 2`
* CPU throttling habilitado
* Concurrency controlada

Esto garantiza:

✔️ Bajo costo
✔️ Escalado automático
✔️ Sin servidores permanentes

---

## 📌 Notas Importantes

* `docker-compose.yml` **solo se usa en local**
* Producción usa **Cloud Run + Artifact Registry**
* El puerto **8080 es obligatorio** en Cloud Run
* NextAuth **no existe** en este proyecto
* Toda autenticación es Firebase-native

---

## 🧠 Estado del Proyecto

✔️ Compilación TypeScript limpia
✔️ Contenedor construido correctamente
✔️ Imagen versionada
✔️ Servicios creados en Cloud Run
✔️ Listo para tráfico real

---
## 🏁 Conclusión

Este repositorio no es un demo.

Es una **aplicación web moderna de nivel productivo**, adecuada para:

* Portafolios técnicos avanzados
* Evaluaciones de arquitectura
* Referencia de autenticación moderna con Firebase
* Ejemplo real de despliegue con Docker + Cloud Run


A continuación te entrego una **sección “Security Model” de nivel enterprise**, lista para **pegar directamente en el README**, alineada con tu arquitectura real (Firebase Auth + Session Cookies + Cloud Run + Middleware Edge).

El tono está pensado para **auditoría técnica**, **revisión senior**, **arquitectura enterprise** y **portafolio avanzado**.

---
### 🧠 Sobre el Modelo de Seguridad

Este sistema implementa un **modelo de seguridad moderno, robusto y alineado con estándares enterprise**, demostrando:

* Dominio de autenticación avanzada
* Comprensión profunda de amenazas reales
* Separación clara de responsabilidades
* Preparación para auditorías técnicas y escalado futuro

No se trata solo de “usuarios que inician sesión”, sino de **una arquitectura de seguridad diseñada conscientemente**.

---

## 📝 Créditos
### Desarrollo y Diseño

Este sitio web ha sido diseñado y desarrollado por
**Luis Enrique Guerrero**
-https://luisenguerrero.netlify.app-
WhatsApp: +57 3208172936
