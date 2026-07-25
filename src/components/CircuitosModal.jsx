import { useCallback, useEffect, useMemo, useState } from 'react'
import Modal from './Modal.jsx'
import { IconPlus, IconEdit, IconTrash } from './Icons.jsx'
import { getCircuitos, saveCircuito, deleteCircuito, reorderCircuitos } from '../lib/api.js'

/* ------------------------------------------------------------------
   Símbolo IEC del interruptor automático.
   La cantidad de polos sigue al campo "fases": 1 polo si es monofásica,
   3 polos unidos por el enlace mecánico punteado si es trifásica.
------------------------------------------------------------------- */
function Polo({ cx, color }) {
  return (
    <g transform={`translate(${cx} 0)`}>
      {/* conductor superior */}
      <path d="M0 2 V15" />
      {/* contacto fijo: la cruz identifica al interruptor automático */}
      <path d="M-4.5 10.5 L4.5 19.5 M4.5 10.5 L-4.5 19.5" strokeWidth={1.5} />
      {/* contacto móvil (abierto) */}
      <path d="M0 39 L10 17" />
      <circle cx="0" cy="15" r="2.3" fill={color} stroke="none" />
      <circle cx="0" cy="39" r="2.3" fill={color} stroke="none" />
      {/* conductor inferior */}
      <path d="M0 39 V50" />
    </g>
  )
}

function BreakerSymbol({ fases, height = 50, color = '#1d4ed8' }) {
  const tri = fases === 'trifasica'
  const w = tri ? 76 : 34
  return (
    <svg
      height={height}
      width={(height * w) / 52}
      viewBox={`0 0 ${w} 52`}
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {tri ? (
        <>
          <Polo cx={13} color={color} />
          <Polo cx={38} color={color} />
          <Polo cx={63} color={color} />
          {/* enlace mecánico entre polos */}
          <path d="M18 28 H68" strokeWidth={1.4} strokeDasharray="3 3" />
        </>
      ) : (
        <Polo cx={17} color={color} />
      )}
    </svg>
  )
}

const EMPTY = { marca: '', capacidad: '', numero_circuito: '', tag_circuito: '' }

const etiquetaFases = (f) => (f === 'trifasica' ? '3F' : f === 'monofasica' ? '1F' : null)

