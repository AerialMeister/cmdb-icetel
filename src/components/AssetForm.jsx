import { useEffect, useState } from 'react'
import Modal from './Modal.jsx'
import { getFieldDefs, saveAsset, deleteAsset } from '../lib/api.js'
import { useAuth } from '../auth/AuthContext.jsx'
import FieldDefsEditor from './FieldDefsEditor.jsx'

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
            {/* Botón eliminar — solo para admins editando un activo existente */}
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
            <div className="field" key={f.id}>
              <label>{f.label}{f.required && ' *'}</label>
              {f.field_type === 'select' ? (
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
