-- ============================================================
-- CMDB Icetel - Carga inicial de sistemas, tipos y campos
-- Ejecutar DESPUÉS de schema.sql.  Es idempotente (on conflict do nothing).
-- ============================================================

-- ------------------------------------------------------------
-- Sistemas (categorías)
-- ------------------------------------------------------------
insert into public.cmdb_systems (name, slug, description, icon, sort_order) values
  ('Sistema Eléctrico',      'electrico',      'Energía: UPS, grupos electrógenos, plantas CC, tableros.', 'rayo',    1),
  ('Sistema Mecánico',       'mecanico',       'Climatización de salas técnicas.',                          'clima',   2),
  ('Sistema Arquitectónico', 'arquitectonico', 'Servicios generales del edificio.',                         'edificio',3)
on conflict (slug) do nothing;

-- ------------------------------------------------------------
-- Tipos de activo
-- ------------------------------------------------------------
insert into public.cmdb_asset_types (system_id, name, slug, illustration, sort_order)
select s.id, v.name, v.slug, v.illustration, v.sort_order
from (values
  ('electrico',      'UPS',                     'ups',                  'ups',       1),
  ('electrico',      'Grupos Electrógenos',     'grupos-electrogenos',  'genset',    2),
  ('electrico',      'Plantas CC',              'plantas-cc',           'planta_cc', 3),
  ('electrico',      'Tableros Eléctricos',     'tableros-electricos',  'tablero',   4),
  ('mecanico',       'Unidades de Climatización','climatizacion',       'clima',     1),
  ('arquitectonico', 'Bombas de Agua',          'bombas-agua',          'bomba',     1)
) as v(system_slug, name, slug, illustration, sort_order)
join public.cmdb_systems s on s.slug = v.system_slug
on conflict (system_id, slug) do nothing;

-- ------------------------------------------------------------
-- Helper temporal para agregar campos por slug de tipo
-- ------------------------------------------------------------
create or replace function pg_temp.add_field(
  p_type_slug text, p_key text, p_label text,
  p_type cmdb_field_type, p_required boolean, p_order int,
  p_options jsonb default null
) returns void language plpgsql as $$
declare v_type_id uuid;
begin
  select id into v_type_id from public.cmdb_asset_types where slug = p_type_slug limit 1;
  if v_type_id is null then return; end if;
  insert into public.cmdb_field_defs (asset_type_id, key, label, field_type, required, sort_order, options)
  values (v_type_id, p_key, p_label, p_type, p_required, p_order, p_options)
  on conflict (asset_type_id, key) do nothing;
end;
$$;

-- ------------------------------------------------------------
-- Campos por tipo
-- (Nombre y ON/OFF son columnas propias del activo, no campos dinámicos.)
-- ------------------------------------------------------------

-- UPS (incluye Potencia aparente; ilustración: UPS modular)
select pg_temp.add_field('ups','tipo',                'Tipo',                 'text',  false, 1);
select pg_temp.add_field('ups','marca',               'Marca',                'text',  false, 2);
select pg_temp.add_field('ups','modelo',              'Modelo',               'text',  false, 3);
select pg_temp.add_field('ups','serie',               'Serie',                'text',  false, 4);
select pg_temp.add_field('ups','potencia_aparente',   'Potencia aparente',    'text',  false, 5);
select pg_temp.add_field('ups','ubicacion',           'Ubicación',            'text',  false, 6);
select pg_temp.add_field('ups','empalme',             'Empalme',              'text',  false, 7);
select pg_temp.add_field('ups','subestacion',         'Subestación',          'text',  false, 8);
select pg_temp.add_field('ups','generador',           'Generador',            'text',  false, 9);
select pg_temp.add_field('ups','tablero_alimenta',    'Tablero que lo alimenta','text',false,10);
select pg_temp.add_field('ups','tablero_aguas_abajo', 'Tablero aguas abajo',  'text',  false,11);

-- Grupos Electrógenos (sin generador; ilustración: grupo electrógeno)
select pg_temp.add_field('grupos-electrogenos','tipo',               'Tipo',               'text', false, 1);
select pg_temp.add_field('grupos-electrogenos','marca',              'Marca',              'text', false, 2);
select pg_temp.add_field('grupos-electrogenos','modelo',             'Modelo',             'text', false, 3);
select pg_temp.add_field('grupos-electrogenos','serie',              'Serie',              'text', false, 4);
select pg_temp.add_field('grupos-electrogenos','potencia_aparente',  'Potencia aparente',  'text', false, 5);
select pg_temp.add_field('grupos-electrogenos','ubicacion',          'Ubicación',          'text', false, 6);
select pg_temp.add_field('grupos-electrogenos','empalme',            'Empalme',            'text', false, 7);
select pg_temp.add_field('grupos-electrogenos','subestacion',        'Subestación',        'text', false, 8);
select pg_temp.add_field('grupos-electrogenos','tablero_alimenta',   'Tablero que lo alimenta','text',false,9);
select pg_temp.add_field('grupos-electrogenos','tablero_aguas_abajo','Tablero aguas abajo','text', false,10);

