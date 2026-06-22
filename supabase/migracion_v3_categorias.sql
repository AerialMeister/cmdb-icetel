-- ============================================================
-- CMDB Icetel - Migración v3: reestructura de categorías
-- Ejecutar en: Supabase > SQL Editor (sobre la BD existente). Idempotente.
--
-- Cambios:
--  * Sistema Eléctrico: Banco de batería, Celda MT, Grupo Electrógeno,
--    Planta CC, Tablero Eléctrico, Transformador MT, UPS
--  * Sistema Mecánico: ACU, AHC, Bomba de agua, Chiller,
--    Estanque de combustible, Torre de enfriamiento
--  * Se elimina "Unidades de Climatización".
--  * "Bomba de agua" se mueve de Arquitectónico a Mecánico.
-- ============================================================

-- ------------------------------------------------------------
-- 1) Renombrar tipos existentes (conserva activos y campos)
-- ------------------------------------------------------------
update public.cmdb_asset_types set name = 'Grupo Electrógeno' where slug = 'grupos-electrogenos';
update public.cmdb_asset_types set name = 'Planta CC'         where slug = 'plantas-cc';
update public.cmdb_asset_types set name = 'Tablero Eléctrico' where slug = 'tableros-electricos';

-- ------------------------------------------------------------
-- 2) Eliminar "Unidades de Climatización" (y sus activos/campos)
--    Los activos se borran primero (asset_type_id es ON DELETE RESTRICT).
-- ------------------------------------------------------------
delete from public.cmdb_assets
 where asset_type_id in (select id from public.cmdb_asset_types where slug = 'climatizacion');
delete from public.cmdb_asset_types where slug = 'climatizacion';

-- ------------------------------------------------------------
-- 3) Mover "Bomba de agua" a Sistema Mecánico (renombrar a singular)
-- ------------------------------------------------------------
update public.cmdb_asset_types t
   set name = 'Bomba de agua',
       system_id = (select id from public.cmdb_systems where slug = 'mecanico')
 where t.slug = 'bombas-agua';

-- ------------------------------------------------------------
-- Helpers temporales
-- ------------------------------------------------------------
create or replace function pg_temp.mk_type(p_sys_slug text, p_name text, p_slug text, p_illu text)
returns void language plpgsql as $$
declare v_sys uuid;
begin
  select id into v_sys from public.cmdb_systems where slug = p_sys_slug;
  if v_sys is null then return; end if;
  insert into public.cmdb_asset_types (system_id, name, slug, illustration, sort_order)
  values (v_sys, p_name, p_slug, p_illu, 0)
  on conflict (system_id, slug) do update set name = excluded.name, illustration = excluded.illustration;
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
  on conflict (asset_type_id, key) do nothing;
end;$$;

-- ------------------------------------------------------------
-- 4) Crear tipos nuevos
-- ------------------------------------------------------------
-- Eléctrico
select pg_temp.mk_type('electrico', 'Banco de batería',  'banco-bateria',    'banco_bateria');
select pg_temp.mk_type('electrico', 'Celda MT',          'celda-mt',         'celda_mt');
select pg_temp.mk_type('electrico', 'Transformador MT',  'transformador-mt', 'transformador_mt');
-- Mecánico
select pg_temp.mk_type('mecanico',  'Torre de enfriamiento', 'torre-enfriamiento',   'torre_enfriamiento');
select pg_temp.mk_type('mecanico',  'Chiller',               'chiller',              'chiller');
select pg_temp.mk_type('mecanico',  'AHC',                   'ahc',                  'ahc');
select pg_temp.mk_type('mecanico',  'ACU',                   'acu',                  'acu');
select pg_temp.mk_type('mecanico',  'Estanque de combustible','estanque-combustible','estanque_combustible');

-- ------------------------------------------------------------
-- 5) Campos de cada tipo nuevo (base CMDB + atributos técnicos estándar)
-- ------------------------------------------------------------
-- Banco de batería
select pg_temp.addf('banco-bateria','tipo','Tipo','text',1);
select pg_temp.addf('banco-bateria','subtipo','Subtipo','text',2);
select pg_temp.addf('banco-bateria','marca','Marca','text',3);
select pg_temp.addf('banco-bateria','modelo','Modelo','text',4);
select pg_temp.addf('banco-bateria','serie','Serie','text',5);
select pg_temp.addf('banco-bateria','tecnologia','Tecnología','select',6,'["VRLA","Ion-Litio","Ni-Cd","Plomo-ácido abierto"]'::jsonb);
select pg_temp.addf('banco-bateria','tension_nominal','Tensión nominal (Vdc)','text',7);
select pg_temp.addf('banco-bateria','capacidad_ah','Capacidad (Ah)','text',8);
select pg_temp.addf('banco-bateria','num_celdas','N° de celdas/bloques','text',9);
select pg_temp.addf('banco-bateria','autonomia','Autonomía (min)','text',10);
select pg_temp.addf('banco-bateria','equipo_asociado','Equipo asociado (UPS/Planta CC)','text',11);
select pg_temp.addf('banco-bateria','ubicacion','Ubicación','text',12);
select pg_temp.addf('banco-bateria','subestacion','Subestación','text',13);

