# Despliegue de OlmedoRides

OlmedoRides es una aplicación **100% estática** (HTML + CSS + JavaScript) que usa **Supabase** como backend:
base de datos PostgreSQL, autenticación con Google, roles/RLS y almacenamiento de imágenes.

No hay servidor Node que mantener. Solo necesitas:

1. Un proyecto de Supabase.
2. Un proyecto en Google Cloud para el login con Google.
3. Un hosting estático para el frontend (Netlify o Cloudflare Pages).

---

## 1. Crear el proyecto en Supabase

1. Entra a <https://supabase.com> y crea un proyecto.
2. Espera a que termine de aprovisionarse.
3. Ve a **Project Settings > API** y copia:
   - **Project URL**
   - **anon public key**

> La `anon key` es pública y se usa en el navegador. La seguridad real la da **Row Level Security (RLS)**.
> Nunca pongas la `service_role key` en el frontend.

---

## 2. Crear la base de datos

En **Supabase Dashboard > SQL Editor**:

- Copia y ejecuta `sql/schema.sql`. Es idempotente: sirve tanto para un proyecto nuevo como para una base creada con el esquema anterior.
- `sql/migration_v2.sql` se mantiene como alternativa si prefieres una migración incremental.

Esto crea:

- `profiles`, `cars`, `drivers`, `travels`, `seats`, `bookings`
- Código único de viaje `OLM-XXXXXX`
- Asientos automáticos en L: **1 delantero derecho + 3 atrás**
- Reserva atómica con equipaje y peso estimado
- Roles y políticas RLS
- Cuenta de administrador

### Cuenta admin por defecto

| Campo | Valor |
|---|---|
| Usuario/alias | `adm!n` |
| Email real en Supabase | `admin@olmedorides.app` |
| Contraseña | `12345` |

En el login escribe `adm!n` y `12345`. El frontend traduce el alias al email real.

### Usuario de prueba por defecto

| Campo | Valor |
|---|---|
| Usuario/alias | `user` |
| Email real en Supabase | `user@olmedorides.app` |
| Contraseña | `1234` |

En el login escribe `user` y `1234`. Sirve para probar la selección de viaje, asiento y equipaje.

> **Importante:** cambia la contraseña del admin antes de publicar el proyecto. Ver sección “Seguridad”.

---

## 3. Configurar Google OAuth

### 3.1 Google Cloud

1. Entra a <https://console.cloud.google.com/>.
2. Crea un proyecto (o usa uno existente).
3. Ve a **APIs & Services > OAuth consent screen**:
   - Tipo: **External**
   - Nombre de la app: `OlmedoRides`
   - Email de soporte: tu correo
   - Guarda.
4. Ve a **APIs & Services > Credentials > Create Credentials > OAuth client ID**:
   - Application type: **Web application**
   - Name: `OlmedoRides Web`
   - **Authorized JavaScript origins**:
     - `http://localhost:3000`
     - `https://TU-SITIO.netlify.app`
     - `https://TU-PROYECTO.pages.dev`
   - **Authorized redirect URIs**:
     - `https://<PROJECT-REF>.supabase.co/auth/v1/callback`

   `<PROJECT-REF>` es el identificador de tu proyecto Supabase. Lo encuentras en la URL del dashboard:
   `https://supabase.com/dashboard/project/<PROJECT-REF>`.

5. Copia el **Client ID** y **Client Secret**.

> El redirect URI que se configura en Google es el de **Supabase**, no el de tu página.
> La página de login se configura después en Supabase.

### 3.2 Supabase Auth

1. En Supabase, ve a **Authentication > Providers > Google**.
2. Actívalo y pega el **Client ID** y **Client Secret**.
3. Guarda.
4. Ve a **Authentication > URL Configuration**:
   - **Site URL**: `https://TU-SITIO.netlify.app`
   - **Redirect URLs** (añade todas):
     - `http://localhost:3000/**`
     - `https://TU-SITIO.netlify.app/**`
     - `https://TU-PROYECTO.pages.dev/**`
     - Si usas dominio propio: `https://tudominio.com/**`

El código redirige a `pages/login.html?oauth=1&role=driver` o `role=traveler`.
Las URLs con `/**` permiten esos parámetros.

### 3.3 Email/contraseña

Si quieres seguir usando registro con correo además de Google:

- **Authentication > Providers > Email**: activado.
- **Confirm email**: opcional. Si lo activas, el usuario debe confirmar el correo antes de entrar.
- Para pruebas rápidas, puedes desactivar “Confirm email”.

---

## 4. Configurar el frontend

