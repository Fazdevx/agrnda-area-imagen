# 🚀 Deploy en Vercel — Guía completa

App: **Notion · Tareas por persona** (PWA estática de una sola página).
No necesita build, ni dependencias, ni Node en Vercel: son archivos estáticos listos para servir.

---

## 📋 Contenido del proyecto

```
├── index.html              ← La app completa (incluye CSS + JS)
├── manifest.json           ← Metadatos de la PWA (nombre, íconos, colores)
├── service-worker.js       ← Cacheo offline
├── offline.html            ← Pantalla sin conexión
├── icons/
│   ├── icon-192.png        ← Íconos normales (Android/Chrome/Edge)
│   ├── icon-512.png
│   ├── maskable-192.png    ← Íconos "maskable" (Android adaptativo)
│   ├── maskable-512.png
│   ├── icon.svg            ← Fuente vectorial editable
│   └── maskable.svg
├── vercel.json             ← Configuración de Vercel (headers, caché)
├── generate-icons.js       ← ⚠️ Solo desarrollo (NO se despliega)
└── .vercelignore           ← Archivos excluidos del deploy
```

Todas las rutas son **relativas**, así funciona igual en `https://tu-app.vercel.app`
o en cualquier subdirectorio.

---

## ✅ Opción A — Desde la web de Vercel (recomendado)

### 1. Subir el proyecto a GitHub

```powershell
cd "C:\Users\fabri\Downloads\Projcts\Galileo pj\agrnda iamgen"

git add .
git commit -m "PWA lista para deploy en Vercel"
git push
```

### 2. Importar en Vercel

1. Entra en <https://vercel.com/new>
2. Inicia sesión con GitHub, autoriza el repo → **Import**
3. En la pantalla de configuración deja **exactamente** esto:

| Campo                     | Valor                              |
| ------------------------- | ---------------------------------- |
| **Framework Preset**      | `Other`                            |
| **Root Directory**        | `./` (raíz del repo)               |
| **Build Command**         | *(vacío / Override → sin comando)* |
| **Output Directory**      | *(vacío)*                          |
| **Install Command**       | *(vacío)*                          |
| **Environment Variables** | *(ninguna)*                        |

> Si el repo tiene la app dentro de una subcarpeta, ajusta **Root Directory**.

4. Pulsa **Deploy**. En ~15 segundos tendrás `https://<proyecto>.vercel.app`.

---

## ⌨️ Opción B — Con el CLI de Vercel

