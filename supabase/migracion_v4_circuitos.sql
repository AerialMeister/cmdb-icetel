-- ============================================================
-- CMDB Icetel — Migración v4: circuitos de tableros eléctricos
-- Guarda el detalle de protecciones (general + circuitos de carga)
-- de cada tablero como una lista ordenada de bloques.
-- Ejecutar en: Supabase > SQL Editor > New query > Run
-- ============================================================

-- Tipo de bloque: 'general' = protección principal del tablero,
--                 'carga'   = circuito derivado (salida a una carga).
do $$
begin
  if not exists (select 1 from pg_type where typname = 'cmdb_circuito_tipo') then
    create type cmdb_circuito_tipo as enum ('general', 'carga');
  end if;
end$$;

create table if not exists public.cmdb_circuitos (
  id              uuid primary key default gen_random_uuid(),
  asset_id        uuid not null references public.cmdb_assets(id) on delete cascade,
  tipo            cmdb_circuito_tipo not null default 'carga',
  marca           text,          -- marca de la protección (Schneider, ABB, Siemens, ...)
  capacidad       text,          -- capacidad nominal (p.ej. "63 A", "3x100 A")
  numero_circuito text,          -- número del circuito (C1, C2, 12, ...)
  tag_circuito    text,          -- tag / descripción de la carga alimentada
  sort_order      int  not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_cmdb_circuitos_asset
  on public.cmdb_circuitos (asset_id, sort_order);

-- updated_at automático (reutiliza la función del schema base)
drop trigger if exists trg_cmdb_circuitos_updated on public.cmdb_circuitos;
create trigger trg_cmdb_circuitos_updated
  before update on public.cmdb_circuitos
  for each row execute function public.cmdb_set_updated_at();

-- ------------------------------------------------------------
-- RLS: lectura para cualquier autenticado; escritura admin/editor
-- ------------------------------------------------------------
alter table public.cmdb_circuitos enable row level security;

drop policy if exists cmdb_circuitos_read on public.cmdb_circuitos;
create policy cmdb_circuitos_read on public.cmdb_circuitos
  for select to authenticated using (true);

drop policy if exists cmdb_circuitos_write on public.cmdb_circuitos;
create policy cmdb_circuitos_write on public.cmdb_circuitos
  for all to authenticated
  using (public.cmdb_role() in ('admin','editor'))
  with check (public.cmdb_role() in ('admin','editor'));

-- ------------------------------------------------------------
-- Integración con el ITSM: circuitos de un tablero por su UUID
-- ------------------------------------------------------------
create or replace function public.cmdb_circuitos_de(p_asset_id uuid)
returns table (
  id uuid, tipo text, marca text, capacidad text,
  numero_circuito text, tag_circuito text, sort_order int
)
language sql
stable
security definer
set search_path = public
as $$
  select c.id, c.tipo::text, c.marca, c.capacidad,
         c.numero_circuito, c.tag_circuito, c.sort_order
  from public.cmdb_circuitos c
  where c.asset_id = p_asset_id
  order by c.tipo, c.sort_order, c.created_at;  -- 'general' primero (orden del enum)
$$;

grant execute on function public.cmdb_circuitos_de(uuid) to anon, authenticated;
