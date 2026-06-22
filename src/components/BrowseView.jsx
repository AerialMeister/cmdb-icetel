import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../auth/AuthContext.jsx'
import {
  getSystems, getAssetTypes, getAssets, deleteSystem, deleteAssetType, deleteAsset,
} from '../lib/api.js'
import { systemIcon, IconPlus, IconEdit, IconTrash, IconChip, IconSearch } from './Icons.jsx'
import SystemForm from './SystemForm.jsx'
import AssetTypeForm from './AssetTypeForm.jsx'
import AssetForm from './AssetForm.jsx'
import AssetDetail from './AssetDetail.jsx'
import FieldDefsEditor from './FieldDefsEditor.jsx'
import ImportModal from './ImportModal.jsx'
import AssetIllustration from './AssetIllustration.jsx'

export default function BrowseView() {
  const { canEdit, isAdmin } = useAuth()
  const [sys, setSys] = useState(null)     // sistema seleccionado
  const [type, setType] = useState(null)   // tipo seleccionado

  if (type) return (
    <AssetsLevel system={sys} type={type} canEdit={canEdit}
      onBack={() => setType(null)} onBackRoot={() => { setSys(null); setType(null) }} />
  )
  if (sys) return (
    <TypesLevel system={sys} canEdit={canEdit}
      onOpenType={setType} onBack={() => setSys(null)} />
  )
  return <SystemsLevel canEdit={canEdit} isAdmin={isAdmin} onOpenSystem={setSys} />
}

/* ---------------- Nivel 1: Sistemas ---------------- */
function SystemsLevel({ canEdit, onOpenSystem }) {
  const [items, setItems] = useState(null)
  const [editing, setEditing] = useState(null) // obj o {} para nuevo
  const [importing, setImporting] = useState(false)
  const load = useCallback(() => { getSystems().then(setItems).catch(e => alert(e.message)) }, [])
  useEffect(() => { load() }, [load])

  const remove = async (e, s) => {
    e.stopPropagation()
    if (!confirm(`¿Eliminar el sistema "${s.name}" y todo su contenido?`)) return
    try { await deleteSystem(s.id); load() } catch (err) { alert(err.message) }
  }

  if (!items) return <Loading />
  return (
    <>
      <div className="toolbar">
        <div>
          <h1 className="page-title">Sistemas</h1>
          <p className="page-sub">Categorías de activos del datacenter</p>
        </div>
        <div className="spacer" />
        {canEdit && <button className="btn" onClick={() => setImporting(true)}><IconChip width={18} height={18} /> Importar Excel</button>}
        {canEdit && <button className="btn btn-primary" onClick={() => setEditing({})}><IconPlus width={18} height={18} /> Nuevo sistema</button>}
      </div>

      <div className="grid">
        {items.map(s => (
          <div className="card" key={s.id} onClick={() => onOpenSystem(s)}>
            {canEdit && (
              <div className="card-edit row-actions">
                <button className="btn-ghost" title="Editar" onClick={(e) => { e.stopPropagation(); setEditing(s) }}><IconEdit width={17} height={17} /></button>
                <button className="btn-ghost" title="Eliminar" onClick={(e) => remove(e, s)}><IconTrash width={17} height={17} /></button>
              </div>
            )}
            <div className="card-icon">{systemIcon(s.icon, { width: 40, height: 40 })}</div>
            <div className="card-title">{s.name}</div>
            <div className="card-desc">{s.description || 'Sin descripción'}</div>
          </div>
        ))}
        {items.length === 0 && <div className="empty">No hay sistemas todavía.</div>}
      </div>

      {editing && <SystemForm system={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load() }} />}
      {importing && <ImportModal onClose={() => setImporting(false)} onDone={() => {}} />}
    </>
  )
}