Edita **`js/olmedorides.js`**:

```js
export const CONFIG = {
    supabaseUrl: 'https://TU-PROYECTO.supabase.co',
    supabaseAnonKey: 'TU_ANON_KEY',

    adminAlias: 'adm!n',
    adminEmail: 'admin@olmedorides.app'
};
```

No cambies `adminEmail` salvo que también cambies la cuenta creada en el SQL.

---

## 5. Probar en local

No abras los HTML con doble clic (`file://`). Google OAuth necesita HTTP/HTTPS.

```bash
# Opción 1: Node
npx serve . -l 3000

# Opción 2: Python
python -m http.server 3000
```

Abre: <http://localhost:3000/pages/login.html>

> Si todavía no tienes Supabase, la app arranca en **modo demo local** con datos de ejemplo en `localStorage`.
> En el login verás botones para entrar como Administrador, Secretaria, Conductor o Usuario de prueba (`user` / `1234`).
> Para volver a Supabase real, configura `js/olmedorides.js` o abre `login.html?demo=0`.

Prueba:

1. Login admin: `adm!n` / `12345`.
2. Crear un vehículo con imagen.
3. Crear un viaje **sin conductor**.
4. Verificar que se crearon 4 asientos y el código `OLM-XXXXXX`.
5. Registrarte con Google como conductor en otra ventana/incógnito.
6. Tomar el viaje desde “Viajes disponibles”.
7. Registrarte con Google como usuario.
8. Reservar un asiento, confirmar equipaje y peso.
9. Ver la reserva en “Mis Reservas” y cancelarla.

---

## 6. Desplegar en Netlify (recomendado)

### Opción A: arrastrar y soltar

1. Entra a <https://app.netlify.com/drop>.
2. Arrastra **solo** estos elementos (no la raíz completa, para no publicar `sql/`):
   - `index.html`
   - `css/`
   - `js/`
   - `pages/`
3. Netlify te da una URL `https://algo-random.netlify.app`.
4. Copia esa URL y agrégala en:
   - Supabase **Site URL** y **Redirect URLs**.
   - Google Cloud **Authorized JavaScript origins**.
5. Vuelve a probar el login con Google.

> Si tu carpeta está dentro de OneDrive y `npm run build` se queda colgado por el bloqueo de archivos,
> usa el despliegue por Git (Opción B) o mueve el proyecto fuera de OneDrive para ejecutar el build local.

### Opción B: desde Git

1. Sube el proyecto a GitHub/GitLab.
2. En Netlify: **Add new site > Import an existing project**.
3. Configuración:
   - **Build command**: `node scripts/build.mjs` (o `npm run build`)
   - **Publish directory**: `dist`
4. Deploy.

El archivo `netlify.toml` ya incluye esa configuración y las cabeceras de seguridad.
El build solo copia `index.html`, `css/`, `js/`, `pages/` y `_headers` a `dist/`.

### Dominio propio

1. Netlify > **Domain management > Add domain**.
2. Configura el DNS que te indique Netlify.
3. Agrega el dominio en Supabase y Google Cloud.
4. Actualiza `Site URL` en Supabase.

---

## 7. Desplegar en Cloudflare Pages

1. Entra a <https://dash.cloudflare.com/> > **Workers & Pages > Create > Pages**.
2. Conecta tu repositorio.
3. Configuración:
   - **Framework preset**: None
   - **Build command**: `node scripts/build.mjs` (o `npm run build`)
   - **Build output directory**: `dist`
4. Deploy.
5. Agrega la URL `https://TU-PROYECTO.pages.dev` en Supabase y Google Cloud.

El archivo `_headers` se copia a `dist/` y Cloudflare Pages lo aplica automáticamente.
También puedes desplegar por consola:

```bash
npm run build
npx wrangler pages deploy dist --project-name olmedorides
```

---

## 8. Imágenes de conductores y vehículos

La aplicación guarda **URLs públicas** de imágenes (no archivos binarios en la base de datos).

### Opción recomendada: Supabase Storage

1. Supabase > **Storage > New bucket**.
2. Nombre: `travel-images`.
3. Activa **Public bucket**.
4. Sube las fotos.
5. Abre cada archivo y copia su **Public URL**.
6. Pega esa URL en:
   - Formulario de viaje: “Imagen del conductor” / “Imagen del vehículo”.
   - Formulario de conductor: “Imagen del conductor”.
   - Formulario de vehículo: “Imagen del vehículo”.
   - Perfil del usuario/conductor: “Foto de perfil”.

También puedes usar Cloudinary, Imgur o cualquier URL HTTPS pública.

