import { useEffect, useState, useRef } from 'react'
import Modal from './Modal.jsx'
import { getFieldDefs, saveAsset, deleteAsset, getAssets, getAssetTypes } from '../lib/api.js'
import { useAuth } from '../auth/AuthContext.jsx'
import FieldDefsEditor from './FieldDefsEditor.jsx'
import { supabase } from '../supabaseClient.js'

// Detecta si un field_def es el campo "tableros aguas abajo"
const isTablerosAbajo = (f) =>
  ['tablero_aguas_abajo', 'tableros_aguas_abajo', 'aguas_abajo', 'tablero aguas abajo', 'tableros aguas abajo']
    .includes((f.key || '').toLowerCase().trim()) ||
  ['tablero aguas abajo', 'tableros aguas abajo', 'aguas abajo']
    .includes((f.label || '').toLowerCase().trim())

// Campo especial: lista de tableros aguas abajo con búsqueda
function TablerosAbajoField({ value, onChange }) {
  // value es un array de strings (nombres de tableros)
  const parsed = (() => {
    if (Array.isArray(value)) return value
    if (typeof value === 'string' && value.trim()) {
      try { const p = JSON.parse(value); if (Array.isArray(p)) return p } catch {}
      return value.split(',').map(s => s.trim()).filter(Boolean)
    }
    return ['']
  })()

  const [items, setItems] = useState(parsed.length ? parsed : [''])
  const [tableros, setTableros] = useState([])   // todos los tableros disponibles
  const [query, setQuery] = useState({})          // { index: string }
  const [open, setOpen] = useState(null)          // índice del dropdown abierto

  // Cargar todos los activos de tipo "Tablero eléctrico"
  useEffect(() => {
    async function load() {
      try {
        const { data: types } = await supabase
          .from('cmdb_asset_types')
          .select('id, name')
          .ilike('name', '%tablero%')
        if (!types?.length) return
        const ids = types.map(t => t.id)
        const { data: assets } = await supabase
          .from('cmdb_assets')
          .select('id, name')
          .in('asset_type_id', ids)
          .order('name')
        setTableros(assets || [])
      } catch {}
    }
    load()
  }, [])

  const update = (newItems) => {
    setItems(newItems)
    onChange(JSON.stringify(newItems.filter(Boolean)))
  }

  const setItem = (i, v) => { const n = [...items]; n[i] = v; update(n) }
  const addItem  = () => { update([...items, '']) }
  const removeItem = (i) => { const n = items.filter((_, idx) => idx !== i); update(n.length ? n : ['']) }

  const filtered = (i) => {
    const q = (query[i] || '').toLowerCase()
    return tableros.filter(t => t.name.toLowerCase().includes(q))
  }

  return (
    <div>
      {items.map((val, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'center', position: 'relative' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              type="text"
              value={query[i] !== undefined ? query[i] : val}
              placeholder="Buscar tablero…"
              style={{ width: '100%' }}
              onFocus={() => { setOpen(i); setQuery(q => ({ ...q, [i]: val })) }}
              onChange={e => setQuery(q => ({ ...q, [i]: e.target.value }))}
              onBlur={() => setTimeout(() => setOpen(null), 150)}
            />
            {open === i && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                background: 'var(--panel)', border: '1px solid var(--border)',
                borderRadius: 8, maxHeight: 180, overflowY: 'auto', boxShadow: 'var(--shadow)',
              }}>
                {filtered(i).length === 0 && (
                  <div style={{ padding: '8px 12px', color: 'var(--muted)', fontSize: 13 }}>Sin resultados</div>
                )}
                {filtered(i).map(t => (
                  <div key={t.id}
                    style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 13 }}
                    onMouseDown={() => { setItem(i, t.name); setQuery(q => { const n = {...q}; delete n[i]; return n }) }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--border)'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}
                  >
                    {t.name}
                  </div>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            className="btn btn-sm"
            style={{ color: 'var(--danger, #dc2626)', flexShrink: 0 }}
            onClick={() => removeItem(i)}
            title="Quitar"
          >✕</button>
        </div>
      ))}
      <button type="button" className="btn btn-sm" onClick={addItem} style={{ marginTop: 4 }}>
        + Agregar tablero
      </button>
    </div>
  )
}

