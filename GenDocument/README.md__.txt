# README.md
# ðŸŽ¤ **Enrique de Zairtre â€” Plataforma Oficial & Fan Experience**

### **Next.js 15 Â· Firestore Â· Modern Frontend Architecture Â· Scalable Cloud Design**

Este proyecto es la **plataforma oficial** de *Enrique de Zairtre*, un artista conceptual que fusiona rock, folk latino y narrativa poÃ©tica.
MÃ¡s que una simple FanPage, este repositorio demuestra una **arquitectura web moderna**, **orientada a la experiencia de usuario**, y diseÃ±ada con estÃ¡ndares de **producciÃ³n**, **escalabilidad** y **mantenibilidad profesional**.

Este README estÃ¡ redactado para:

âœ… **Reclutadores tÃ©cnicos**
âœ… **Ingenieros senior que evalÃºan arquitectura**
âœ… **Desarrolladores que revisan buenas prÃ¡cticas**
âœ… **Usuarios o fans que desean comprender el proyecto final**

---

# ðŸš€ **VisiÃ³n TÃ©cnica del Proyecto**

La plataforma evoluciona desde una FanPage hacia un ecosistema completo:

* ðŸŽ§ **Streaming de mÃºsica** con reproductor persistente
* â­ **Sistema de favoritos con cachÃ© inteligente**
* ðŸŽ **Rewards y sistema de lealtad gamificado**
* ðŸŽ›ï¸ **Panel administrativo con gestiÃ³n de contenido**
* ðŸŽµ **Playlists oficiales y personalizadas**
* ðŸ” **AutenticaciÃ³n segura con Google (NextAuth)**
* â˜ï¸ **Infraestructura serverless con Firestore + Firebase Storage**

Este proyecto combina:

* **Arquitectura moderna (Next.js App Router + React Server Components)**
* **Backend serverless escalable (Firestore)**
* **UI profesional (shadcn/ui + Radix)**
* **Patrones reales de producciÃ³n**
* **Scripts automatizados de seed/reset para entornos cloud**

Es, en esencia, una aplicaciÃ³n de nivel comercial construida con estÃ¡ndares de startup.

---

# ðŸ—ï¸ **Arquitectura de Alto Nivel**

La plataforma se diseÃ±Ã³ bajo principios de:

### **1. Serverless First**

FireStore y Firebase Storage eliminan la necesidad de un servidor dedicado.
Permite escalar globalmente, reducir latencias y simplificar el mantenimiento.

### **2. Clean API Layer (Next.js Route Handlers)**

La API se organiza en mÃ³dulos independientes:

```
/api
 â”œâ”€â”€ songs/
 â”œâ”€â”€ playlists/
 â”œâ”€â”€ favorites/
 â”œâ”€â”€ user/
 â”œâ”€â”€ admin/
 â””â”€â”€ auth/
```

Cada endpoint incluye:

* ValidaciÃ³n de sesiÃ³n
* Roles y permisos
* Control avanzado de errores
* LÃ³gica desacoplada del frontend

### **3. Client/UI desacoplado con React Server Components**

* RSC para lectura de datos de Firestore
* Client Components para audio, player controls y UI interactiva
* React Query para sincronizaciÃ³n en tiempo real donde aplica

### **4. Capa de dominio clara**

* Songs
* Favorites
* Playlists
* Activities
* Rewards
* Fans

Cada mÃ³dulo estÃ¡ bien definido y fÃ¡cilmente extensible.

---

# â˜ï¸ **Infraestructura Cloud**

### **Base de Datos**

âœ” Firestore
âœ” Subcolecciones para favoritos, playlists y actividad
âœ” Ãndices optimizados
âœ” Costos controlados mediante:

* Batch reads
* CachÃ© inteligente en endpoints
* Evitar n+1 queries innecesarias
* TTL opcional para logs de actividades

### **Almacenamiento**

âœ” Firebase Storage
âœ” Scripts automatizados que suben portadas, audios y badges
âœ” Fallback automÃ¡tico si falla la subida (Ãºtil en CI/CD)

### **AutenticaciÃ³n**

âœ” NextAuth con Google
âœ” SincronizaciÃ³n automÃ¡tica de perfil con Firestore
âœ” AsignaciÃ³n automÃ¡tica de roles (admin vs fan)

---

# ðŸ› ï¸ **Stack TecnolÃ³gico Moderno**

### **Frontend / App Framework**

* Next.js 15 (App Router)
* React 19
* TypeScript 5
* Tailwind CSS 4
* shadcn/ui (Radix)
* Framer Motion
* Zustand
* TanStack Query
* MDX Editor
* Recharts

### **Backend Serverless**

* Firestore (NoSQL)
* Firebase Storage
* NextAuth
* Firebase Admin SDK (algunas tareas internas opcionales)

### **Audio & UX**

* Reproductor persistente
* Waveform animations
* Accesibilidad garantizada por Radix

---

# ðŸ“ **Estructura del Proyecto (Nivel Profesional)**

