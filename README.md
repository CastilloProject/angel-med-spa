# Angel Med Spa & Wellness — un solo proyecto

## Publicar desde GitHub con administración funcional

GitHub guarda el código; este proyecto necesita un servidor Node.js para ejecutar el acceso privado y guardar cambios. GitHub Pages solo sirve archivos estáticos y no ejecuta `server.js`.

1. Crea un repositorio vacío y privado en GitHub, por ejemplo `angel-med-spa`. No añadas un README nuevo, porque el proyecto ya lo incluye.
2. En una terminal dentro de esta carpeta, ejecuta estos comandos, sustituyendo `TU_USUARIO` por tu cuenta:

   ```powershell
   git init
   git add .
   git status
   git commit -m "Sitio Angel Med Spa"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/angel-med-spa.git
   git push -u origin main
   ```

   Revisa `git status` antes de confirmar: `.gitignore` excluye contraseñas, configuración guardada, respaldos, capturas y archivos temporales. No subas estos archivos manualmente desde la web de GitHub, porque esa carga no aplica las exclusiones de Git.

3. En Render, conecta tu cuenta de GitHub, elige **New → Blueprint** y selecciona el repositorio. El archivo `render.yaml` configura el servicio Node, los comandos y un disco persistente. Revisa el coste: esta configuración usa un servicio de pago y un disco.
4. Cuando Render lo solicite, define `ADMIN_PASSWORD` con una contraseña propia de al menos 12 caracteres. Guárdala en el gestor de contraseñas; no la pongas en archivos ni en GitHub.
5. Despliega. Abre la dirección HTTPS que entregue Render. El público entra a `/` y el equipo a `/admin`. La contraseña es la que configuraste en Render.
6. En el administrador, añade teléfono, WhatsApp, correo y enlaces reales. El disco conserva estos datos y las fotos subidas tras reiniciar o desplegar. La configuración local de `data/` no se transfiere automáticamente: vuelve a introducirla en el panel o migra ese archivo por un canal privado.

Si prefieres crear el servicio manualmente, usa **Web Service**, entorno Node, construcción `npm ci`, inicio `npm start`, `NODE_ENV=production`, `NODE_VERSION=24`, `ADMIN_PASSWORD` y `DATA_DIR=/var/data/angel-med-spa`. Añade un disco persistente montado en `/var/data`. No uses **Static Site** para este proyecto.

El acceso actual es de un solo administrador mediante contraseña: no tiene nombre de usuario, registro de clientes, recuperación de contraseña ni cuentas múltiples. Las sesiones caducan a las ocho horas y se cierran al reiniciar el servidor. Para cambiar la contraseña, cambia `ADMIN_PASSWORD` en Render y reinicia el servicio. Las solicitudes de citas se preparan para enviar al WhatsApp configurado; no son reservas confirmadas ni una agenda interna.

Documentación oficial: [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages), [Node en Render](https://render.com/docs/deploy-node-express-app), [discos persistentes](https://render.com/docs/disks) y [Blueprints](https://render.com/docs/blueprint-spec).

Un solo servidor Node.js, dos rutas dentro del mismo sitio:

- `/` — la página pública.
- `/admin` — administración con contraseña, edición de redes, contactos, textos de contacto y fotografías.

Los cambios se guardan en `data/settings.json` y aparecen en la página pública al recargar. Las fotografías se optimizan en el navegador y mantienen sus dimensiones y encuadre CSS. No se necesita descargar otro HTML para publicar cambios.

## Ejecutar

Se requiere Node.js 20 o superior. Sin dependencias externas:

**macOS/Linux:**

```bash
ADMIN_PASSWORD='coloca-una-clave-larga-y-unica' node server.js
```

**PowerShell en Windows:**

```powershell
$env:ADMIN_PASSWORD='coloca-una-clave-larga-y-unica'
node server.js
```

Abrir `http://localhost:3000` y entrar a `http://localhost:3000/admin`.

## Producción

Configurar el alojamiento para ejecutar `node server.js` con `ADMIN_PASSWORD`, `NODE_ENV=production` y almacenamiento persistente para `data/`. Exponer el servidor únicamente detrás de HTTPS (proxy inverso como Caddy o Nginx). Hacer respaldos de `data/settings.json`, pues contiene las fotos configuradas. No subir el archivo de configuración a repositorios públicos. No publicar el servidor directamente sin TLS.

El formulario de citas abre exclusivamente el WhatsApp configurado en el administrador con un mensaje preparado. El visitante debe pulsar Enviar en WhatsApp; no constituye una agenda propia. Instagram, TikTok, Google Business y reseñas requieren sus URLs reales.

## Inicio rápido en Windows

En PowerShell, dentro de la carpeta del proyecto:

```powershell
npm install
.\iniciar-windows.ps1
```

Si PowerShell impide ejecutar el script, puedes iniciar sin script:

```powershell
$env:ADMIN_PASSWORD='crea-una-clave-de-12-o-mas-caracteres'
npm start
```

**No abras los archivos HTML con doble clic**: el sitio debe ejecutarse mediante `http://localhost:3000/`.

## Diseño y administración actualizados

Servicios revisados el 3 de noviembre de 2026 exclusivamente en `@angelmedspa`. El catálogo muestra cuidado postoperatorio/drenaje linfático y faciales. Los destacados IV Therapy, Morpheus 8, Capillary y RF se conservaron como evidencia en el registro de fuentes, sin añadirlos al catálogo ni enlazarlos desde las tarjetas. Se retiraron las menciones a láser, Dermapen y microneedling por falta de evidencia verificable en la revisión. Las fuentes y límites están en `service-sources.json`.

- Sitio público en español e inglés, con fotografías WebP locales en `assets/`.
- Perfil oficial: https://www.instagram.com/angelmedspa/.
- Instagram y TikTok se muestran en una sección independiente de redes sociales. TikTok aparece al guardar su enlace oficial en `/admin` → Redes sociales. Las tarjetas de servicios no llevan a redes sociales.
- En `/admin` → Servicios: detalles y videos, edita nombre, resumen y descripción completa de cada servicio, con párrafos y traducción al inglés opcional. Agrega un enlace HTTPS de YouTube, Shorts o un archivo MP4/WebM alojado públicamente. No se suben archivos de video desde este panel. El reproductor se carga dentro de los detalles del servicio y se detiene al cerrarlos. Dejar vacío el enlace elimina el video.
- En `/admin`, configura "WhatsApp para recibir citas" con código de país y guarda. Sin ese número, la agenda muestra un aviso de indisponibilidad y no redirige a Instagram. No se almacenan reservas ni se confirman citas automáticamente.
- El acceso del equipo está en `/admin/login`, con el mismo diseño del sitio. Usa la contraseña `ADMIN_PASSWORD` definida al iniciar el servidor.
- Los originales anteriores al rediseño se conservaron en `.backups/`.

### Verificación

`node scripts/smoke-test.cjs` comprueba las rutas públicas, autenticación, bloqueo de escrituras sin sesión y guardado. Utiliza una carpeta temporal, sin modificar los datos reales. Para incluir pruebas de navegador, define `PLAYWRIGHT_MODULE` con la ruta de una instalación de Playwright y, si corresponde, `CHROMIUM_PATH` con la ruta del navegador.
