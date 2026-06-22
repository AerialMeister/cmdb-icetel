import { useEffect, useState } from 'react'
import Modal from './Modal.jsx'
import { getFieldDefs, saveFieldDef, deleteFieldDef, slugify } from '../lib/api.js'
import { IconPlus, IconTrash } from './Icons.jsx'

const TIPOS = [
  { v: 'text', l: 'Texto' },
  { v: 'number', l: 'Número' },
  { v: 'boolean', l: 'Sí/No' },
  { v: 'select', l: 'Lista' },
]

export default function FieldDefsEditor({ type, onClose }) {
  const [defs, setDefs] = useState(null)
  const [adding, setAdding] = useState(false)
  const [label, setLabel] = useState('')
  const [ftype, setFtype] = useState('text')
  const [options, setOptions] = useState('')
  const [required, setRequired] = useState(false)
  const [err, setErr] = useState('')

  const load = () => getFieldDefs(type.id).then(setDefs).catch(e => setErr(e.message))
  useEffect(() => { load() /* eslint-disable-next-line */ }, [type.id])

  const add = async () => {
    if (!label.trim()) { setErr('La etiqueta es obligatoria.'); return }
    setErr('')
    try {
      await saveFieldDef({
        asset_type_id: type.id,
        key: slugify(label) || ('campo_' + Date.now()),
        label: label.trim(), field_type: ftype,
        options: ftype === 'select' ? options.split(',').map(s => s.trim()).filter(Boolean) : null,
        required, sort_order: (defs?.length || 0) + 1,
      })
      setLabel(''); setFtype('text'); setOptions(''); setRequired(false); setAdding(false)
      load()
    } catch (e) { setErr(e.message) }
  }

  const remove = async (f) => {
    if (!confirm(`¿Eliminar el campo "${f.label}"? Los datos guardados en ese campo dejarán de mostrarse.`)) return
    try { await deleteFieldDef(f.id); load() } catch (e) { alert(e.message) }
  }

  return (
    <Modal size="lg" title={`Campos · ${type.name}`} onClose={onClose}
      footer={<button className="btn btn-primary" onClick={onClose}>Listo</button>}>
      {err && <div className="error-text">{err}</div>}

      {defs === null ? <div className="spinner" /> : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Etiqueta</th><th>Clave</th><th>Tipo</th><th>Obl.</th><th></th></tr></thead>
            <tbody>
              {defs.map(f => (
                <tr key={f.id} style={{ cursor: 'default' }}>
                  <td style={{ fontWeight: 600 }}>{f.label}</td>
                  <td className="id-cell">{f.key}</td>
                  <td><span className="tag">{TIPOS.find(t => t.v === f.field_type)?.l || f.field_type}</span>
                    {f.field_type === 'select' && f.options?.length ? <span className="hint"> {f.options.join(', ')}</span> : null}</td>
                  <td>{f.required ? 'Sí' : '—'}</td>
                  <td><button className="btn-ghost" title="Eliminar" onClick={() => remove(f)}><IconTrash width={16} height={16} /></button></td>
                </tr>
              ))}
              {defs.length === 0 && <tr><td colSpan={5}><div className="empty">Sin campos.</div></td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {adding ? (
        <div style={{ marginTop: 16, border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
          <div className="fielddef-row">
            <div className="field">
              <label>Etiqueta</label>
              <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ej: Potencia aparente" />
            </div>
            <div className="field">
              <label>Tipo de dato</label>
              <select value={ftype} onChange={(e) => setFtype(e.target.value)}>
                {TIPOS.map(t => <option key={t.v} value={t.v}>{t.l}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="switch" style={{ cursor: 'pointer' }}>
                <span className={'toggle' + (required ? ' on' : '')} onClick={() => setRequired(r => !r)} />
                Obligatorio
              </label>
            </div>
            <button className="btn btn-primary" onClick={add}>Agregar</button>
          </div>
          {ftype === 'select' && (
            <div className="field" style={{ marginTop: 12 }}>
              <label>Opciones (separadas por coma)</label>
              <input type="text" value={options} onChange={(e) => setOptions(e.target.value)} placeholder="CRAC, CRAH, HVAC" />
            </div>
          )}
          <div style={{ marginTop: 10 }}><button className="btn btn-sm" onClick={() => setAdding(false)}>Cancelar</button></div>
        </div>
      ) : (
        <button className="btn" style={{ marginTop: 16 }} onClick={() => setAdding(true)}><IconPlus width={18} height={18} /> Agregar campo</button>
      )}
    </Modal>
  )
}