-- Celda MT
select pg_temp.addf('celda-mt','tipo','Tipo','text',1);
select pg_temp.addf('celda-mt','subtipo','Subtipo','text',2);
select pg_temp.addf('celda-mt','marca','Marca','text',3);
select pg_temp.addf('celda-mt','modelo','Modelo','text',4);
select pg_temp.addf('celda-mt','serie','Serie','text',5);
select pg_temp.addf('celda-mt','tension_nominal','Tensión nominal (kV)','text',6);
select pg_temp.addf('celda-mt','corriente_nominal','Corriente nominal (A)','text',7);
select pg_temp.addf('celda-mt','capacidad_ruptura','Capacidad de ruptura (kA)','text',8);
select pg_temp.addf('celda-mt','aislacion','Aislación','select',9,'["Aire","SF6","Vacío","Sólida"]'::jsonb);
select pg_temp.addf('celda-mt','funcion','Función','select',10,'["Entrada","Salida","Acoplamiento","Medida","Protección"]'::jsonb);
select pg_temp.addf('celda-mt','rele_proteccion','Relé de protección','text',11);
select pg_temp.addf('celda-mt','ubicacion','Ubicación','text',12);
select pg_temp.addf('celda-mt','subestacion','Subestación','text',13);

-- Transformador MT
select pg_temp.addf('transformador-mt','tipo','Tipo','text',1);
select pg_temp.addf('transformador-mt','subtipo','Subtipo','text',2);
select pg_temp.addf('transformador-mt','marca','Marca','text',3);
select pg_temp.addf('transformador-mt','modelo','Modelo','text',4);
select pg_temp.addf('transformador-mt','serie','Serie','text',5);
select pg_temp.addf('transformador-mt','potencia','Potencia (kVA)','text',6);
select pg_temp.addf('transformador-mt','tension_primaria','Tensión primaria (kV)','text',7);
select pg_temp.addf('transformador-mt','tension_secundaria','Tensión secundaria (V)','text',8);
select pg_temp.addf('transformador-mt','refrigeracion','Refrigeración','select',9,'["Seco","Aceite ONAN","Aceite ONAF"]'::jsonb);
select pg_temp.addf('transformador-mt','grupo_conexion','Grupo de conexión','text',10);
select pg_temp.addf('transformador-mt','impedancia','Impedancia (%)','text',11);
select pg_temp.addf('transformador-mt','ubicacion','Ubicación','text',12);
select pg_temp.addf('transformador-mt','subestacion','Subestación','text',13);

-- Torre de enfriamiento
select pg_temp.addf('torre-enfriamiento','tipo','Tipo','text',1);
select pg_temp.addf('torre-enfriamiento','subtipo','Subtipo','text',2);
select pg_temp.addf('torre-enfriamiento','marca','Marca','text',3);
select pg_temp.addf('torre-enfriamiento','modelo','Modelo','text',4);
select pg_temp.addf('torre-enfriamiento','serie','Serie','text',5);
select pg_temp.addf('torre-enfriamiento','capacidad','Capacidad térmica (kW)','text',6);
select pg_temp.addf('torre-enfriamiento','caudal_agua','Caudal de agua (m³/h)','text',7);
select pg_temp.addf('torre-enfriamiento','tipo_tiro','Tipo de tiro','select',8,'["Tiro inducido","Tiro forzado","Circuito cerrado"]'::jsonb);
select pg_temp.addf('torre-enfriamiento','num_ventiladores','N° de ventiladores','text',9);
select pg_temp.addf('torre-enfriamiento','potencia_ventilador','Potencia ventilador (kW)','text',10);
select pg_temp.addf('torre-enfriamiento','ubicacion','Ubicación','text',11);
select pg_temp.addf('torre-enfriamiento','tablero','Tablero','text',12);
select pg_temp.addf('torre-enfriamiento','circuito_alimenta','Circuito que lo alimenta','text',13);

-- Chiller
select pg_temp.addf('chiller','tipo','Tipo','text',1);
select pg_temp.addf('chiller','subtipo','Subtipo','text',2);
select pg_temp.addf('chiller','marca','Marca','text',3);
select pg_temp.addf('chiller','modelo','Modelo','text',4);
select pg_temp.addf('chiller','serie','Serie','text',5);
select pg_temp.addf('chiller','capacidad_frigorifica','Capacidad frigorífica (kW)','text',6);
select pg_temp.addf('chiller','condensacion','Condensación','select',7,'["Enfriado por aire","Enfriado por agua"]'::jsonb);
select pg_temp.addf('chiller','refrigerante','Refrigerante','text',8);
select pg_temp.addf('chiller','compresor','Tipo de compresor','select',9,'["Tornillo","Scroll","Centrífugo","Alternativo"]'::jsonb);
select pg_temp.addf('chiller','eer','EER / COP','text',10);
select pg_temp.addf('chiller','potencia','Potencia eléctrica (kW)','text',11);
select pg_temp.addf('chiller','caudal_agua','Caudal de agua (m³/h)','text',12);
select pg_temp.addf('chiller','ubicacion','Ubicación','text',13);
select pg_temp.addf('chiller','tablero','Tablero','text',14);
select pg_temp.addf('chiller','circuito_alimenta','Circuito que lo alimenta','text',15);

