-- ============================================================
-- CMDB Icetel — Migración v7: corrige RLS de cmdb_circuitos
-- Ejecutar en: Supabase > SQL Editor. Idempotente. Archivo único.
--
-- PROBLEMA
-- cmdb_circuitos se creó en la migración v4 con las políticas originales
-- del schema: exigen rol 'authenticated' y evalúan public.cmdb_role(),
-- que lee de public.cmdb_profiles.
--
-- Pero en esta instalación la autenticación es CROSS-PROJECT: la sesión
-- vive en el proyecto DCSM y el cliente del proyecto CMDB usa la anon key
-- (supabaseClient.js -> persistSession: false). Es decir, las consultas
-- llegan a Postgres como rol 'anon', nunca como 'authenticated'. Además
-- los roles se migraron a cmdb_roles, así que cmdb_profiles está vacía y
-- cmdb_role() devuelve null.
--
-- Efecto: todo INSERT falla con
--   "new row violates row-level security policy for table cmdb_circuitos"
-- y todo SELECT devuelve cero filas sin avisar.
--
-- SOLUCIÓN
-- Dejar cmdb_circuitos con el mismo criterio que el resto de las tablas
-- de la CMDB: políticas abiertas para anon y authenticated.
--
-- NOTA DE SEGURIDAD (importante)
-- Esto no debilita el modelo respecto de las demás tablas, pero conviene
-- tenerlo claro: con políticas abiertas, cualquiera que tenga la anon key
-- puede leer y escribir. El control de admin/viewer que hace la app es
-- de interfaz, no de base de datos. Ya era así para cmdb_assets,
-- cmdb_systems y cmdb_asset_types; esta migración solo hace consistente
-- a cmdb_circuitos. Si más adelante quieres endurecerlo, el camino es
-- validar en la base el JWT del proyecto DCSM, no volver a cmdb_role().
-- ============================================================

alter table public.cmdb_circuitos enable row level security;

drop policy if exists cmdb_circuitos_read  on public.cmdb_circuitos;
drop policy if exists cmdb_circuitos_write on public.cmdb_circuitos;

create policy cmdb_circuitos_read on public.cmdb_circuitos
  for select to anon, authenticated
  using (true);

create policy cmdb_circuitos_write on public.cmdb_circuitos
  for all to anon, authenticated
  using (true)
  with check (true);

-- Privilegios de tabla (RLS filtra las filas, pero el GRANT debe existir).
grant select, insert, update, delete on public.cmdb_circuitos to anon, authenticated;

-- ------------------------------------------------------------
-- Verificación: debe listar cmdb_circuitos con roles {anon,authenticated}
-- ------------------------------------------------------------
-- select tablename, policyname, roles, cmd
--   from pg_policies
--  where schemaname = 'public' and tablename like 'cmdb_%'
--  order by tablename, policyname;
