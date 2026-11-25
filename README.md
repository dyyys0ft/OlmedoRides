# OlmedoRides

Sistema de gestión de viajes interurbanos con autenticación por Google, roles, reserva visual de asientos y control de equipaje.

Construido con **HTML + CSS + JavaScript vanilla** y **Supabase** (PostgreSQL, Auth, RLS y Storage).

---

## 🎨 Marca

- **Nombre:** OlmedoRides
- **Colores:** `#236b55`, `#f3f6f1`, `#ffffff`
- **Tipografía:** IBM Plex Sans
- **Responsive:** desktop 13", 14", 15", 21", 24" y 27"; iPhone 14, 14 Pro Max, 17; iPad 9.7", 10" y 12.9"+

---

## 👥 Roles y permisos

| Rol | Cómo entra | Puede hacer |
|---|---|---|
| **Administrador** | Alias `adm!n` + contraseña `12345` | Todo: viajes, vehículos, conductores, reservas y gestión de roles |
| **Secretaria** | Google o correo (rol asignado por admin) | Ver y crear/editar viajes, vehículos, conductores y reservas |
| **Conductor** | Se registra con Google como conductor | Ver viajes disponibles, tomar uno como conductor y ver pasajeros/equipaje |
| **Usuario / Pasajero** | Se registra con Google como usuario | Buscar viajes con asientos libres, reservar asiento, confirmar equipaje y peso |

> El admin puede convertir a cualquier usuario en Secretaria o Administrador desde **Usuarios y roles**.

---

## ✨ Funcionalidades

### Autenticación

- Login con **Google** (Supabase OAuth).
- Registro con Google eligiendo **Conductor** o **Usuario**.
- Registro alternativo con correo/contraseña.
- Recuperación y cambio de contraseña.
- Login especial de administrador con alias `adm!n` y contraseña `12345`.
- Usuario de prueba con alias `user` y contraseña `1234`.

### Ecuador y moneda

- Ciudades de **Ecuador** en los selectores de origen y destino.
- Opción **“Otro”** para escribir una ciudad que no esté en la lista.
- Precios y ganancias en **USD ($)**.

### Viajes

Cada viaje incluye:

- Código único automático: `OLM-XXXXXX`
- Origen y destino (ciudades de Ecuador o “Otro”)
- Ruta
- Tiempo promedio (minutos)
- Fecha/hora de salida y llegada estimada
- Conductor (opcional al crear; un conductor puede tomarlo)
- Vehículo
- Notas
- Imagen del conductor (tomada del perfil del conductor)
- Imagen del vehículo (tomada del vehículo)
- Precio por asiento: único para todos o **individual por asiento**
- Estado: programado, en curso, completado, cancelado

### Asientos A1–A4 y vista aérea

```
              [Conductor]   [A1]   ← delantero derecho
              [A2] [A3] [A4]        ← fila trasera
```

- **A1:** delantero derecho
- **A2:** atrás izquierda
- **A3:** atrás centro
- **A4:** atrás derecha

Al elegir un viaje se muestra una **vista aérea amigable del vehículo** (carrocería, parabrisas,
ventanas, faros, espejos y maletero) con **siluetas de asiento**. Cada asiento muestra:
- Su número: **A1, A2, A3, A4**
- Su precio en USD
- Su estado: libre, reservado u ocupado

Los asientos ocupados se deshabilitan automáticamente y la vista se actualiza cada pocos segundos
para reflejar reservas de otros usuarios.

### Recogida del pasajero

Al reservar, el usuario elige:
- **En su ubicación actual:** se capturan sus coordenadas.
- **En otra ubicación:** marca el punto exacto en un mapa interactivo (OpenStreetMap/Leaflet)
  y puede agregar una referencia.

El conductor ve la ubicación de recogida de cada pasajero y un enlace al mapa.

### Precios por asiento

En el formulario de viaje puedes elegir:

- **Mismo precio para todos los asientos**, o
- **Precio individual** para A1, A2, A3 y A4.

La reserva cobra el precio del asiento seleccionado, no un precio genérico.

### Dashboard de ganancias

El dashboard de admin/secretaria incluye:

- Ingresos generados
- Ingresos de reservas confirmadas
- Pendiente de cobro
- Ticket promedio
- Ganancias por viaje con barra de participación

### Reservas

- Solo se muestran viajes con al menos un asiento libre.
- El pasajero elige un asiento en el mapa visual.
- Confirma si lleva equipaje y declara el **peso estimado en kg**.
- La reserva se crea de forma atómica con una función RPC (`book_seat`), evitando dobles reservas.
- Código de reserva único: `OLM-XXXXXXXX`.
- El pasajero puede cancelar y el asiento se libera.
- El conductor ve pasajeros, asientos, equipaje, peso y precio.

### Conductor