/* ================================================================== */
export default function CircuitosModal({ asset, canEdit, onClose }) {
  const [items, setItems] = useState(null)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    try {
      setError('')
      setItems(await getCircuitos(asset.id))
    } catch (e) {
      setItems([])
      const msg = e.message || ''
      setError(
        /relation .* does not exist|schema cache/i.test(msg)
          ? 'La tabla cmdb_circuitos aún no existe. Ejecuta supabase/migracion_v4_circuitos.sql en Supabase > SQL Editor.'
          : /parent_id|clase|fases/i.test(msg)
            ? 'Falta la migración del árbol de circuitos. Ejecuta supabase/migracion_v6_circuitos_arbol.sql en Supabase > SQL Editor.'
            : msg
      )
    }
  }, [asset.id])
  useEffect(() => { load() }, [load])

  const lista = items || []

  // Hijos ordenados de un nodo
  const hijos = useCallback(
    (id) => lista.filter((n) => n.parent_id === id).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
    [lista]
  )

  const raiz = lista.find((n) => !n.parent_id) || null

  const save = async (form) => {
    setBusy(true)
    try {
      await saveCircuito({ ...form, asset_id: asset.id })
      setEditing(null)
      await load()
    } catch (e) {
      alert('No se pudo guardar: ' + e.message)
    } finally {
      setBusy(false)
    }
  }

  const remove = async (n) => {
    const conHijos = lista.some((x) => x.parent_id === n.id)
    const que =
      n.clase === 'barra'
        ? 'la barra "' + (n.nombre || 'sin nombre') + '"'
        : n.tipo === 'general'
          ? 'la protección general'
          : 'el circuito ' + (n.numero_circuito || n.tag_circuito || '')
    const aviso = conHijos ? '\n\nOJO: se eliminará también todo lo que cuelga debajo.' : ''
    if (!confirm('¿Eliminar ' + que + '?' + aviso)) return
    setBusy(true)
    try {
      await deleteCircuito(n.id)
      await load()
    } catch (e) {
      alert('No se pudo eliminar: ' + e.message)
    } finally {
      setBusy(false)
    }
  }

  // Mueve un nodo entre sus hermanos
  const move = async (n, dir) => {
    const arr = hijos(n.parent_id)
    const i = arr.findIndex((x) => x.id === n.id)
    const j = i + dir
    if (i < 0 || j < 0 || j >= arr.length) return
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
    setBusy(true)
    try {
      await reorderCircuitos(arr.map((c, k) => ({ id: c.id, sort_order: k })))
      await load()
    } catch (e) {
      alert('No se pudo reordenar: ' + e.message)
    } finally {
      setBusy(false)
    }
  }

  const nuevaBarra = (padre) =>
    setEditing({ _new: true, clase: 'barra', tipo: 'carga', parent_id: padre.id, nombre: '', sort_order: 0 })

  const nuevaProteccion = (barra, idx) =>
    setEditing({
      ...EMPTY, _new: true, clase: 'proteccion', tipo: 'carga',
      parent_id: barra.id, fases: 'monofasica',
      numero_circuito: 'C' + (idx + 1), sort_order: idx,
    })

  const nuevaGeneral = () =>
    setEditing({
      ...EMPTY, _new: true, clase: 'proteccion', tipo: 'general',
      parent_id: null, fases: 'trifasica', sort_order: 0,
    })

  const ctx = { canEdit, busy, hijos, setEditing, remove, move, nuevaBarra, nuevaProteccion }

  // Filas de la tabla resumen (todas las protecciones derivadas, con su barra)
  const filas = useMemo(() => {
    const byId = new Map(lista.map((n) => [n.id, n]))
    return lista
      .filter((n) => n.clase === 'proteccion' && n.tipo !== 'general')
      .map((n) => ({ ...n, barra: byId.get(n.parent_id)?.nombre || '—' }))
      .sort((a, b) => a.barra.localeCompare(b.barra) || (a.sort_order ?? 0) - (b.sort_order ?? 0))
  }, [lista])

  return (
    <Modal size="lg" title={'Detalle de circuitos — ' + asset.name} onClose={onClose}
      footer={<>
        <span style={{ marginRight: 'auto', fontSize: 12, color: 'var(--muted)' }}>
          {items
            ? filas.length + ' protecci' + (filas.length === 1 ? 'ón' : 'ones') +
              ' · ' + lista.filter((n) => n.clase === 'barra').length + ' barra(s)'
            : ''}
        </span>
        <button className="btn" onClick={onClose}>Cerrar</button>
      </>}>

      {error && <div className="banner banner-warn" style={{ margin: 0 }}>{error}</div>}

      {items === null ? (
        <div style={{ textAlign: 'center', padding: 30 }}><div className="spinner" /></div>
      ) : (
        <>
          <div className="circ-canvas">
            <div className="circ-tree">
              {raiz ? (
                raiz.clase === 'barra'
                  ? <NodoBarra n={raiz} ctx={ctx} />
                  : <NodoProteccion n={raiz} ctx={ctx} />
              ) : canEdit ? (
                <button className="circ-add circ-add-general" onClick={nuevaGeneral}>
                  <IconPlus width={18} height={18} /> Definir protección general
                </button>
              ) : (
                <div className="circ-empty-slot">Sin protección general registrada</div>
              )}
            </div>
          </div>

          {filas.length > 0 && (
            <div className="table-wrap" style={{ marginTop: 4 }}>
              <table>
                <thead>
                  <tr>
                    <th>Barra</th><th>N° circuito</th><th>Tag</th>
                    <th>Fases</th><th>Marca</th><th>Capacidad</th>
                  </tr>
                </thead>
                <tbody>
                  {filas.map((c) => (
                    <tr key={c.id}>
                      <td>{c.barra}</td>
                      <td style={{ fontWeight: 600 }}>{c.numero_circuito || '—'}</td>
                      <td>{c.tag_circuito || '—'}</td>
                      <td>{c.fases === 'trifasica' ? 'Trifásica' : c.fases === 'monofasica' ? 'Monofásica' : '—'}</td>
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
        <CircuitoForm nodo={editing} busy={busy} onCancel={() => setEditing(null)} onSave={save} />
      )}
    </Modal>
  )
}

/* --------------------------------------------- Nodo: protección --------- */
function NodoProteccion({ n, ctx, onLeft, onRight }) {
  const barra = ctx.hijos(n.id).find((h) => h.clase === 'barra')
  return (
    <div className="circ-node">
      <BlockCard c={n} ctx={ctx} onLeft={onLeft} onRight={onRight} />
      {barra ? (
        <>
          <div className="circ-drop" />
          <NodoBarra n={barra} ctx={ctx} />
        </>
      ) : ctx.canEdit ? (
        <>
          <div className="circ-drop" />
          <button className="circ-add-bus" disabled={ctx.busy} onClick={() => ctx.nuevaBarra(n)}>
            <IconPlus width={14} height={14} /> Agregar barra
          </button>
        </>
      ) : null}
    </div>
  )
}

/* --------------------------------------------- Nodo: barra -------------- */
function NodoBarra({ n, ctx }) {
  const hijos = ctx.hijos(n.id).filter((h) => h.clase === 'proteccion')
  return (
    <div className="circ-bus-group">
      <div className="circ-bus">
        <span className="circ-bus-label">{n.nombre || 'BARRA'}</span>
        {ctx.canEdit && (
          <span className="circ-bus-actions">
            <button className="btn-ghost" title="Editar barra" disabled={ctx.busy}
              onClick={() => ctx.setEditing(n)}><IconEdit width={14} height={14} /></button>
            <button className="btn-ghost" title="Eliminar barra" disabled={ctx.busy}
              onClick={() => ctx.remove(n)}><IconTrash width={14} height={14} /></button>
          </span>
        )}
      </div>

      <div className="circ-branches">
        {hijos.map((h, i) => (
          <div className="circ-branch" key={h.id}>
            <div className="circ-branch-line" />
            <NodoProteccion n={h} ctx={ctx}
              onLeft={i > 0 ? () => ctx.move(h, -1) : null}
              onRight={i < hijos.length - 1 ? () => ctx.move(h, 1) : null} />
          </div>
        ))}

        {ctx.canEdit && (
          <div className="circ-branch">
            <div className="circ-branch-line" />
            <button className="circ-add" disabled={ctx.busy}
              onClick={() => ctx.nuevaProteccion(n, hijos.length)}>
              <IconPlus width={20} height={20} />
              <span>Agregar circuito</span>
            </button>
          </div>
        )}

        {hijos.length === 0 && !ctx.canEdit && (
          <div className="circ-branch">
            <div className="circ-branch-line" />
            <div className="circ-empty-slot">Sin circuitos</div>
          </div>
        )}
      </div>
    </div>
  )
}

/* --------------------------------------------- Tarjeta de protección ---- */
function BlockCard({ c, ctx, onLeft, onRight }) {
  const esGeneral = c.tipo === 'general'
  const fases = etiquetaFases(c.fases)
  return (
    <div className={'circ-block' + (esGeneral ? ' circ-block-general' : '')}>
      {ctx.canEdit && (
        <div className="circ-block-actions">
          {onLeft && <button className="btn-ghost" title="Mover a la izquierda" disabled={ctx.busy} onClick={onLeft}>‹</button>}
          {onRight && <button className="btn-ghost" title="Mover a la derecha" disabled={ctx.busy} onClick={onRight}>›</button>}
          <button className="btn-ghost" title="Editar" disabled={ctx.busy} onClick={() => ctx.setEditing(c)}><IconEdit width={15} height={15} /></button>
          <button className="btn-ghost" title="Eliminar" disabled={ctx.busy} onClick={() => ctx.remove(c)}><IconTrash width={15} height={15} /></button>
        </div>
      )}
      <div className="circ-block-tag">{esGeneral ? 'GENERAL' : c.numero_circuito || '—'}</div>
      <BreakerSymbol fases={c.fases} height={46} color={esGeneral ? '#0f3d6b' : '#1d4ed8'} />
      <div className="circ-block-cap">
        {c.capacidad || '—'}
        {fases && <span className="circ-fase-chip">{fases}</span>}
      </div>
      <div className="circ-block-marca">{c.marca || 'sin marca'}</div>
      {(c.tag_circuito || !esGeneral) && (
        <div className="circ-block-desc" title={c.tag_circuito || ''}>{c.tag_circuito || 'sin tag'}</div>
      )}
    </div>
  )
}

/* --------------------------------------------- Formulario --------------- */
function CircuitoForm({ nodo, busy, onCancel, onSave }) {
  const esBarra = nodo.clase === 'barra'
  const esGeneral = nodo.tipo === 'general'

  const [f, setF] = useState({
    id: nodo.id,
    clase: nodo.clase || 'proteccion',
    tipo: nodo.tipo || 'carga',
    parent_id: nodo.parent_id ?? null,
    sort_order: nodo.sort_order ?? 0,
    nombre: nodo.nombre || '',
    fases: nodo.fases || 'monofasica',
    marca: nodo.marca || '',
    capacidad: nodo.capacidad || '',
    numero_circuito: nodo.numero_circuito || '',
    tag_circuito: nodo.tag_circuito || '',
  })
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }))

  const titulo =
    (nodo._new ? 'Nueva ' : 'Editar ') +
    (esBarra ? 'barra' : esGeneral ? 'protección general' : 'protección')

  return (
    <Modal size="sm" onClose={onCancel} title={titulo}
      footer={<>
        <button className="btn" onClick={onCancel} disabled={busy}>Cancelar</button>
        <button className="btn btn-primary" disabled={busy}
          onClick={() => onSave(esBarra ? { ...f, fases: null } : f)}>
          {busy ? 'Guardando…' : 'Guardar'}
        </button>
      </>}>

      {esBarra ? (
        <div className="field">
          <label>Nombre de la barra</label>
          <input type="text" value={f.nombre} onChange={set('nombre')} placeholder="BARRA PRINCIPAL, BARRA TDA-2…" />
          <span className="hint">De esta barra cuelgan las protecciones que alimenta.</span>
        </div>
      ) : (
        <>
          <div className="field">
            <label>Fases</label>
            <select value={f.fases} onChange={set('fases')}>
              <option value="monofasica">Monofásica (1 polo)</option>
              <option value="trifasica">Trifásica (3 polos)</option>
            </select>
            <span className="hint">Define cuántos polos muestra el símbolo en el diagrama.</span>
          </div>
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
        </>
      )}
    </Modal>
  )
}
