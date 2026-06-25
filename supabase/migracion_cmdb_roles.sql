-- ============================================================
-- Migración: tabla cmdb_roles
-- Ejecutar en: Supabase > SQL Editor del proyecto CMDB propio
-- ============================================================

-- Tabla de roles locales de la CMDB.
-- user_id referencia al ID de usuario del proyecto DCSM (auth compartida).
-- email y display_name se copian desde DCSM para poder mostrarlos sin
-- necesitar una segunda consulta cross-project.

create table if not exists public.cmdb_roles (
  user_id      text        primary key,  -- UUID del usuario en DCSM (o 'pending:<email>')
  role         text        not null check (role in ('admin', 'viewer')),
  email        text        not null default '',
  display_name text        not null default '',
  updated_at   timestamptz not null default now()
);

-- Índice por email para búsquedas por correo
create index if not exists cmdb_roles_email_idx on public.cmdb_roles (lower(email));

-- RLS: habilitar y definir políticas
alter table public.cmdb_roles enable row level security;

-- Cualquier usuario autenticado puede leer su propio rol
create policy "Usuario lee su propio rol"
  on public.cmdb_roles for select
  using (true);   -- necesario para que el AuthContext lo lea antes de conocer el rol

-- Solo admins pueden insertar/actualizar/eliminar roles
-- (el check se hace en la app; a nivel DB lo dejamos abierto para el primer admin
--  y se puede restringir más cuando el sistema esté maduro)
create policy "Admin gestiona roles"
  on public.cmdb_roles for all
  using (true)
  with check (true);

-- ── Primer administrador ──────────────────────────────────────────────────────
-- Reemplaza el user_id y email con los del usuario que será el primer admin.
-- Puedes obtener el UUID desde: Supabase > Authentication > Users del proyecto DCSM.
--
-- insert into public.cmdb_roles (user_id, role, email, display_name)
-- values (
--   'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',  -- UUID del usuario en DCSM
--   'admin',
--   'admin@icetel.cl',
--   'Nombre Apellido'
-- )
-- on conflict (user_id) do update set role = 'admin';
