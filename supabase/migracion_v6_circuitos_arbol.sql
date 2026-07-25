-- ============================================================
-- CMDB Icetel — Migración v6: tableros como árbol (barras anidadas)
-- Ejecutar en: Supabase > SQL Editor. Idempotente. Archivo único.
--
-- Antes: protección general -> una barra fija -> circuitos de carga.
-- Ahora: cualquier protección puede colgar una barra, y de esa barra
--        cuelgan más protecciones, sin límite de profundidad.
--
-- Modelo: una sola tabla auto-referenciada.
--   clase = 'proteccion' -> un interruptor (general o derivado)
--   clase = 'barra'      -> una barra; su parent es la protección que la
--                           alimenta y sus hijos son las protecciones que
--                           salen de ella.
--
-- Nota de diseño: 'clase' es una columna text con CHECK y no un valor
-- nuevo del enum cmdb_circuito_tipo, a propósito. Agregar valores a un
-- enum obliga a partir la migración en dos ejecuciones separadas; así
-- este archivo corre de una sola vez.
-- ============================================================

-- ------------------------------------------------------------
-- 1) Columnas nuevas
-- ------------------------------------------------------------
alter table public.cmdb_circuitos
  add column if not exists parent_id uuid references public.cmdb_circuitos(id) on delete cascade;

alter table public.cmdb_circuitos
  add column if not exists clase text not null default 'proteccion';

alter table public.cmdb_circuitos
  add column if not exists fases text;

-- Nombre visible de la barra (las protecciones usan numero_circuito/tag).
alter table public.cmdb_circuitos
  add column if not exists nombre text;

-- ------------------------------------------------------------
-- 2) Restricciones
-- ------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'cmdb_circuitos_clase_chk') then
    alter table public.cmdb_circuitos
      add constraint cmdb_circuitos_clase_chk check (clase in ('proteccion', 'barra'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'cmdb_circuitos_fases_chk') then
    alter table public.cmdb_circuitos
      add constraint cmdb_circuitos_fases_chk
      check (fases is null or fases in ('monofasica', 'trifasica'));
  end if;
end$$;

create index if not exists idx_cmdb_circuitos_parent
  on public.cmdb_circuitos (parent_id, sort_order);

-- ------------------------------------------------------------
-- 3) Migración de los datos existentes
--    Cada tablero que ya tenía circuitos pasa de plano a árbol:
--    se crea la barra principal bajo la protección general y se le
--    cuelgan los circuitos que hoy están sueltos.
--    Solo actúa sobre tableros que aún no tienen ninguna barra.
-- ------------------------------------------------------------
do $$
declare
  r        record;
  v_general uuid;
  v_barra   uuid;
begin
  for r in select distinct asset_id from public.cmdb_circuitos loop

    -- ya migrado -> saltar
    if exists (select 1 from public.cmdb_circuitos
                where asset_id = r.asset_id and clase = 'barra') then
      continue;
    end if;

    select id into v_general
      from public.cmdb_circuitos
     where asset_id = r.asset_id and tipo = 'general'
     limit 1;

    -- Barra principal. Si no hay protección general queda como raíz.
    insert into public.cmdb_circuitos (asset_id, tipo, clase, nombre, parent_id, sort_order)
    values (r.asset_id, 'carga', 'barra', 'BARRA PRINCIPAL', v_general, 0)
    returning id into v_barra;

    -- Los circuitos existentes pasan a colgar de la barra.
    update public.cmdb_circuitos
       set parent_id = v_barra
     where asset_id = r.asset_id
       and clase = 'proteccion'
       and tipo <> 'general'
       and parent_id is null;

  end loop;
end$$;

-- ------------------------------------------------------------
-- 4) Vista/función para el ITSM: ahora expone la jerarquía
-- ------------------------------------------------------------
drop function if exists public.cmdb_circuitos_de(uuid);
create or replace function public.cmdb_circuitos_de(p_asset_id uuid)
returns table (
  id uuid, parent_id uuid, clase text, tipo text, nombre text,
  marca text, capacidad text, fases text,
  numero_circuito text, tag_circuito text, sort_order int
)
language sql
stable
security definer
set search_path = public
as $$
  select c.id, c.parent_id, c.clase, c.tipo::text, c.nombre,
         c.marca, c.capacidad, c.fases,
         c.numero_circuito, c.tag_circuito, c.sort_order
  from public.cmdb_circuitos c
  where c.asset_id = p_asset_id
  order by c.sort_order, c.created_at;
$$;

grant execute on function public.cmdb_circuitos_de(uuid) to anon, authenticated;
