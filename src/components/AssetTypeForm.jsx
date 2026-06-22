import { useState } from 'react'
import Modal from './Modal.jsx'
import { saveAssetType, slugify } from '../lib/api.js'

const ILUSTRACIONES = [
  { key: 'generic', label: 'Genérica' },
  { key: 'ups', label: 'UPS modular' },
  { key: 'genset', label: 'Grupo electrógeno' },
  { key: 'planta_cc', label: 'Planta CC' },
  { key: 'tablero', label: 'Tablero eléctrico' },
  { key: 'banco_bateria', label: 'Banco de baterías' },
  { key: 'celda_mt', label: 'Celda MT' },
  { key: 'transformador_mt', label: 'Transformador MT' },
  { key: 'bomba', label: 'Bomba de agua' },
  { key: 'torre_enfriamiento', label: 'Torre de enfriamiento' },
  { key: 'chiller', label: 'Chiller' },
  { key: 'ahc', label: 'AHC · Manejadora de aire' },
  { key: 'acu', label: 'ACU · Unidad A/A' },
  { key: 'estanque_combustible', label: 'Estanque de combustible' },
  { key: 'clima', label: 'Climatización (CRAC/CRAH o split según campo "tipo")' },
]

export default function AssetTypeForm({ type, systemId, onClose, onSaved }) {
  const isNew = !type.id
  const [name, setName] = useState(type.name || '')
  const [description, setDescription] = useState(type.description || '')
  const [illustration, setIllustration] = useState(type.illustration || 'generic')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const submit = async () => {
    if (!name.trim()) { setErr('El nombre es obligatorio.'); return }
    setBusy(true); setErr('')
    try {
      await saveAssetType({
        id: type.id, system_id: type.system_id || systemId,
        name: name.trim(), slug: type.slug || slugify(name),
        description, illustration, sort_order: type.sort_order ?? 99,
      })
      onSaved()
    } catch (e) { setErr(e.message); setBusy(false) }
  }

  return (
    <Modal title={isNew ? 'Nuevo tipo de activo' : 'Editar tipo'} onClose={onClose}
      footer={<>
        <button className="btn" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={submit} disabled={busy}>{busy ? 'Guardando…' : 'Guardar'}</button>
      </>}>
      {err && <div className="error-text">{err}</div>}
      <div className="field">
        <label>Nombre</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="UPS" />
      </div>
      <div className="field">
        <label>Descripción</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="field">
        <label>Ilustración al abrir el activo</label>
        <select value={illustration} onChange={(e) => setIllustration(e.target.value)}>
          {ILUSTRACIONES.map(i => <option key={i.key} value={i.key}>{i.label}</option>)}
        </select>
        <span className="hint">Define la imagen esquemática que se muestra en el detalle del activo.</span>
      </div>
      {isNew && <p className="hint">Tras crear el tipo podrás definir sus campos con el botón <b>Campos</b>.</p>}
    </Modal>
  )
}
