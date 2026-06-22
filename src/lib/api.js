import { supabase } from '../supabaseClient.js'

// ---------- Sistemas ----------
export async function getSystems() {
  const { data, error } = await supabase
    .from('cmdb_systems')
    .select('*')
    .order('sort_order').order('name')
  if (error) throw error
  return data
}
export async function saveSystem(s) {
  const row = { name: s.name, slug: s.slug, description: s.description || null, icon: s.icon || 'sistema', sort_order: s.sort_order ?? 0 }
  if (s.id) {
    const { error } = await supabase.from('cmdb_systems').update(row).eq('id', s.id)
    if (error) throw error
  } else {
    const { error } = await supabase.from('cmdb_systems').insert(row)
    if (error) throw error
  }
}
export async function deleteSystem(id) {
  const { error } = await supabase.from('cmdb_systems').delete().eq('id', id)
  if (error) throw error
}

// ---------- Tipos de activo ----------
export async function getAssetTypes(systemId) {
  let q = supabase.from('cmdb_asset_types').select('*').order('name')
  if (systemId) q = q.eq('system_id', systemId)
  const { data, error } = await q
  if (error) throw error
  return data
}
export async function saveAssetType(t) {
  const row = {
    system_id: t.system_id, name: t.name, slug: t.slug,
    description: t.description || null, illustration: t.illustration || 'generic',
    sort_order: t.sort_order ?? 0,
  }
  if (t.id) {
    const { error } = await supabase.from('cmdb_asset_types').update(row).eq('id', t.id)
    if (error) throw error
  } else {
    const { error } = await supabase.from('cmdb_asset_types').insert(row)
    if (error) throw error
  }
}
export async function deleteAssetType(id) {
  const { error } = await supabase.from('cmdb_asset_types').delete().eq('id', id)
  if (error) throw error
}

// ---------- Campos (field defs) ----------
export async function getFieldDefs(assetTypeId) {
  const { data, error } = await supabase
    .from('cmdb_field_defs').select('*')
    .eq('asset_type_id', assetTypeId)
    .order('sort_order')
  if (error) throw error
  return data
}
export async function saveFieldDef(f) {
  const row = {
    asset_type_id: f.asset_type_id, key: f.key, label: f.label,
    field_type: f.field_type || 'text',
    options: f.field_type === 'select' ? (f.options || []) : null,
    required: !!f.required, sort_order: f.sort_order ?? 0,
  }
  if (f.id) {
    const { error } = await supabase.from('cmdb_field_defs').update(row).eq('id', f.id)
    if (error) throw error
  } else {
    const { error } = await supabase.from('cmdb_field_defs').insert(row)
    if (error) throw error
  }
}
export async function deleteFieldDef(id) {
  const { error } = await supabase.from('cmdb_field_defs').delete().eq('id', id)
  if (error) throw error
}

// ---------- Activos ----------
export async function getAssets(assetTypeId) {
  const { data, error } = await supabase
    .from('cmdb_assets').select('*')
    .eq('asset_type_id', assetTypeId)
    .order('name')
  if (error) throw error
  return data
}
export async function saveAsset(a) {
  const row = {
    asset_type_id: a.asset_type_id, name: a.name, alt_name: a.alt_name || null,
    status: a.status || null, data: a.data || {}, image_url: a.image_url || null,
  }
  if (a.id) {
    const { data, error } = await supabase.from('cmdb_assets').update(row).eq('id', a.id).select().single()
    if (error) throw error
    return data
  } else {
    const { data, error } = await supabase.from('cmdb_assets').insert(row).select().single()
    if (error) throw error
    return data
  }
}
export async function deleteAsset(id) {
  const { error } = await supabase.from('cmdb_assets').delete().eq('id', id)
  if (error) throw error
}

// ---------- Importación masiva ----------
export async function getAllAssetTypes() {
  const { data, error } = await supabase
    .from('cmdb_asset_types')
    .select('id, name, slug, illustration, system_id, cmdb_systems(name)')
    .order('name')
  if (error) throw error
  return data
}

// Inserta activos nuevos en lotes. rows: [{ asset_type_id, name, alt_name, status, data }]
export async function insertAssetsBulk(rows) {
  let inserted = 0
  for (let i = 0; i < rows.length; i += 200) {
    const chunk = rows.slice(i, i + 200)
    const { error } = await supabase.from('cmdb_assets').insert(chunk)
    if (error) throw error
    inserted += chunk.length
  }
  return inserted
}

// Actualiza activos existentes en lotes (cada row incluye id). Usa upsert por PK.
export async function upsertAssetsBulk(rows) {
  let n = 0
  for (let i = 0; i < rows.length; i += 200) {
    const chunk = rows.slice(i, i + 200)
    const { error } = await supabase.from('cmdb_assets').upsert(chunk, { onConflict: 'id' })
    if (error) throw error
    n += chunk.length
  }
  return n
}

// ---------- Gestión de usuarios (Edge Function) ----------
export async function adminUsers(action, payload = {}) {
  const { data, error } = await supabase.functions.invoke('admin-users', {
    body: { action, ...payload },
  })
  if (error) {
    // intenta extraer el mensaje del cuerpo de la respuesta
    let msg = error.message
    try { const ctx = await error.context?.json?.(); if (ctx?.error) msg = ctx.error } catch { /* noop */ }
    throw new Error(msg)
  }
  if (data?.error) throw new Error(data.error)
  return data
}

// Slug helper (quita acentos -> a-z0-9 con guiones)
export function slugify(s) {
  const noAccents = String(s).toLowerCase().normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
  return noAccents.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50)
}