export default function AssetForm({ asset, type, onClose, onSaved, onDeleted }) {
  const { isAdmin } = useAuth()
  const isNew = !asset.id

  const [defs, setDefs]         = useState(null)
  const [name, setName]         = useState(asset.name || '')
  const [altName, setAltName]   = useState(asset.alt_name || '')
  const [status, setStatus]     = useState(asset.status || '')
  const [data, setData]         = useState(asset.data || {})
  const [busy, setBusy]         = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [err, setErr]           = useState('')
  const [managingFields, setManagingFields] = useState(false)

  const loadDefs = () => getFieldDefs(type.id).then(setDefs).catch(e => setErr(e.message))
  useEffect(() => { loadDefs() }, [type.id])

  const setField = (k, v) => setData(d => ({ ...d, [k]: v }))

  const submit = async () => {
    if (!name.trim()) { setErr('El nombre es obligatorio.'); return }
    const missing = (defs || []).filter(f => f.required && !String(data[f.key] ?? '').trim())
    if (missing.length) { setErr('Faltan campos obligatorios: ' + missing.map(m => m.label).join(', ')); return }
    setBusy(true); setErr('')
    try {
      await saveAsset({
        id: asset.id, asset_type_id: type.id, name: name.trim(),
        alt_name: altName.trim() || null, status: status || null, data,
      })
      onSaved()
    } catch (e) { setErr(e.message); setBusy(false) }
  }

  const handleDelete = async () => {
    if (!confirm(`¿Eliminar el activo "${asset.name}"? Esta acción no se puede deshacer.`)) return
    setDeleting(true); setErr('')
    try {
      await deleteAsset(asset.id)
      onDeleted ? onDeleted() : onSaved()
    } catch (e) { setErr(e.message); setDeleting(false) }
  }

  if (!defs) return <Modal title="Cargando…" onClose={onClose}><div className="spinner" /></Modal>

  return (
    <>
      <Modal
        size="lg"
        title={isNew ? 'Nuevo · ' + type.name : 'Editar · ' + asset.name}
        onClose={onClose}
        footer={
          <>
            {!isNew && isAdmin && (
              <button
                className="btn"
                style={{ color: 'var(--danger, #dc2626)', borderColor: 'var(--danger, #dc2626)', marginRight: 'auto' }}
                onClick={handleDelete}
                disabled={deleting || busy}
              >
                {deleting ? 'Eliminando…' : '🗑 Eliminar activo'}
              </button>
            )}
            <button className="btn" onClick={onClose} disabled={busy || deleting}>Cancelar</button>
            <button className="btn btn-primary" onClick={submit} disabled={busy || deleting}>
              {busy ? 'Guardando…' : 'Guardar'}
            </button>
          </>
        }
      >
        {err && <div className="error-text">{err}</div>}

        {!isNew && (
          <div className="field">
            <label>ID único (no cambia)</label>
            <input type="text" value={asset.id} readOnly style={{ fontFamily: 'monospace', color: 'var(--muted)' }} />
            <span className="hint">El ITSM referencia este ID; el nombre puede cambiar sin perder el vínculo.</span>
          </div>
        )}

        <div className="form-grid">
          <div className="field">
            <label>Nombre</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label>Nombre alternativo <span className="hint">(opcional)</span></label>
            <input type="text" value={altName} onChange={(e) => setAltName(e.target.value)} />
          </div>
          <div className="field">
            <label>Estado</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">— (sin estado)</option>
              <option value="on">ON</option>
              <option value="off">OFF</option>
            </select>
          </div>
        </div>

        <div className="form-grid">
          {defs.map(f => (
            <div className="field" key={f.id} style={isTablerosAbajo(f) ? { gridColumn: '1 / -1' } : {}}>
              <label>{f.label}{f.required && ' *'}</label>
              {isTablerosAbajo(f) ? (
                <TablerosAbajoField
                  value={data[f.key]}
                  onChange={v => setField(f.key, v)}
                />
              ) : f.field_type === 'select' ? (
                <select value={data[f.key] || ''} onChange={(e) => setField(f.key, e.target.value)}>
                  <option value="">—</option>
                  {(f.options || []).map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : f.field_type === 'boolean' ? (
                <select value={data[f.key] ?? ''} onChange={(e) => setField(f.key, e.target.value)}>
                  <option value="">—</option>
                  <option value="si">Si</option>
                  <option value="no">No</option>
                </select>
              ) : (
                <input
                  type={f.field_type === 'number' ? 'number' : 'text'}
                  value={data[f.key] ?? ''}
                  onChange={(e) => setField(f.key, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>

        {defs.length === 0 && (
          <p className="hint">Este tipo no tiene campos definidos aún. Usa <b>Gestionar campos</b> para agregarlos.</p>
        )}

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, marginTop: 4, display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-sm" onClick={() => setManagingFields(true)} style={{ color: 'var(--brand-light)' }}>
            ⚙ Gestionar campos del tipo
          </button>
          <span className="hint">Agrega o elimina columnas de información para todos los activos de este tipo</span>
        </div>
      </Modal>

      {managingFields && (
        <FieldDefsEditor type={type} onClose={() => { setManagingFields(false); loadDefs() }} />
      )}
    </>
  )
}
