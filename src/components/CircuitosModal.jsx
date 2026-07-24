import { useCallback, useEffect, useState } from 'react'
import Modal from './Modal.jsx'
import { IconPlus, IconEdit, IconTrash } from './Icons.jsx'
import { getCircuitos, saveCircuito, deleteCircuito, reorderCircuitos } from '../lib/api.js'

/* Símbolo IEC de interruptor automático (protección magnetotérmica) */
function BreakerSymbol({ size = 46, color = '#1d4ed8' }) {
  return (
    <svg width={size} height={size * 1.25} viewBox="0 0 40 50" fill="none"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      {/* conductor superior */}
      <path d="M20 1 V13" />
      {/* contacto fijo + cruz que identifica al interruptor automático */}
      <path d="M15.5 8.5 L24.5 17.5 M24.5 8.5 L15.5 17.5" strokeWidth={1.6} />
      {/* contacto móvil (abierto) */}
      <path d="M20 37 L31 15" />
      {/* pivote */}
      <circle cx="20" cy="37" r="2.4" fill={color} stroke="none" />
      <circle cx="20" cy="13" r="2.4" fill={color} stroke="none" />
      {/* conductor inferior */}
      <path d="M20 37 V49" />
    </svg>
  )
}

const EMPTY = { marca: '', capacidad: '', numero_circuito: '', tag_circuito: '' }

