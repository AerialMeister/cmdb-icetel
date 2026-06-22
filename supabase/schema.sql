-- ============================================================
-- CMDB Icetel - Esquema de base de datos para Supabase
-- Base de activos de infraestructura de misión crítica (Datacenter).
-- Convive en el MISMO proyecto Supabase que el ITSM (prefijo cmdb_).
-- Ejecutar en: Supabase > SQL Editor > New query > Run
-- ============================================================

create extension if not exists "pgcrypto";

-- ============================================================
-- 1. PERFILES Y ROLES
-- Cada perfil se enlaza 1:1 con un usuario de Supabase Auth.
-- Roles: admin (todo + gestión de usuarios), editor (CRUD activos),
--        viewer (solo lectura).
-- ============================================================
do $$
begin
  if not exists (select 1 from pg_type where typname = 'cmdb_rol') then
    create type cmdb_rol as enum ('admin', 'editor', 'viewer');
  end if;
end$$;

create table if not exists public.cmdb_profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text,
  role        cmdb_rol not null default 'viewer',
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Devuelve el rol del usuario autenticado (security definer evita recursión en RLS).
create or replace function public.cmdb_role()
returns cmdb_rol
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.cmdb_profiles
  where id = auth.uid() and active = true;
$$;

-- Bootstrap: al crear un usuario en Auth se genera su perfil.
-- El correo del administrador inicial queda como 'admin' automáticamente.
create or replace function public.cmdb_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.cmdb_profiles (id, email, full_name, role, active)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    case when lower(new.email) = 'farredondo@icetel.cl' then 'admin'::cmdb_rol
         else 'viewer'::cmdb_rol end,
    true
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_cmdb_new_user on auth.users;
create trigger trg_cmdb_new_user
  after insert on auth.users
  for each row execute function public.cmdb_handle_new_user();

-- ============================================================
-- 2. SISTEMAS (categorías)  ->  TIPOS  ->  CAMPOS  ->  ACTIVOS
-- ============================================================