```powershell
cd "C:\Users\fabri\Downloads\Projcts\Galileo pj\agrnda iamgen"

# 1) Login (abre el navegador)
npx vercel login

# 2) Deploy de PREVIEW (URL de prueba)
npx vercel

# Preguntas del asistente:
#   Set up and deploy?          → Y
---

## ⚙️ Qué hace `vercel.json`

### Cabeceras de seguridad (todas las rutas)

| Cabecera                     | Valor                             | Para qué |
| ---------------------------- | --------------------------------- | -------- |
| `Content-Security-Policy`    | `'self'` + cdnjs (Font Awesome)   | Evita inyección de scripts de terceros |
| `X-Content-Type-Options`     | `nosniff`                         | Evita que el navegador "adivine" tipos MIME |
| `X-Frame-Options`            | `SAMEORIGIN`                      | Evita clickjacking en otros sitios |
| `Referrer-Policy`            | `strict-origin-when-cross-origin` | No filtrar URLs completas |
| `Permissions-Policy`         | bloquea geolocalización/cámara/micrófono | La app no los necesita |
| `Strict-Transport-Security`  | `max-age=63072000`                | Fuerza HTTPS siempre |

### Cabeceras de caché (clave para que las actualizaciones se vean)

| Ruta                                | `Cache-Control`               | Motivo |
| ----------------------------------- | ----------------------------- | ------ |
| `/service-worker.js`                | `max-age=0, must-revalidate`  | El SW **nunca** debe quedar cacheado, o no llegarían las actualizaciones |
| `/`, `/index.html`, `/offline.html` | `max-age=0, must-revalidate`  | El HTML siempre se revalida |
| `/manifest.json`                    | `max-age=3600` + `application/manifest+json` | Tipo MIME correcto para el instalador de PWA |
| `/icons/*`                          | `max-age=31536000, immutable` | Imágenes que no cambian → carga instantánea |

También se envía `Service-Worker-Allowed: /` para que el SW pueda controlar
todo el dominio (scope raíz).

---

## 🔍 Comprobar que la PWA funciona (post-deploy)

1. Abre tu URL de Vercel en **Chrome o Edge de escritorio**.
2. `F12` → pestaña **Application** (Aplicación):
   - **Manifest** → nombre, íconos y colores deben aparecer sin errores.
   - **Service Workers** → debe decir `activated and is running`.
   - **Storage → Cache Storage** → debe existir `tareas-app-v2`.
3. En la barra de direcciones aparece el ícono **⊕ / Instalar**… o el botón
   **"Instalar app"** del propio header de la app. 🎉
4. **En móvil**: Chrome (Android) → menú → *Añadir a pantalla de inicio*;
   iOS Safari → Compartir → *Añadir a pantalla de inicio*.
5. Prueba **offline**: desconecta el WiFi y recarga → debe seguir funcionando
   (y mostrar `offline.html` si es una ruta nueva).

> ⚠️ **Instalar una PWA requiere HTTPS.** `*.vercel.app` ya lo trae gratis.
> Los dominios propios también obtienen certificado automático.

---

## 🌐 Dominio propio (opcional)

Vercel → tu proyecto → **Settings → Domains → Add**:

- Dominio comprado en otro sitio: añade el registro que indique Vercel
  (`A 76.76.21.21` para el dominio raíz, `CNAME cname.vercel-dns.com` para `www`).
- Dominio comprado en Vercel: un clic y listo.

El certificado SSL se emite solo, en pocos minutos.

---

## 🔄 Publicar una actualización

1. Edita lo que necesites.
2. **Si tocaste HTML/CSS/JS/íconos → sube la versión del caché** en
   `service-worker.js`, línea 1:

   ```js
   const CACHE_NAME = 'tareas-app-v3';   // ← súbelo siempre
   ```

   Así los usuarios que ya tienen la app instalada reciben los cambios
   (si no, siguen viendo la versión vieja desde el caché).

3. `git add . ; git commit -m "cambio" ; git push` → Vercel despliega solo,
   o `npx vercel --prod` con el CLI.

Las tareas viven en el `localStorage` del navegador de cada usuario, por lo que
**no se pierden** al actualizar la app, y no hay base de datos que pagar.

---

## 🧯 Problemas frecuentes

| Síntoma | Solución |
| ------- | -------- |
| "404 NOT_FOUND" al abrir la URL | Revisa que `index.html` esté en la **raíz** del repo (o ajusta Root Directory) y que el deploy haya terminado |
| No aparece el botón "Instalar app" | Debe ser HTTPS (lo es en Vercel ✓), hay que visitar la página más de una vez, y no tenerla ya instalada. En escritorio solo Chrome/Edge; Firefox no lo soporta |
| Los cambios no se ven | Sube `CACHE_NAME` a `-v3` y recarga con `Ctrl+Shift+R` |
| El manifest da error de MIME | Ya está resuelto por la cabecera `Content-Type` de `vercel.json` |
| Se rompe Font Awesome | La CSP permite `cdnjs.cloudflare.com`; si añades otro CDN, agrégalo a `style-src`/`font-src` en `vercel.json` |
| El deploy sube el README y los scripts | Revisa `.vercelignore` |

---

## 📌 Resumen rápido

```powershell
# Login + publicación en producción, en 3 líneas:
npx vercel login
npx vercel --prod
```

#   Which scope?                → tu cuenta
#   Link to existing project?   → N
#   What's your project's name? → tareas-app
#   In which directory is your code located?  → ./     (Enter, valor por defecto)
#   Want to modify these settings?            → N

# 3) Deploy a PRODUCCIÓN (URL definitiva)
npx vercel --prod
```

Después del primer deploy, la carpeta `.vercel/` guarda el vínculo del proyecto
(ya está en `.gitignore`, no la subas nunca).
