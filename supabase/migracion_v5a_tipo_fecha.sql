-- ============================================================
-- CMDB Icetel - Migración v5a: nuevo tipo de campo "date"
-- Ejecutar en: Supabase > SQL Editor. Idempotente.
--
-- IMPORTANTE: este archivo va SOLO y PRIMERO.
-- PostgreSQL no permite usar un valor de enum recién agregado dentro de
-- la misma transacción en que se creó. Por eso la creación del tipo
-- "Extintores" (que usa campos date) va en un archivo aparte, v5b,
-- que debe ejecutarse DESPUÉS de este.
-- ============================================================

alter type cmdb_field_type add value if not exists 'date';
