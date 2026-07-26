-- ============================================================
-- CMDB Icetel — Migración v8: campos nuevos en circuitos
-- Ejecutar en: Supabase > SQL Editor. Idempotente. Archivo único.
--
--   capacidad_a  numeric  — capacidad en amperes. Reemplaza al texto
--                           libre "capacidad" ("63 A", "3x100 A"): ahora
--                           se guarda solo el número y la app agrega la
--                           unidad al mostrarlo.
--   consumo_kw   numeric  — consumo medido. Queda vacío por ahora; se
--                           llenará desde la base de mediciones.
--   estado       text     — 'on' / 'off'. Estado del disyuntor.
--   fila, rack, pdu, cliente  text — ubicación y asignación, opcionales.
--
-- La columna antigua "capacidad" NO se elimina: se copia su valor a
-- capacidad_a y se deja intacta como respaldo. La app deja de leerla y
-- de escribirla. Una vez que verifiques que la conversión quedó bien,
-- puedes borrarla con:
--     alter table public.cmdb_circuitos drop column capacidad;
-- ============================================================

alter table public.cmdb_circuitos add column if not exists capacidad_a numeric;
alter table public.cmdb_circuitos add column if not exists consumo_kw  numeric;
alter table public.cmdb_circuitos add column if not exists estado      text;
alter table public.cmdb_circuitos add column if not exists fila        text;
alter table public.cmdb_circuitos add column if not exists rack        text;
alter table public.cmdb_circuitos add column if not exists pdu         text;
alter table public.cmdb_circuitos add column if not exists cliente     text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'cmdb_circuitos_estado_chk') then
    alter table public.cmdb_circuitos
      add constraint cmdb_circuitos_estado_chk
      check (estado is null or estado in ('on', 'off'));
  end if;
end$$;

-- ------------------------------------------------------------
-- Conversión de "capacidad" (texto) a capacidad_a (numérico).
-- Se toma el ÚLTIMO número del texto, que es el criterio correcto para
-- notaciones como "3x100 A" -> 100. Si además el texto empieza con
-- "3x", se aprovecha para completar las fases cuando estén vacías.
-- Cualquier valor que no se pueda convertir se deja sin tocar; la
-- columna original queda como respaldo.
-- ------------------------------------------------------------
do $$
declare
  r      record;
  m      text[];
  ultimo text;
  v      numeric;
begin
  for r in
    select id, capacidad
      from public.cmdb_circuitos
     where capacidad_a is null
       and capacidad is not null
       and capacidad ~ '[0-9]'
  loop
    ultimo := null;
    for m in
      select regexp_matches(replace(r.capacidad, ',', '.'), '[0-9]+(?:\.[0-9]+)?', 'g')
    loop
      ultimo := m[1];
    end loop;

    if ultimo is not null then
      begin
        v := ultimo::numeric;
        update public.cmdb_circuitos set capacidad_a = v where id = r.id;

        if r.capacidad ~* '^\s*3\s*[x*]' then
          update public.cmdb_circuitos
             set fases = 'trifasica'
           where id = r.id and fases is null;
        end if;
      exception when others then
        null;   -- valor no convertible: se conserva el texto original
      end;
    end if;
  end loop;
end$$;

-- ------------------------------------------------------------
-- Función para el ITSM: expone los campos nuevos
-- ------------------------------------------------------------
drop function if exists public.cmdb_circuitos_de(uuid);
create or replace function public.cmdb_circuitos_de(p_asset_id uuid)
returns table (
  id uuid, parent_id uuid, clase text, tipo text, nombre text,
  marca text, capacidad_a numeric, consumo_kw numeric, fases text, estado text,
  numero_circuito text, tag_circuito text,
  fila text, rack text, pdu text, cliente text, sort_order int
)
language sql
stable
security definer
set search_path = public
as $$
  select c.id, c.parent_id, c.clase, c.tipo::text, c.nombre,
         c.marca, c.capacidad_a, c.consumo_kw, c.fases, c.estado,
         c.numero_circuito, c.tag_circuito,
         c.fila, c.rack, c.pdu, c.cliente, c.sort_order
  from public.cmdb_circuitos c
  where c.asset_id = p_asset_id
  order by c.sort_order, c.created_at;
$$;

grant execute on function public.cmdb_circuitos_de(uuid) to anon, authenticated;
