# Contexto del proyecto: plataforma CMDB Icetel

> Pega este contenido al inicio de un chat nuevo para retomar el proyecto.
> Antes de proponer cambios, conéctate a la carpeta del proyecto y LEE el código
> actual — esa carpeta es la fuente de la verdad.

## Qué es
CMDB (Configuration Management Database): base de activos de infraestructura de
misión crítica de un datacenter. Portal web protegido por login. Es la fuente de
activos para la otra plataforma (ITSM).

## Stack
React + Vite + Supabase (cliente JS). Archivos `.jsx` (sin TypeScript).
SheetJS se carga desde CDN para importar/exportar Excel.

## Dónde está el código (usar SIEMPRE esta carpeta: es la última versión, igual a GitHub)
- Carpeta local: `C:\Users\felip\OneDrive\Documentos\Cowork proyectos\cmdb-latest`
- Repo GitHub: https://github.com/AerialMeister/cmdb-icetel (rama `main`)
- Publicado en: https://aerialmeister.github.io/cmdb-icetel/ (deploy automático con GitHub Actions al hacer push a `main`)
- IMPORTANTE: NO usar la carpeta vieja `cmdb-icetel` (quedó desfasada) ni `CMDB` (basura).

## Supabase (mismo proyecto que el ITSM)
- Project ref: `fkjxfdjtyaspxbqatbox` · URL: https://fkjxfdjtyaspxbqatbox.supabase.co
- Credenciales (`VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`) en el archivo `.env` local y como secrets del repo en GitHub.
- Tablas con prefijo `cmdb_`. RLS activado. Roles: admin / editor / viewer (tabla `cmdb_profiles`). Admin: farredondo@icetel.cl. Registro público desactivado.
- Modelo: `cmdb_systems` (sistemas) → `cmdb_asset_types` (tipos) → `cmdb_field_defs`
  (campos dinámicos por tipo) → `cmdb_assets` (activos: `id` uuid estable, `name`,
  `alt_name`, `status` on/off, `data` jsonb). Integración con ITSM vía funciones
  `cmdb_asset_name` / `cmdb_buscar_activos` / `cmdb_asset_names` y vista `cmdb_assets_lookup`.
- Los scripts SQL están en la carpeta `supabase/` (schema.sql, seed.sql, migraciones).
  Los cambios de BD se ejecutan en Supabase > SQL Editor.

## Estado actual
- Sistemas: Eléctrico (Banco de batería, Celda MT, Grupo Electrógeno, Planta CC,
  Tablero Eléctrico, Transformador MT, UPS), Mecánico (ACU, AHC, Bomba de agua,
  Chiller, Estanque de combustible, Torre de enfriamiento), Arquitectónico.
- Ya hay ~556 activos cargados.
- Funciones existentes: login y roles, navegación sistemas→tipos→activos, tarjetas
  de tipo con ícono y conteo ON/OFF, campos dinámicos por tipo, ficha de activo con
  ilustración SVG, nombre alternativo y subtipo, importar/exportar Excel, buscador global.
- PENDIENTE CONOCIDO: la gestión de usuarios (pestaña "Usuarios") usa una Edge Function
  `admin-users` que puede NO estar desplegada (da error "Failed to send a request to
  the Edge Function"). El código está en `supabase/functions/admin-users/index.ts`;
  hay que desplegarla en Supabase.

## Cómo probar y publicar cambios
- Probar local: en la carpeta `cmdb-latest`, `npm install` (solo la 1ª vez) y
  `npm run dev` (http://localhost:5173).
- Publicar: `git add .` → `git commit -m "..."` → `git push` → se despliega solo.
  Ver el resultado en la pestaña **Actions** del repo (verde = publicado).

## Lo que quiero ahora
_[describe aquí el cambio o mejora que quieres]_