- Ve los viajes publicados sin conductor.
- Pulsa **“Ser conductor”** y el viaje se asigna automáticamente.
- Tiene un panel de estadísticas: viajes asignados, completados, en curso y pasajeros.
- Tiene pestañas de **viajes activos** e **historial** de viajes pasados.
- Al iniciar o terminar un viaje captura:
  - Fecha y hora (timestamp)
  - Ubicación (latitud/longitud)
- Puede ver el detalle de pasajeros, equipaje, peso, precio y punto de recogida.

### Administración de roles

- Página `pages/users.html` solo para admin.
- Cambia entre: Usuario, Conductor, Secretaria, Administrador.
- Al convertir a alguien en Conductor se crea su perfil en `drivers`.

---

## 🗂️ Estructura del proyecto

```
OlmedoRides/
├── index.html
├── package.json              # Scripts de build/dev
├── netlify.toml              # Configuración Netlify
├── wrangler.toml             # Configuración Cloudflare Pages
├── _headers                  # Cabeceras de seguridad Cloudflare Pages
├── DEPLOYMENT.md             # Guía paso a paso de despliegue
├── scripts/
│   └── build.mjs             # Copia solo el frontend público a dist/
├── css/
│   └── style.css
├── js/
│   ├── olmedorides.js        # Cliente Supabase + helpers + CONFIG
│   └── app.js                # Utilidades legacy (no usadas por las páginas)
├── pages/
│   ├── login.html
│   ├── register.html
│   ├── forgot-password.html
│   ├── reset-password.html
│   ├── unauthorized.html
│   ├── dashboard.html        # Admin / Secretaria
│   ├── travels.html          # CRUD de viajes
│   ├── cars.html             # CRUD de vehículos
│   ├── drivers.html          # CRUD de conductores
│   ├── bookings.html         # Todas las reservas
│   ├── users.html            # Roles (solo admin)
│   ├── my-travels.html       # Conductor / Usuario
│   ├── my-bookings.html      # Reservas del usuario
│   ├── available-travels.html# Buscar y reservar
│   └── profile.html
└── sql/
    ├── schema.sql            # Esquema completo desde cero
    └── migration_v2.sql      # Migración para bases existentes
```

---

## 🚀 Inicio rápido

### 1. Supabase

1. Crea un proyecto en <https://supabase.com>.
2. Copia **Project URL** y **anon public key**.
3. En **SQL Editor**, ejecuta `sql/schema.sql` (es idempotente y también actualiza bases existentes).
   Si prefieres una migración incremental, usa `sql/migration_v2.sql`.

### 2. Configuración

Edita `js/olmedorides.js`:

```js
export const CONFIG = {
    supabaseUrl: 'https://TU-PROYECTO.supabase.co',
    supabaseAnonKey: 'TU_ANON_KEY',
    adminAlias: 'adm!n',
    adminEmail: 'admin@olmedorides.app'
};
```

### 3. Google OAuth

Sigue la guía completa en **[DEPLOYMENT.md](DEPLOYMENT.md)**. Resumen:

- Google Cloud → OAuth Client ID (Web).
- Redirect URI de Google: `https://<ref>.supabase.co/auth/v1/callback`.
- Supabase → Authentication → Providers → Google.
- Supabase → URL Configuration → Site URL + Redirect URLs de tu dominio.

### 4. Ejecutar en local

```bash
npx serve . -l 3000
# o
python -m http.server 3000
```

Abre <http://localhost:3000/pages/login.html>.

> No uses `file://`: Google OAuth requiere HTTP/HTTPS.

### 5. Login admin

- Usuario: `adm!n`
- Contraseña: `12345`

Cambia la contraseña antes de publicar.

---

## 🧪 Modo demo local (sin Supabase)

Si `js/olmedorides.js` mantiene las credenciales de ejemplo, la app arranca automáticamente en **modo demo local**:

- No usa Supabase ni internet.
- Los datos se guardan en `localStorage` del navegador.
- Hay 4 cuentas demo listas:

| Rol | Usuario / email demo | Contraseña | Entra desde |
|---|---|---|---|
| Administrador | `admin@olmedorides.app` | `12345` | Botón “Administrador” |
| Secretaria | `secretaria@olmedorides.app` | `12345` | Botón “Secretaria” |
| Conductor | `conductor@olmedorides.app` | `12345` | Botón “Conductor” |
| Usuario de prueba | `user@olmedorides.app` | `1234` | Botón “Usuario (user/1234)” |

En el login verás un panel **Modo demo local** con botones para entrar como cada rol.
También puedes usar el formulario con `adm!n` / `12345` o `user` / `1234`.

- **Reiniciar datos demo:** borra los cambios y vuelve a crear los viajes, asientos y reservas de ejemplo.
- **Cambiar de rol:** cierra sesión y elige otro botón demo.
- **Forzar demo con Supabase configurado:** abre `login.html?demo=1`.
- **Volver a Supabase real:** abre `login.html?demo=0` o borra `olmedorides_demo_mode` de `localStorage`.

