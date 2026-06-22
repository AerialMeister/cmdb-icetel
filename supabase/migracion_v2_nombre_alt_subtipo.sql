-- ============================================================
-- CMDB Icetel - Migración v2
-- Agrega: 'Nombre alternativo' (alt_name) y 'Subtipo' a todos los activos/tipos.
-- Ejecutar en: Supabase > SQL Editor (sobre la BD ya creada). Es idempotente.
-- ============================================================

-- 1) Nombre alternativo: columna universal y opcional en los activos
alter table public.cmdb_assets add column if not exists alt_name text;

-- 2) Subtipo: campo de texto justo después de 'Tipo' en cada tipo de activo
do $$
declare r record; v_tipo int;
begin
  for r in select id from public.cmdb_asset_types loop
    if not exists (select 1 from public.cmdb_field_defs where asset_type_id = r.id and key = 'subtipo') then
      select sort_order into v_tipo from public.cmdb_field_defs where asset_type_id = r.id and key = 'tipo';
      if v_tipo is null then v_tipo := 0; end if;
      update public.cmdb_field_defs set sort_order = sort_order + 1
        where asset_type_id = r.id and sort_order > v_tipo;
      insert into public.cmdb_field_defs (asset_type_id, key, label, field_type, required, sort_order)
        values (r.id, 'subtipo', 'Subtipo', 'text', false, v_tipo + 1);
    end if;
  end loop;
end$$;

-- 3) Exponer el nombre alternativo al ITSM (vista + búsqueda)
drop view if exists public.cmdb_assets_lookup;
create or replace view public.cmdb_assets_lookup as
  select a.id, a.name as nombre, a.alt_name as nombre_alternativo, a.status as estado,
         t.name as tipo, s.name as sistema, a.data, a.updated_at
  from public.cmdb_assets a
  join public.cmdb_asset_types t on t.id = a.asset_type_id
  join public.cmdb_systems s     on s.id = t.system_id;

drop function if exists public.cmdb_buscar_activos(text);
create or replace function public.cmdb_buscar_activos(p_query text default '')
returns table (id uuid, nombre text, nombre_alternativo text, tipo text, sistema text)
language sql stable security definer set search_path = public
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
grant execute on function public.cmdb_buscar_activos(text) to anon, authenticated;
