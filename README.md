# CMDB Icetel

Base de datos de activos de infraestructura de misión crítica (Datacenter).
Portal protegido por login que sirve de fuente única de activos para el ITSM.

Stack: **React + Vite + Supabase** (mismo proyecto Supabase que el ITSM).

---

## 1. Configurar la base de datos (Supabase)

En tu proyecto Supabase (el mismo del ITSM):

Ejecuta los SQL **en este orden** en el SQL Editor:

1. `supabase/schema.sql` — tablas `cmdb_*`, roles, RLS, triggers y funciones de integración.
2. `supabase/seed.sql` — sistemas y tipos base.
3. `supabase/migracion_v2_nombre_alt_subtipo.sql` — agrega "Nombre alternativo" y "Subtipo".
4. `supabase/migracion_v3_categorias.sql` — estructura final de categorías
   (Eléctrico: Banco de batería, Celda MT, Grupo Electrógeno, Planta CC, Tablero Eléctrico,
   Transformador MT, UPS · Mecánico: ACU, AHC, Bomba de agua, Chiller, Estanque de combustible,
   Torre de enfriamiento). Todas las migraciones son idempotentes.

### Crear el administrador inicial

1. **Authentication → Users → Add user**.
2. Email: `farredondo@icetel.cl`, define una contraseña y marca *Auto Confirm User*.
3. Listo: un trigger crea su perfil y le asigna automáticamente el rol **admin**
   (porque el correo coincide). El resto de cuentas se crean desde el propio portal.

### Cerrar el registro público (importante: la página es pública)

En **Authentication → Providers → Email**, desactiva *"Enable sign-ups"*.
Así nadie puede auto-registrarse; las cuentas solo las crea el administrador
desde la pestaña **Usuarios** del portal.

---

## 2. Desplegar la Edge Function de gestión de usuarios

La creación/edición/borrado/reseteo de cuentas usa el `service_role`, que **nunca**
va en el navegador. Por eso vive en una Edge Function protegida por rol admin.

```bash
# requiere Supabase CLI y haber hecho 'supabase login'
supabase link --project-ref TU_PROJECT_REF
supabase functions deploy admin-users
```

Las variables `SUPABASE_URL`, `SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY`
las inyecta Supabase automáticamente en las funciones; no hay que configurarlas a mano.

> Si no despliegas la función, todo el resto del portal funciona; solo la pestaña
> **Usuarios** mostrará un aviso al intentar listar/crear cuentas.

---

## 3. Configurar y correr el frontend

```bash
cp .env.example .env     # y completa con los datos de Supabase (Project Settings → API)
npm install
npm run dev              # desarrollo
npm run build            # producción (genera dist/)
```

`.env`:

```
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-public-key
```

### Deploy a GitHub Pages
El workflow `.github/workflows/deploy.yml` ya está listo (igual que el ITSM).
Define en el repo los *secrets* `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`
y haz push a `main`.

---

## 4. Modelo de datos

```
cmdb_systems        (categorías: Eléctrico, Mecánico, Arquitectónico…)
  └─ cmdb_asset_types   (UPS, Grupos Electrógenos, Climatización…)
       ├─ cmdb_field_defs  (campos dinámicos del tipo: marca, modelo, ubicación…)
       └─ cmdb_assets      (los activos; data jsonb con los valores de los campos)
cmdb_profiles       (usuarios + rol: admin | editor | viewer)
```

- **Nombre** y **ON/OFF** son columnas propias del activo.
- El resto de campos son **dinámicos** (`cmdb_field_defs` + `data` jsonb): puedes
  **agregar más campos** a cualquier tipo desde el botón *Campos*, y crear
  **sistemas** y **tipos** nuevos desde la interfaz.
- La ilustración de **Climatización** cambia según el campo `tipo`:
  `CRAC`/`CRAH` → equipo de precisión; `HVAC` → split.

### Carga masiva desde Excel

En la vista **Sistemas**, el botón **Importar Excel** permite cargar activos en lote
usando la plantilla `carga/Plantilla_Carga_CMDB_Icetel.xlsx`:

- Cada hoja del Excel corresponde a un **tipo de activo** (se asocia por su nombre).
- La columna **Nombre** es obligatoria; las filas sin nombre se ignoran.
- `Estado (ON/OFF)` acepta ON/OFF; en Climatización, `Tipo` acepta CRAC/CRAH/HVAC.
- Las columnas que no coincidan con un campo del tipo se ignoran (se muestran en la previsualización).
- La importación **crea** activos nuevos con su ID único; no actualiza los existentes.

Si agregas campos a un tipo desde la app, vuelve a generar/ajustar la plantilla con esas columnas.

### ID estable para el ITSM

Cada activo tiene un **UUID inmutable** (`cmdb_assets.id`). El ITSM debe guardar ese
UUID, no el nombre. Si cambias el nombre del activo, el ID no cambia y el ITSM seguirá
mostrando el nombre actualizado al consultarlo.

Funciones expuestas para el ITSM (accesibles con la anon key, acotadas):

| Función | Uso desde el ITSM |
|---|---|
| `cmdb_asset_name(uuid)` | Devuelve el nombre actual de un activo dado su ID. |
| `cmdb_buscar_activos(text)` | Busca activos (id, nombre, tipo, sistema) para selectores. |
| vista `cmdb_assets_lookup` | Lectura completa para usuarios autenticados. |

Ejemplo desde el cliente del ITSM:

```js
// resolver el nombre actual de un activo
const { data } = await supabase.rpc('cmdb_asset_name', { p_id: activoId })

// selector de activos al crear un ticket
const { data } = await supabase.rpc('cmdb_buscar_activos', { p_query: texto })
```

> Migración sugerida en el ITSM: agregar columna `activo_id uuid` a `tickets` y
> usarla en vez del texto libre `activo`, resolviendo el nombre con las funciones de arriba.

---

## 5. Seguridad (página pública)

- Todo el acceso exige **usuario autenticado** (Supabase Auth).
- **RLS** activado en todas las tablas, con permisos por rol:
  - `viewer`: solo lectura. `editor`: lectura + escritura de activos/estructura. `admin`: todo + usuarios.
- El `service_role` solo se usa en la Edge Function del servidor, jamás en el navegador.
- Registro público **deshabilitado**: las cuentas las crea el administrador.

## 6. Roles

| Rol | Ver activos | Crear/editar activos y estructura | Gestionar usuarios |
|---|:---:|:---:|:---:|
| admin | ✅ | ✅ | ✅ |
| editor | ✅ | ✅ | — |
| viewer | ✅ | — | — |