-- AHC (climatizador / manejadora de aire)
select pg_temp.addf('ahc','tipo','Tipo','text',1);
select pg_temp.addf('ahc','subtipo','Subtipo','text',2);
select pg_temp.addf('ahc','marca','Marca','text',3);
select pg_temp.addf('ahc','modelo','Modelo','text',4);
select pg_temp.addf('ahc','serie','Serie','text',5);
select pg_temp.addf('ahc','caudal_aire','Caudal de aire (m³/h)','text',6);
select pg_temp.addf('ahc','capacidad','Capacidad térmica (kW)','text',7);
select pg_temp.addf('ahc','etapas_filtrado','Etapas de filtrado','text',8);
select pg_temp.addf('ahc','potencia','Potencia (kW)','text',9);
select pg_temp.addf('ahc','ubicacion','Ubicación','text',10);
select pg_temp.addf('ahc','tablero','Tablero','text',11);
select pg_temp.addf('ahc','circuito_alimenta','Circuito que lo alimenta','text',12);

-- ACU (unidad de aire acondicionado / condensadora)
select pg_temp.addf('acu','tipo','Tipo','text',1);
select pg_temp.addf('acu','subtipo','Subtipo','text',2);
select pg_temp.addf('acu','marca','Marca','text',3);
select pg_temp.addf('acu','modelo','Modelo','text',4);
select pg_temp.addf('acu','serie','Serie','text',5);
select pg_temp.addf('acu','capacidad_frigorifica','Capacidad frigorífica (kW)','text',6);
select pg_temp.addf('acu','configuracion','Configuración','select',7,'["Condensadora","Evaporadora","Split","Compacta"]'::jsonb);
select pg_temp.addf('acu','refrigerante','Refrigerante','text',8);
select pg_temp.addf('acu','potencia','Potencia (kW)','text',9);
select pg_temp.addf('acu','ubicacion','Ubicación','text',10);
select pg_temp.addf('acu','tablero','Tablero','text',11);
select pg_temp.addf('acu','circuito_alimenta','Circuito que lo alimenta','text',12);

-- Estanque de combustible
select pg_temp.addf('estanque-combustible','tipo','Tipo','text',1);
select pg_temp.addf('estanque-combustible','subtipo','Subtipo','text',2);
select pg_temp.addf('estanque-combustible','marca','Marca','text',3);
select pg_temp.addf('estanque-combustible','modelo','Modelo','text',4);
select pg_temp.addf('estanque-combustible','serie','Serie','text',5);
select pg_temp.addf('estanque-combustible','capacidad','Capacidad (L)','text',6);
select pg_temp.addf('estanque-combustible','combustible','Combustible','select',7,'["Diésel","Gasolina","GLP"]'::jsonb);
select pg_temp.addf('estanque-combustible','material','Material','select',8,'["Acero","Polietileno","Fibra de vidrio"]'::jsonb);
select pg_temp.addf('estanque-combustible','instalacion','Instalación','select',9,'["Superficie","Enterrado"]'::jsonb);
select pg_temp.addf('estanque-combustible','sensor_nivel','Sensor de nivel','select',10,'["Sí","No"]'::jsonb);
select pg_temp.addf('estanque-combustible','equipo_asociado','Equipo asociado (Grupo electrógeno)','text',11);
select pg_temp.addf('estanque-combustible','ubicacion','Ubicación','text',12);

-- ------------------------------------------------------------
-- 6) Campos técnicos extra para Bomba de agua (si no existen)
-- ------------------------------------------------------------
select pg_temp.addf('bombas-agua','caudal','Caudal (m³/h)','text',20);
select pg_temp.addf('bombas-agua','altura','Altura manométrica (m)','text',21);
select pg_temp.addf('bombas-agua','potencia','Potencia (kW)','text',22);

-- ------------------------------------------------------------
-- 7) Asegurar Subtipo en todos los tipos (por si faltara)
-- ------------------------------------------------------------
do $$
declare r record; v_tipo int;
begin
  for r in select id from public.cmdb_asset_types loop
    if not exists (select 1 from public.cmdb_field_defs where asset_type_id = r.id and key = 'subtipo') then
      select sort_order into v_tipo from public.cmdb_field_defs where asset_type_id = r.id and key = 'tipo';
      if v_tipo is null then v_tipo := 0; end if;
      update public.cmdb_field_defs set sort_order = sort_order + 1 where asset_type_id = r.id and sort_order > v_tipo;
      insert into public.cmdb_field_defs (asset_type_id, key, label, field_type, required, sort_order)
        values (r.id, 'subtipo', 'Subtipo', 'text', false, v_tipo + 1);
    end if;
  end loop;
end$$;

drop function pg_temp.mk_type(text, text, text, text);
drop function pg_temp.addf(text, text, text, cmdb_field_type, int, jsonb);
