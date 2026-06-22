import { useState } from 'react'
import Modal from './Modal.jsx'
import { saveSystem, slugify } from '../lib/api.js'

const ICONS = [
  { key: 'rayo', label: 'Eléctrico (rayo)' },
  { key: 'clima', label: 'Mecánico (clima)' },
  { key: 'edificio', label: 'Arquitectónico (edificio)' },
  { key: 'sistema', label: 'Genérico' },
]

export default function SystemForm({ system, onClose, onSaved }) {
  const isNew = !system.id
  const [name, setName] = useState(system.name || '')
  const [description, setDescription] = useState(system.description || '')
  const [icon, setIcon] = useState(system.icon || 'sistema')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const submit = async () => {
    if (!name.trim()) { setErr('El nombre es obligatorio.'); return }
    setBusy(true); setErr('')
    try {
      await saveSystem({
        id: system.id, name: name.trim(), description,
        slug: system.slug || slugify(name), icon, sort_order: system.sort_order ?? 99,
      })
      onSaved()
    } catch (e) { setErr(e.message); setBusy(false) }
  }

  return (
    <Modal title={isNew ? 'Nuevo sistema' : 'Editar sistema'} onClose={onClose}
      footer={<>
        <button className="btn" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={submit} disabled={busy}>{busy ? 'Guardando…' : 'Guardar'}</button>
      </>}>
      {err && <div className="error-text">{err}</div>}
      <div className="field">
        <label>Nombre</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Sistema Eléctrico" />
      </div>
      <div className="field">
        <label>Descripción</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="field">
        <label>Ícono</label>
        <select value={icon} onChange={(e) => setIcon(e.target.value)}>
          {ICONS.map(i => <option key={i.key} value={i.key}>{i.label}</option>)}
        </select>
      </div>
    </Modal>
  )
}