-- 2.1 Sistemas / categorías (Eléctrico, Mecánico, Arquitectónico, ...)
create table if not exists public.cmdb_systems (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  description text,
  icon        text default 'sistema',     -- clave de ícono en el frontend
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 2.2 Tipos de activo dentro de un sistema (UPS, Grupos Electrógenos, ...)
create table if not exists public.cmdb_asset_types (
  id            uuid primary key default gen_random_uuid(),
  system_id     uuid not null references public.cmdb_systems(id) on delete cascade,
  name          text not null,
  slug          text not null,
  description   text,
  -- clave de ilustración SVG: ups | genset | planta_cc | tablero | clima | bomba | generic
  illustration  text not null default 'generic',
  sort_order    int  not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (system_id, slug)
);

-- 2.3 Definición de campos por tipo de activo (esquema dinámico).
--     Permite "agregar más campos" sin tocar la base.
do $$
begin
  if not exists (select 1 from pg_type where typname = 'cmdb_field_type') then
    create type cmdb_field_type as enum ('text', 'number', 'boolean', 'select');
  end if;
end$$;

create table if not exists public.cmdb_field_defs (
  id             uuid primary key default gen_random_uuid(),
  asset_type_id  uuid not null references public.cmdb_asset_types(id) on delete cascade,
  key            text not null,                 -- clave estable en el jsonb 'data'
  label          text not null,                 -- etiqueta visible
  field_type     cmdb_field_type not null default 'text',
  options        jsonb,                          -- opciones para field_type = 'select'
  required       boolean not null default false,
  sort_order     int not null default 0,
  created_at     timestamptz not null default now(),
  unique (asset_type_id, key)
);

-- 2.4 Activos. El ID (uuid) es el identificador ESTABLE para el ITSM:
--     el nombre puede cambiar y el activo sigue siendo el mismo.
do $$
begin
  if not exists (select 1 from pg_type where typname = 'cmdb_estado') then
    create type cmdb_estado as enum ('on', 'off');
  end if;
end$$;

create table if not exists public.cmdb_assets (
  id             uuid primary key default gen_random_uuid(),
  asset_type_id  uuid not null references public.cmdb_asset_types(id) on delete restrict,
  name           text not null,
  alt_name       text,                           -- nombre alternativo (opcional)
  status         cmdb_estado,                    -- ON/OFF (nullable: tipos sin estado, p.ej. bombas)
  data           jsonb not null default '{}'::jsonb,  -- valores de los campos dinámicos
  image_url      text,                           -- foto real opcional (override del SVG)
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists idx_cmdb_types_system   on public.cmdb_asset_types (system_id);
create index if not exists idx_cmdb_fields_type     on public.cmdb_field_defs (asset_type_id);
create index if not exists idx_cmdb_assets_type     on public.cmdb_assets (asset_type_id);
create index if not exists idx_cmdb_assets_name     on public.cmdb_assets (name);
create index if not exists idx_cmdb_assets_data     on public.cmdb_assets using gin (data);

-- ============================================================
-- 3. updated_at automático
-- ============================================================
create or replace function public.cmdb_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['cmdb_profiles','cmdb_systems','cmdb_asset_types','cmdb_assets']
  loop
    execute format('drop trigger if exists trg_%1$s_updated on public.%1$s;', t);
    execute format(
      'create trigger trg_%1$s_updated before update on public.%1$s
       for each row execute function public.cmdb_set_updated_at();', t);
  end loop;
end$$;

-- ============================================================
-- 4. ROW LEVEL SECURITY
-- Portal público -> todo exige usuario autenticado.
--   - viewer: solo lectura
--   - editor: lectura + escritura de activos/estructura
--   - admin : todo
-- ============================================================
alter table public.cmdb_profiles    enable row level security;
alter table public.cmdb_systems     enable row level security;
alter table public.cmdb_asset_types enable row level security;
alter table public.cmdb_field_defs  enable row level security;
alter table public.cmdb_assets      enable row level security;

-- --- Perfiles ---
drop policy if exists cmdb_profiles_select on public.cmdb_profiles;
create policy cmdb_profiles_select on public.cmdb_profiles
  for select to authenticated
  using (id = auth.uid() or public.cmdb_role() = 'admin');

drop policy if exists cmdb_profiles_admin_write on public.cmdb_profiles;
create policy cmdb_profiles_admin_write on public.cmdb_profiles
  for all to authenticated
  using (public.cmdb_role() = 'admin')
  with check (public.cmdb_role() = 'admin');

-- --- Estructura: systems / asset_types / field_defs ---
-- Lectura para cualquier usuario autenticado; escritura admin/editor.
do $$
declare t text;
begin
  foreach t in array array['cmdb_systems','cmdb_asset_types','cmdb_field_defs']
  loop
    execute format('drop policy if exists %1$s_read on public.%1$s;', t);
    execute format(
      'create policy %1$s_read on public.%1$s for select to authenticated using (true);', t);

    execute format('drop policy if exists %1$s_write on public.%1$s;', t);
    execute format(
      'create policy %1$s_write on public.%1$s for all to authenticated
         using (public.cmdb_role() in (''admin'',''editor''))
         with check (public.cmdb_role() in (''admin'',''editor''));', t);
  end loop;
end$$;

-- --- Activos ---
drop policy if exists cmdb_assets_read on public.cmdb_assets;
create policy cmdb_assets_read on public.cmdb_assets
  for select to authenticated using (true);

drop policy if exists cmdb_assets_write on public.cmdb_assets;
create policy cmdb_assets_write on public.cmdb_assets
  for all to authenticated
  using (public.cmdb_role() in ('admin','editor'))
  with check (public.cmdb_role() in ('admin','editor'));

-- ============================================================
-- 5. INTEGRACIÓN CON EL ITSM
-- El ITSM debe guardar el UUID del activo (estable). Aquí se exponen:
--   a) Vista completa para usuarios autenticados.
--   b) Función mínima (id -> nombre) para que el ITSM resuelva el nombre
--      actual usando su anon key, sin exponer toda la tabla.
-- ============================================================
drop view if exists public.cmdb_assets_lookup;
create or replace view public.cmdb_assets_lookup as
  select
    a.id,
    a.name              as nombre,
    a.alt_name          as nombre_alternativo,
    a.status            as estado,
    t.name              as tipo,
    s.name              as sistema,
    a.data,
    a.updated_at
  from public.cmdb_assets a
  join public.cmdb_asset_types t on t.id = a.asset_type_id
  join public.cmdb_systems s     on s.id = t.system_id;

-- Resolución mínima del nombre actual de un activo (para el ITSM).
create or replace function public.cmdb_asset_name(p_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select name from public.cmdb_assets where id = p_id;
$$;

-- Búsqueda ligera de activos para selectores del ITSM (id, nombre, tipo).
drop function if exists public.cmdb_buscar_activos(text);
create or replace function public.cmdb_buscar_activos(p_query text default '')
returns table (id uuid, nombre text, nombre_alternativo text, tipo text, sistema text)
language sql
stable
security definer
set search_path = public
as $$
  select a.id, a.name, a.alt_name, t.name, s.name
  from public.cmdb_assets a
  join public.cmdb_asset_types t on t.id = a.asset_type_id
  join public.cmdb_systems s     on s.id = t.system_id
  where p_query = ''
     or a.name ilike '%' || p_query || '%'
     or a.alt_name ilike '%' || p_query || '%'
  order by a.name
  limit 50;
$$;

-- Resolución por lote: id[] -> (id, nombre). Para que el ITSM muestre el
-- nombre ACTUAL de los activos de una lista de tickets en una sola llamada.
create or replace function public.cmdb_asset_names(p_ids uuid[])
returns table (id uuid, nombre text)
language sql
stable
security definer
set search_path = public
as $$
  select a.id, a.name
  from public.cmdb_assets a
  where a.id = any(p_ids);
$$;

-- El ITSM usa la anon key: permitimos solo estas funciones acotadas.
grant execute on function public.cmdb_asset_name(uuid)      to anon, authenticated;
grant execute on function public.cmdb_buscar_activos(text)  to anon, authenticated;
grant execute on function public.cmdb_asset_names(uuid[])   to anon, authenticated;