---

## 9. Seguridad antes de publicar

1. **Cambia la contraseña del admin.**

   Desde Supabase Dashboard > **Authentication > Users**, busca `admin@olmedorides.app` y usa la opción de cambiar contraseña.

   O por SQL:

   ```sql
   UPDATE auth.users
   SET encrypted_password = crypt('TU_NUEVA_CONTRASEÑA', gen_salt('bf')),
       updated_at = now()
   WHERE email = 'admin@olmedorides.app';
   ```

2. **No muestres las credenciales admin en producción.** El login tiene una nota con `adm!n / 12345`; quítala cuando cambies la contraseña.

3. **Revisa las políticas RLS** en Supabase > Authentication > Policies. Las funciones `is_admin()` e `is_staff()` son `SECURITY DEFINER` para evitar recursión.

4. **Activa Confirm email** si vas a permitir registro con correo.

5. **Usa HTTPS siempre.** Google OAuth no funciona bien desde `file://`.

6. **No subas la `service_role key`** al frontend ni a GitHub.

---

## 10. Checklist de pruebas

- [ ] Admin entra con `adm!n` / `12345`.
- [ ] Usuario de prueba entra con `user` / `1234`.
- [ ] Admin crea vehículo con imagen.
- [ ] Admin crea viaje con origen, destino, ruta, tiempo promedio, notas y código único.
- [ ] El viaje se crea sin conductor y aparecen 4 asientos en L.
- [ ] Conductor entra con Google, ve viajes disponibles y toma uno.
- [ ] El viaje tomado aparece en “Mis viajes asignados”.
- [ ] Usuario entra con Google y solo ve viajes con asientos libres.
- [ ] Usuario reserva asiento, confirma equipaje y peso.
- [ ] El mapa muestra la silueta aérea del vehículo con A1–A4 y su precio.
- [ ] Un asiento ocupado se deshabilita y deja de estar disponible.
- [ ] El usuario elige recogida en su ubicación actual o marca otra en el mapa.
- [ ] El conductor ve estadísticas, historial y botones Empezar/Terminar.
- [ ] Empezar/Terminar guarda timestamp y ubicación.
- [ ] El sidebar se abre y cierra en móvil/tablet.
- [ ] El dashboard de ganancias suma el precio del asiento reservado.
- [ ] Se puede crear un viaje con precio único o precio individual por asiento.
- [ ] La reserva aparece con código de viaje, asiento, equipaje y peso.
- [ ] Usuario cancela y el asiento vuelve a estar libre.
- [ ] Admin cambia el rol de un usuario a Secretaria.
- [ ] Secretaria puede ver y crear viajes, pero no administrar roles.
- [ ] Un usuario normal no puede abrir `users.html` ni `travels.html`.

---

## 11. Problemas comunes

| Error | Causa / solución |
|---|---|
| `redirect_uri_mismatch` | En Google Cloud el redirect URI debe ser `https://<ref>.supabase.co/auth/v1/callback`, no la URL de tu app. |
| `Unsupported provider: provider is not enabled` | Activa Google en Supabase > Authentication > Providers. |
| `Failed to fetch` | URL o anon key incorrectas, o el proyecto Supabase está pausado. |
| Vuelve al login pero sin sesión | Falta la URL de tu dominio en Supabase Redirect URLs. Usa `https://tu-sitio/**`. |
| `new row violates row-level security policy` | El usuario no tiene el rol necesario o el SQL de políticas no se ejecutó. |
| `column travel_code does not exist` | Ejecuta `sql/migration_v2.sql` o el `schema.sql` actualizado. |
| `Could not find the function public.book_seat` | Falta ejecutar la migración/esquema actualizado. |
| El admin no puede entrar | Verifica que ejecutaste el bloque de creación de admin del SQL y que el email es `admin@olmedorides.app`. |
| El proyecto Supabase “se durmió” | El plan gratuito pausa proyectos inactivos. Abre el dashboard o pasa a un plan pago. |
| Las imágenes no se ven | La URL debe ser pública, HTTPS y accesible desde el navegador. |

---

## 12. Estructura de hosting

```
Usuario
   │
   ▼
Netlify / Cloudflare Pages  (HTML, CSS, JS)
   │  Supabase JS (HTTPS)
   ▼
Supabase
   ├── Auth (Google + email)
   ├── PostgreSQL + RLS
   └── Storage (imágenes públicas)
```

No hay backend propio. El navegador habla directamente con Supabase usando la `anon key`, y RLS decide qué puede leer o escribir cada rol.