/* ---------------- Nivel 2: Tipos de activo ---------------- */
function TypesLevel({ system, canEdit, onOpenType, onBack }) {
  const [items, setItems] = useState(null)
  const [counts, setCounts] = useState({})
  const [editing, setEditing] = useState(null)
  const [fieldsFor, setFieldsFor] = useState(null)

  const load = useCallback(() => {
    getAssetTypes(system.id).then(async (types) => {
      setItems(types)
      // conteo de activos por tipo (total / ON / OFF)
      const c = {}
      await Promise.all(types.map(async (t) => {
        const a = await getAssets(t.id)
        c[t.id] = {
          total: a.length,
          on: a.filter(x => x.status === 'on').length,
          off: a.filter(x => x.status === 'off').length,
        }
      }))
      setCounts(c)
    }).catch(e => alert(e.message))
  }, [system.id])
  useEffect(() => { load() }, [load])

  const remove = async (e, t) => {
    e.stopPropagation()
    if (!confirm(`¿Eliminar el tipo "${t.name}"? (debe no tener activos)`)) return
    try { await deleteAssetType(t.id); load() } catch (err) { alert(err.message) }
  }

  if (!items) return <Loading />
  return (
    <>
      <div className="crumbs">
        <button onClick={onBack}>Sistemas</button>
        <span className="sep">/</span>
        <span className="current">{system.name}</span>
      </div>
      <div className="toolbar">
        <h1 className="page-title">{system.name}</h1>
        <div className="spacer" />
        {canEdit && <button className="btn btn-primary" onClick={() => setEditing({ system_id: system.id })}><IconPlus width={18} height={18} /> Nuevo tipo</button>}
      </div>

      <div className="grid">
        {items.map(t => {
          const c = counts[t.id]
          return (
          <div className="card" key={t.id} onClick={() => onOpenType(t)}>
            {canEdit && (
              <div className="card-edit row-actions">
                <button className="btn-ghost" title="Campos" onClick={(e) => { e.stopPropagation(); setFieldsFor(t) }}><IconChip width={17} height={17} /></button>
                <button className="btn-ghost" title="Editar" onClick={(e) => { e.stopPropagation(); setEditing(t) }}><IconEdit width={17} height={17} /></button>
                <button className="btn-ghost" title="Eliminar" onClick={(e) => remove(e, t)}><IconTrash width={17} height={17} /></button>
              </div>
            )}
            <div className="type-card-row">
              <div className="type-card-main">
                <div className="card-title">{t.name}</div>
                <div className="card-desc">{t.description || '—'}</div>
              </div>
              <div className="type-card-thumb"><AssetIllustration illustration={t.illustration} data={{}} /></div>
            </div>
            <div className="card-meta">
              {c ? (<>
                <span>{c.total} en total</span>
                <span className="count-on">● {c.on} activos</span>
                <span className="count-off">● {c.off} apagados</span>
              </>) : '…'}
            </div>
          </div>
        )})}
        {items.length === 0 && <div className="empty">Este sistema no tiene tipos de activo aún.</div>}
      </div>

      {editing && <AssetTypeForm type={editing} systemId={system.id} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load() }} />}
      {fieldsFor && <FieldDefsEditor type={fieldsFor} onClose={() => { setFieldsFor(null); load() }} />}
    </>
  )
}

/* ---------------- Nivel 3: Activos ---------------- */
function AssetsLevel({ system, type, canEdit, onBack, onBackRoot }) {
  const [items, setItems] = useState(null)
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState(null)
  const [detail, setDetail] = useState(null)

  const load = useCallback(() => { getAssets(type.id).then(setItems).catch(e => alert(e.message)) }, [type.id])
  useEffect(() => { load() }, [load])

  const remove = async (e, a) => {
    e.stopPropagation()
    if (!confirm(`¿Eliminar el activo "${a.name}"?`)) return
    try { await deleteAsset(a.id); load() } catch (err) { alert(err.message) }
  }

  if (!items) return <Loading />
  const filtered = items.filter(a => a.name.toLowerCase().includes(q.toLowerCase()))
  const hasStatus = items.some(a => a.status) || type.illustration !== 'bomba'

  return (
    <>
      <div className="crumbs">
        <button onClick={onBackRoot}>Sistemas</button>
        <span className="sep">/</span>
        <button onClick={onBack}>{system.name}</button>
        <span className="sep">/</span>
        <span className="current">{type.name}</span>
      </div>
      <div className="toolbar">
        <h1 className="page-title">{type.name}</h1>
        <div className="spacer" />
        <div style={{ position: 'relative' }}>
          <IconSearch width={16} height={16} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--muted)' }} />
          <input className="search-input" style={{ paddingLeft: 32 }} placeholder="Buscar…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {canEdit && <button className="btn btn-primary" onClick={() => setEditing({ asset_type_id: type.id })}><IconPlus width={18} height={18} /> Nuevo activo</button>}
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>ID</th>
              {hasStatus && <th>Estado</th>}
              <th style={{ width: 90 }}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(a => (
              <tr key={a.id} onClick={() => setDetail(a)}>
                <td style={{ fontWeight: 600 }}>{a.name}</td>
                <td className="id-cell">{a.id.slice(0, 8)}…</td>
                {hasStatus && <td><StatusPill status={a.status} /></td>}
                <td>
                  {canEdit && (
                    <div className="row-actions">
                      <button className="btn-ghost" title="Editar" onClick={(e) => { e.stopPropagation(); setEditing(a) }}><IconEdit width={17} height={17} /></button>
                      <button className="btn-ghost" title="Eliminar" onClick={(e) => remove(e, a)}><IconTrash width={17} height={17} /></button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={hasStatus ? 4 : 3}><div className="empty">No hay activos.</div></td></tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && <AssetForm asset={editing} type={type} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load() }} />}
      {detail && <AssetDetail asset={detail} type={type} system={system} canEdit={canEdit}
        onClose={() => setDetail(null)}
        onEdit={() => { setEditing(detail); setDetail(null) }} />}
    </>
  )
}

export function StatusPill({ status }) {
  if (status === 'on') return <span className="status-pill status-on"><span className="dot" /> ON</span>
  if (status === 'off') return <span className="status-pill status-off"><span className="dot" /> OFF</span>
  return <span className="status-pill status-na">—</span>
}

function Loading() { return <div className="center-screen"><div className="spinner" /></div> }
