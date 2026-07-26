-- ============================================================
-- CMDB Icetel — Migración v9: consumo en amperes y número de fase
-- Ejecutar en: Supabase > SQL Editor. Idempotente. Archivo único.
--
--   consumo_a    numeric — consumo medido en amperes. Va junto a
--                          capacidad_a para poder compararlos.
--   numero_fase  text    — 'RST' (trifásico) o 'R' / 'S' / 'T' (la fase
--                          concreta a la que está conectado un circuito
--                          monofásico). Restringido por CHECK.
-- ============================================================

alter table public.cmdb_circuitos add column if not exists consumo_a   numeric;
alter table public.cmdb_circuitos add column if not exists numero_fase text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'cmdb_circuitos_numero_fase_chk') then
    alter table public.cmdb_circuitos
      add constraint cmdb_circuitos_numero_fase_chk
      check (numero_fase is null or numero_fase in ('RST', 'R', 'S', 'T'));
  end if;
end$$;

-- Los circuitos ya marcados como trifásicos solo pueden ser RST: se
-- completa el dato para no tener que editarlos uno por uno.
update public.cmdb_circuitos
   set numero_fase = 'RST'
 where numero_fase is null and fases = 'trifasica';

-- ------------------------------------------------------------
-- Función para el ITSM: expone los campos nuevos
-- ------------------------------------------------------------
drop function if exists public.cmdb_circuitos_de(uuid);
create or replace function public.cmdb_circuitos_de(p_asset_id uuid)
returns table (
  id uuid, parent_id uuid, clase text, tipo text, nombre text,
  marca text, capacidad_a numeric, consumo_a numeric, consumo_kw numeric,
  fases text, numero_fase text, estado text,
  numero_circuito text, tag_circuito text,
  fila text, rack text, pdu text, cliente text, sort_order int
)
language sql
stable
security definer
set search_path = public
as $$
  select c.id, c.parent_id, c.clase, c.tipo::text, c.nombre,
         c.marca, c.capacidad_a, c.consumo_a, c.consumo_kw,
         c.fases, c.numero_fase, c.estado,
         c.numero_circuito, c.tag_circuito,
         c.fila, c.rack, c.pdu, c.cliente, c.sort_order
  from public.cmdb_circuitos c
  where c.asset_id = p_asset_id
  order by c.sort_order, c.created_at;
$$;

grant execute on function public.cmdb_circuitos_de(uuid) to anon, authenticated;