> El modo demo es solo para probar la interfaz y los flujos. No sustituye a Supabase para producción.

---

## 🗄️ Base de datos

| Tabla | Descripción |
|---|---|
| `profiles` | Usuarios, rol, teléfono, avatar |
| `cars` | Vehículos, placa, plazas, imagen |
| `drivers` | Datos de conductor, licencia, foto, vehículo |
| `travels` | Viajes, código único, ruta, tiempo promedio, timestamps y ubicación de inicio/fin |
| `seats` | 4 asientos por viaje con posición, precio, equipaje y peso |
| `bookings` | Reservas, referencia, equipaje, peso, pago y punto de recogida |

### Funciones y triggers principales

- `handle_new_user` → crea perfil automáticamente desde Google/correo.
- `protect_profile_role` → impide que un usuario se autoasigne admin/secretaria.
- `complete_registration` → registra un usuario de Google como conductor o usuario.
- `admin_set_role` → el admin cambia roles y crea perfil de conductor.
- `set_travel_code` → genera `OLM-XXXXXX`.
- `create_seats_for_travel` → crea los 4 asientos en L.
- `claim_travel` → un conductor toma un viaje libre.
- `start_travel` → inicia el viaje con timestamp y ubicación.
- `finish_travel` → termina el viaje con timestamp y ubicación.
- `book_seat` → reserva atómica con equipaje, peso y punto de recogida.
- `cancel_booking` → cancela y libera el asiento.

### RLS

- Todos los usuarios autenticados pueden leer viajes, asientos y perfiles necesarios.
- Solo admin/secretaria crean o editan viajes, vehículos, conductores y reservas.
- Cada pasajero solo ve y cancela sus propias reservas.
- Solo admin cambia roles.
- Las funciones sensibles son `SECURITY DEFINER` con validaciones dentro.

---

## 🌐 Hosting

El frontend es estático. Puedes desplegarlo gratis en:

- **Netlify** (recomendado, ya incluye `netlify.toml`)
- **Cloudflare Pages** (ya incluye `_headers` y `wrangler.toml`)
- Vercel
- GitHub Pages

El comando `npm run build` genera la carpeta `dist/` con **solo** el frontend público
(`index.html`, `css/`, `js/`, `pages/` y `_headers`), sin exponer `sql/` ni la documentación.

```bash
npm run build
# publica dist/ en Netlify o Cloudflare Pages
```

> Si el proyecto está dentro de OneDrive y `npm run build` se queda colgado por el bloqueo de archivos,
> usa el despliegue por Git (Netlify/Cloudflare ejecutan el build en Linux) o mueve el proyecto fuera de OneDrive.

Guía detallada: **[DEPLOYMENT.md](DEPLOYMENT.md)**

---

## 🖼️ Imágenes

La app guarda URLs públicas. Recomendado:

1. Supabase → **Storage** → crear bucket público `travel-images`.
2. Subir fotos de conductores y vehículos.
3. Copiar la **Public URL**.
4. Pegarla en los formularios de conductor, vehículo o perfil.

---

## 🔒 Seguridad

- RLS activo en todas las tablas.
- La `anon key` es pública; la seguridad está en RLS.
- Nunca subas la `service_role key` al frontend.
- Cambia la contraseña del admin antes de publicar.
- Usa HTTPS.
- Revisa las Redirect URLs de Supabase y Google.

---

## 🧪 Flujo típico

1. **Admin** crea vehículos con imagen.
2. **Admin o Secretaria** crea un viaje sin conductor, con ruta, tiempo promedio y notas.
3. El sistema genera el código `OLM-XXXXXX` y los 4 asientos en L.
4. **Conductor** entra con Google, ve el viaje disponible y pulsa "Ser conductor".
5. **Usuario** entra con Google, busca el viaje, elige asiento, confirma equipaje/peso y punto de recogida.
6. **Conductor** inicia el viaje (timestamp + ubicación), ve pasajeros y puntos de recogida.
7. **Conductor** termina el viaje (timestamp + ubicación) y el viaje pasa al historial.
8. El usuario puede cancelar y liberar el asiento.

---

## 🐛 Troubleshooting

Consulta la tabla de problemas comunes en **[DEPLOYMENT.md](DEPLOYMENT.md#11-problemas-comunes)**.

Errores frecuentes:

- `redirect_uri_mismatch` → revisa el callback de Google.
- `Unsupported provider` → activa Google en Supabase.
- `Failed to fetch` → URL/anon key incorrectas o proyecto pausado.
- `column travel_code does not exist` → ejecuta la migración.
- `Could not find function book_seat` → ejecuta el SQL actualizado.

---

## 📄 Licencia

MIT License. Libre para uso personal y comercial.