```
src/
â”œâ”€â”€ app/                     # App Router - rutas, layouts y pÃ¡ginas
â”‚   â”œâ”€â”€ (public)/            # UI pÃºblica
â”‚   â”œâ”€â”€ dashboard/           # Panel admin
â”‚   â””â”€â”€ api/                 # API serverless
â”‚
â”œâ”€â”€ components/
â”‚   â”œâ”€â”€ ui/                  # Biblioteca shadcn/ui adaptada
â”‚   â”œâ”€â”€ player/              # Sistema de reproducciÃ³n
â”‚   â””â”€â”€ music/               # Bloques funcionales
â”‚
â”œâ”€â”€ lib/
â”‚   â”œâ”€â”€ firebase/            # ConfiguraciÃ³n Firestore/Storage
â”‚   â”œâ”€â”€ auth/                # NextAuth + sync
â”‚   â””â”€â”€ utils/               # Helpers
â”‚
â””â”€â”€ scripts/
    â”œâ”€â”€ seed-firestore.js    # Seed automatizado del sistema
    â””â”€â”€ reset-firestore.js   # Borrado completo + re-seed
```

---

# ðŸŒ± **Seeds & Reset AutomÃ¡tico**

Una caracterÃ­stica clave (muy Ãºtil para entornos reales):

### **Seed (carga inicial de datos):**

```
npm run seed
```

Incluye:

* CreaciÃ³n automÃ¡tica del usuario admin
* Subida de audios y portadas a Firebase Storage
* CreaciÃ³n de canciones oficiales
* Playlists oficiales
* Badges y sistema de rewards
* Registro de actividad inicial

### **Reset Completo (modo desarrollo/testing):**

```
npm run reset
```

Realiza:

1. Borrado completo de Firestore (colecciones + subcolecciones)
2. Limpieza de Storage (carpetas de audios/covers/badges)
3. EjecuciÃ³n del seed para dejar el proyecto "limpio"

---

# ðŸ” **AutenticaciÃ³n & Roles**

Roles soportados:

* **admin**: acceso total al panel de control
* **fan**: usuario regular

El sistema `sync-user` asigna rol automÃ¡ticamente segÃºn:

```js
if (email === ADMIN_EMAIL) role = "admin"
else role = "fan"
```

Y actualiza:

* Nombre
* Foto
* Fecha de Ãºltimo login
* Registro de actividad

---

# ðŸ§  **CaracterÃ­sticas Avanzadas de IngenierÃ­a**

### âœ” CachÃ© inteligente para reducir costos Firestore

Endpoints como `/api/favorites` y `/api/songs` implementan:

* LRU in-memory cache
* ExpiraciÃ³n automÃ¡tica
* Invalidation por mutaciÃ³n
* Evita grandes lecturas repetitivas

### âœ” Pipeline de datos consistente

Todo cambio del usuario registra:

* Actividad
* Puntos de lealtad
* EstadÃ­sticas agregadas

### âœ” Seguridad de producciÃ³n

* CSRF y Session Protection (NextAuth)
* ValidaciÃ³n estricta de inputs
* API roles-based
* Firestore security rules (opcional para producciÃ³n)

### âœ” CÃ³digo desacoplado y testeable

* MÃ³dulos pequeÃ±os
* Servicios exportables
* Scripts self-contained
* Componentes UI reutilizables

---

# âš™ï¸ **CÃ³mo Ejecutar el Proyecto**

### 1ï¸âƒ£ Instalar dependencias

```bash
npm install
```

### 2ï¸âƒ£ Variables de entorno (ejemplo)

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000

ADM1N_EM41L=tu_correo_admin
```

### 3ï¸âƒ£ Ejecutar en modo desarrollo

```bash
npm run dev
```

### 4ï¸âƒ£ Build de producciÃ³n

```bash
npm run build
npm start
```

---

# ðŸŒ **Deploy**

Compatible con:

* Vercel
* Render
* Railway
* Firebase Hosting + Cloud Functions
* Fly.io

Requiere:

* Variables de entorno
* Firebase project configurado
* Reglas de seguridad Firestore (si aplica)
* Seed opcional en primera ejecuciÃ³n

---

# ðŸ¤ **ContribuciÃ³n**

Si eres desarrollador y deseas mejorar esta plataforma:

1. Crea un branch
2. EnvÃ­a un PR documentado
3. Sigue las convenciones del proyecto
4. Escribe cÃ³digo con intenciÃ³n, claridad y respeto por la arquitectura existente

---

# ðŸ§¬ **PropÃ³sito ArtÃ­stico**

La plataforma no es solo un proyecto tÃ©cnico.
Es una forma de expresar:

* Sonidos conceptuales
* Narrativas poÃ©ticas
* Dimensiones emocionales
* El universo musical de Enrique de Zairtre

Toda ampliaciÃ³n del proyecto respeta esta identidad.

---

# ðŸ **ConclusiÃ³n**

Este repositorio demuestra:

### ðŸ”¥ Arquitectura moderna

### ðŸ“ˆ Escalabilidad serverless real

### ðŸŽ¨ UI profesional

### âš™ï¸ IngenierÃ­a limpia y documentada

### ðŸ§± Scripts de automatizaciÃ³n avanzados

### ðŸ§‘â€ðŸ’» Buenas prÃ¡cticas para producciÃ³n

Es un proyecto ideal para presentar en portafolio porque:

* Integra mÃºltiples tecnologÃ­as reales del mercado
* Muestra capacidad de diseÃ±o arquitectÃ³nico
* Demuestra pensamiento de ingenierÃ­a
* Es visualmente atractivo y funcional

---