export default function CircuitosModal({ asset, canEdit, onClose }) {
  const [items, setItems]     = useState(null)
  const [error, setError]     = useState('')
  const [editing, setEditing] = useState(null) // { ...circuito } o { tipo, _new: true }
  const [busy, setBusy]       = useState(false)

  const load = useCallback(async () => {
    try {
      setError('')
      const rows = await getCircuitos(asset.id)
      setItems(rows)
    } catch (e) {
      setItems([])
      setError(
        /relation .* does not exist|schema cache/i.test(e.message || '')
          ? 'La tabla cmdb_circuitos aún no existe. Ejecuta supabase/migracion_v4_circuitos.sql en Supabase > SQL Editor.'
          : e.message
      )
    }
  }, [asset.id])
  useEffect(() => { load() }, [load])

  const general = (items || []).find(c => c.tipo === 'general') || null
  const cargas  = (items || []).filter(c => c.tipo !== 'general')

  const save = async (form) => {
    setBusy(true)
    try {
      const sort = form.sort_order ?? (form.tipo === 'general' ? 0 : cargas.length)
      await saveCircuito({ ...form, asset_id: asset.id, sort_order: sort })
      setEditing(null)
      await load()
    } catch (e) { alert('No se pudo guardar: ' + e.message) }
    finally { setBusy(false) }
  }

  const remove = async (c) => {
    const etiqueta = c.tipo === 'general' ? 'la protección general' : ('el circuito ' + (c.numero_circuito || c.tag_circuito || ''))
    if (!confirm('¿Eliminar ' + etiqueta + '?')) return
    setBusy(true)
    try { await deleteCircuito(c.id); await load() }
    catch (e) { alert('No se pudo eliminar: ' + e.message) }
    finally { setBusy(false) }
  }

  const move = async (idx, dir) => {
    const arr = [...cargas]
    const j = idx + dir
    if (j < 0 || j >= arr.length) return
    ;[arr[idx], arr[j]] = [arr[j], arr[idx]]
    setBusy(true)
    try {
      await reorderCircuitos(arr.map((c, i) => ({ id: c.id, sort_order: i })))
      await load()
    } catch (e) { alert('No se pudo reordenar: ' + e.message) }
    finally { setBusy(false) }
  }

  return (
    <Modal size="lg" title={'Detalle de circuitos — ' + asset.name} onClose={onClose}
      footer={<>
        <span style={{ marginRight: 'auto', fontSize: 12, color: 'var(--muted)' }}>
          {items ? (cargas.length + ' circuito' + (cargas.length === 1 ? '' : 's') + ' de carga' + (general ? ' · general definido' : '')) : ''}
        </span>
        <button className="btn" onClick={onClose}>Cerrar</button>
      </>}>

      {error && <div className="banner banner-warn" style={{ margin: 0 }}>{error}</div>}

      {items === null ? <div style={{ textAlign: 'center', padding: 30 }}><div className="spinner" /></div> : (
        <>
          <div className="circ-canvas">
            {/* ---- Protección general ---- */}
            <div className="circ-general-wrap">
              {general ? (
                <BlockCard c={general} canEdit={canEdit} busy={busy}
                  onEdit={() => setEditing(general)} onDelete={() => remove(general)} />
              ) : canEdit ? (
                <button className="circ-add circ-add-general"
                  onClick={() => setEditing({ ...EMPTY, tipo: 'general', _new: true })}>
                  <IconPlus width={18} height={18} /> Definir protección general
                </button>
              ) : (
                <div className="circ-empty-slot">Sin protección general registrada</div>
              )}
            </div>

            {/* ---- Bajada a la barra ---- */}
            <div className="circ-drop" />

            {/* ---- Barra / busbar ---- */}
            <div className="circ-bus">
              <span className="circ-bus-label">BARRA</span>
            </div>

            {/* ---- Circuitos de carga ---- */}
            <div className="circ-branches">
              {cargas.map((c, i) => (
                <div className="circ-branch" key={c.id}>
                  <div className="circ-branch-line" />
                  <BlockCard c={c} canEdit={canEdit} busy={busy}
                    onEdit={() => setEditing(c)} onDelete={() => remove(c)}
                    onLeft={i > 0 ? () => move(i, -1) : null}
                    onRight={i < cargas.length - 1 ? () => move(i, 1) : null} />
                </div>
              ))}

              {canEdit && (
                <div className="circ-branch">
                  <div className="circ-branch-line" />
                  <button className="circ-add"
                    onClick={() => setEditing({ ...EMPTY, tipo: 'carga', _new: true, numero_circuito: 'C' + (cargas.length + 1) })}>
                    <IconPlus width={20} height={20} />
                    <span>Agregar circuito</span>
                  </button>
                </div>
              )}

              {cargas.length === 0 && !canEdit && (
                <div className="circ-empty-slot" style={{ marginTop: 22 }}>Sin circuitos registrados</div>
              )}
            </div>
          </div>

          {/* ---- Tabla resumen ---- */}
          {cargas.length > 0 && (
            <div className="table-wrap" style={{ marginTop: 4 }}>
              <table>
                <thead>
                  <tr><th>N° circuito</th><th>Tag</th><th>Marca</th><th>Capacidad</th></tr>
                </thead>
                <tbody>
                  {cargas.map(c => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 600 }}>{c.numero_circuito || '—'}</td>
                      <td>{c.tag_circuito || '—'}</td>
                      <td>{c.marca || '—'}</td>
                      <td>{c.capacidad || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {editing && (
        <CircuitoForm circuito={editing} busy={busy}
          onCancel={() => setEditing(null)} onSave={save} />
      )}
    </Modal>
  )
}

/* --- Bloque cuadrado con el símbolo de protección --- */
function BlockCard({ c, canEdit, busy, onEdit, onDelete, onLeft, onRight }) {
  const esGeneral = c.tipo === 'general'
  return (
    <div className={'circ-block' + (esGeneral ? ' circ-block-general' : '')}>
      {canEdit && (
        <div className="circ-block-actions">
          {onLeft  && <button className="btn-ghost" title="Mover a la izquierda" disabled={busy} onClick={onLeft}>‹</button>}
          {onRight && <button className="btn-ghost" title="Mover a la derecha"  disabled={busy} onClick={onRight}>›</button>}
          <button className="btn-ghost" title="Editar"   disabled={busy} onClick={onEdit}><IconEdit width={15} height={15} /></button>
          <button className="btn-ghost" title="Eliminar" disabled={busy} onClick={onDelete}><IconTrash width={15} height={15} /></button>
        </div>
      )}
      <div className="circ-block-tag">{esGeneral ? 'GENERAL' : (c.numero_circuito || '—')}</div>
      <BreakerSymbol size={42} color={esGeneral ? '#0f3d6b' : '#1d4ed8'} />
      <div className="circ-block-cap">{c.capacidad || '—'}</div>
      <div className="circ-block-marca">{c.marca || 'sin marca'}</div>
      {!esGeneral && <div className="circ-block-desc" title={c.tag_circuito || ''}>{c.tag_circuito || 'sin tag'}</div>}
      {esGeneral && c.tag_circuito && <div className="circ-block-desc">{c.tag_circuito}</div>}
    </div>
  )
}

/* --- Formulario de un bloque (modal anidado) --- */
function CircuitoForm({ circuito, busy, onCancel, onSave }) {
  const [f, setF] = useState({
    id: circuito.id, tipo: circuito.tipo || 'carga', sort_order: circuito.sort_order,
    marca: circuito.marca || '', capacidad: circuito.capacidad || '',
    numero_circuito: circuito.numero_circuito || '', tag_circuito: circuito.tag_circuito || '',
  })
  const set = (k) => (e) => setF(p => ({ ...p, [k]: e.target.value }))
  const esGeneral = f.tipo === 'general'

  return (
    <Modal size="sm" onClose={onCancel}
      title={(circuito._new ? 'Nuevo ' : 'Editar ') + (esGeneral ? 'protección general' : 'circuito')}
      footer={<>
        <button className="btn" onClick={onCancel} disabled={busy}>Cancelar</button>
        <button className="btn btn-primary" disabled={busy} onClick={() => onSave(f)}>
          {busy ? 'Guardando…' : 'Guardar'}
        </button>
      </>}>
      <div className="field">
        <label>Marca de la protección</label>
        <input type="text" value={f.marca} onChange={set('marca')} placeholder="Schneider, ABB, Siemens…" />
      </div>
      <div className="field">
        <label>Capacidad</label>
        <input type="text" value={f.capacidad} onChange={set('capacidad')} placeholder="63 A, 3x100 A…" />
      </div>
      <div className="field">
        <label>Número del circuito</label>
        <input type="text" value={f.numero_circuito} onChange={set('numero_circuito')}
          placeholder={esGeneral ? 'Opcional' : 'C1, C2, 12…'} />
      </div>
      <div className="field">
        <label>Tag de circuito</label>
        <input type="text" value={f.tag_circuito} onChange={set('tag_circuito')} placeholder="Carga alimentada / tag" />
      </div>
    </Modal>
  )
}
