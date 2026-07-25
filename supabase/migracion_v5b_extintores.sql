-- ============================================================
-- CMDB Icetel - Migración v5b: tipo "Extintores" (Sistema Arquitectónico)
-- Ejecutar en: Supabase > SQL Editor. Idempotente.
--
-- REQUISITO: ejecutar antes migracion_v5a_tipo_fecha.sql (agrega 'date'
-- al enum cmdb_field_type). Si esta migración falla con
-- "unsafe use of new value of enum type", es porque falta ese paso.
--
-- Crea:
--   * Tipo de activo "Extintores" bajo el sistema Arquitectónico,
--     con ilustración 'extintor'.
--   * Sus campos: identificación, ubicación y las 4 fechas de control.
-- ============================================================

-- ------------------------------------------------------------
-- Helpers temporales (mismo patrón que la migración v3)
-- ------------------------------------------------------------
create or replace function pg_temp.mk_type(p_sys_slug text, p_name text, p_slug text, p_illu text)
returns void language plpgsql as $$
declare v_sys uuid;
begin
  select id into v_sys from public.cmdb_systems where slug = p_sys_slug;
  if v_sys is null then
    raise exception 'No existe el sistema con slug %', p_sys_slug;
  end if;
  insert into public.cmdb_asset_types (system_id, name, slug, illustration, sort_order)
  values (v_sys, p_name, p_slug, p_illu, 0)
  on conflict (system_id, slug) do update
    set name = excluded.name, illustration = excluded.illustration;
end;$$;

create or replace function pg_temp.addf(p_type_slug text, p_key text, p_label text,
  p_type cmdb_field_type, p_order int, p_options jsonb default null)
returns void language plpgsql as $$
declare v_type uuid;
begin
  select id into v_type from public.cmdb_asset_types where slug = p_type_slug limit 1;
  if v_type is null then return; end if;
  insert into public.cmdb_field_defs (asset_type_id, key, label, field_type, required, sort_order, options)
  values (v_type, p_key, p_label, p_type, false, p_order, p_options)
  on conflict (asset_type_id, key) do update
    set label = excluded.label,
        field_type = excluded.field_type,
        sort_order = excluded.sort_order,
        options = excluded.options;
end;$$;

-- ------------------------------------------------------------
-- 1) Tipo de activo
-- ------------------------------------------------------------
select pg_temp.mk_type('arquitectonico', 'Extintores', 'extintores', 'extintor');

-- ------------------------------------------------------------
-- 2) Campos
--    Las claves 'fecha_vencimiento_carga' y
--    'fecha_vencimiento_prueba_hidrostatica' son las que lee el
--    frontend (src/lib/vigencia.js) para calcular la columna Vigencia.
--    Si se renombran aquí, hay que renombrarlas también allá.
-- ------------------------------------------------------------
select pg_temp.addf('extintores', 'numero_equipo', 'Número de equipo', 'text',   1);
select pg_temp.addf('extintores', 'marca',         'Marca',            'text',   2);
select pg_temp.addf('extintores', 'tipo',          'Tipo',             'select', 3,
  '["PQS (ABC)","CO2","Agua a presión","Espuma (AFFF)","Agente limpio (Halotron/HCFC)","Polvo clase D","Clase K (acetato de potasio)"]'::jsonb);
select pg_temp.addf('extintores', 'peso',          'Peso (kg)',        'text',   4);
select pg_temp.addf('extintores', 'edificio',      'Edificio',         'text',   5);
select pg_temp.addf('extintores', 'piso',          'Piso',             'text',   6);
select pg_temp.addf('extintores', 'sector',        'Sector',           'text',   7);

select pg_temp.addf('extintores', 'fecha_fabricacion',
  'Fecha de fabricación', 'date', 8);
select pg_temp.addf('extintores', 'fecha_ultima_prueba_hidrostatica',
  'Fecha última prueba hidrostática', 'date', 9);
select pg_temp.addf('extintores', 'fecha_vencimiento_carga',
  'Fecha vencimiento carga', 'date', 10);
select pg_temp.addf('extintores', 'fecha_vencimiento_prueba_hidrostatica',
  'Fecha vencimiento prueba hidrostática', 'date', 11);

drop function pg_temp.mk_type(text, text, text, text);
drop function pg_temp.addf(text, text, text, cmdb_field_type, int, jsonb);