-- Plantas CC (potencia)
select pg_temp.add_field('plantas-cc','tipo',               'Tipo',               'text', false, 1);
select pg_temp.add_field('plantas-cc','marca',              'Marca',              'text', false, 2);
select pg_temp.add_field('plantas-cc','modelo',             'Modelo',             'text', false, 3);
select pg_temp.add_field('plantas-cc','serie',              'Serie',              'text', false, 4);
select pg_temp.add_field('plantas-cc','potencia',           'Potencia',           'text', false, 5);
select pg_temp.add_field('plantas-cc','ubicacion',          'Ubicación',          'text', false, 6);
select pg_temp.add_field('plantas-cc','empalme',            'Empalme',            'text', false, 7);
select pg_temp.add_field('plantas-cc','subestacion',        'Subestación',        'text', false, 8);
select pg_temp.add_field('plantas-cc','generador',          'Generador',          'text', false, 9);
select pg_temp.add_field('plantas-cc','tablero_alimenta',   'Tablero que lo alimenta','text',false,10);
select pg_temp.add_field('plantas-cc','tablero_aguas_abajo','Tablero aguas abajo','text', false,11);

-- Tableros Eléctricos (power meter; ilustración: tablero y protecciones)
select pg_temp.add_field('tableros-electricos','tipo',               'Tipo',               'text', false, 1);
select pg_temp.add_field('tableros-electricos','marca',              'Marca',              'text', false, 2);
select pg_temp.add_field('tableros-electricos','modelo',             'Modelo',             'text', false, 3);
select pg_temp.add_field('tableros-electricos','serie',              'Serie',              'text', false, 4);
select pg_temp.add_field('tableros-electricos','power_meter',        'Power meter',        'text', false, 5);
select pg_temp.add_field('tableros-electricos','ubicacion',          'Ubicación',          'text', false, 6);
select pg_temp.add_field('tableros-electricos','empalme',            'Empalme',            'text', false, 7);
select pg_temp.add_field('tableros-electricos','subestacion',        'Subestación',        'text', false, 8);
select pg_temp.add_field('tableros-electricos','generador',          'Generador',          'text', false, 9);
select pg_temp.add_field('tableros-electricos','tablero_alimenta',   'Tablero que lo alimenta','text',false,10);
select pg_temp.add_field('tableros-electricos','tablero_aguas_abajo','Tablero aguas abajo','text', false,11);

-- Unidades de Climatización (el campo 'tipo' define la ilustración: CRAC/CRAH vs HVAC/split)
select pg_temp.add_field('climatizacion','tipo',            'Tipo',            'select', false, 1,
  '["CRAC","CRAH","HVAC"]'::jsonb);
select pg_temp.add_field('climatizacion','marca',           'Marca',           'text', false, 2);
select pg_temp.add_field('climatizacion','modelo',          'Modelo',          'text', false, 3);
select pg_temp.add_field('climatizacion','serie',           'Serie',           'text', false, 4);
select pg_temp.add_field('climatizacion','power_meter',     'Power meter',     'text', false, 5);
select pg_temp.add_field('climatizacion','ubicacion',       'Ubicación',       'text', false, 6);
select pg_temp.add_field('climatizacion','empalme',         'Empalme',         'text', false, 7);
select pg_temp.add_field('climatizacion','subestacion',     'Subestación',     'text', false, 8);
select pg_temp.add_field('climatizacion','generador',       'Generador',       'text', false, 9);
select pg_temp.add_field('climatizacion','tablero',         'Tablero',         'text', false,10);
select pg_temp.add_field('climatizacion','circuito_alimenta','Circuito que lo alimenta','text',false,11);

-- Bombas de Agua (sin ON/OFF en el requerimiento)
select pg_temp.add_field('bombas-agua','tipo',             'Tipo',            'text', false, 1);
select pg_temp.add_field('bombas-agua','marca',            'Marca',           'text', false, 2);
select pg_temp.add_field('bombas-agua','modelo',           'Modelo',          'text', false, 3);
select pg_temp.add_field('bombas-agua','serie',            'Serie',           'text', false, 4);
select pg_temp.add_field('bombas-agua','ubicacion',        'Ubicación',       'text', false, 5);
select pg_temp.add_field('bombas-agua','empalme',          'Empalme',         'text', false, 6);
select pg_temp.add_field('bombas-agua','subestacion',      'Subestación',     'text', false, 7);
select pg_temp.add_field('bombas-agua','generador',        'Generador',       'text', false, 8);
select pg_temp.add_field('bombas-agua','tablero',          'Tablero',         'text', false, 9);
select pg_temp.add_field('bombas-agua','circuito_alimenta','Circuito que lo alimenta','text',false,10);

-- ------------------------------------------------------------
-- Subtipo: se agrega justo después de "Tipo" en cada tipo de activo.
-- Idempotente: solo lo crea si aún no existe.
-- ------------------------------------------------------------
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

drop function pg_temp.add_field(text, text, text, cmdb_field_type, boolean, int, jsonb);
