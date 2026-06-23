import { useEffect, useState, useCallback, useRef } from 'react'
import { useAuth } from '../auth/AuthContext.jsx'
import {
  getSystems, getAssetTypes, getAssets, getFieldDefs, deleteSystem, deleteAssetType, deleteAsset,
  getAllAssetTypes, getAllAssets,
} from '../lib/api.js'
import { systemIcon, IconPlus, IconEdit, IconTrash, IconChip, IconSearch } from './Icons.jsx'
import SystemForm from './SystemForm.jsx'
import AssetTypeForm from './AssetTypeForm.jsx'
import AssetForm from './AssetForm.jsx'
import AssetDetail from './AssetDetail.jsx'
import FieldDefsEditor from './FieldDefsEditor.jsx'
import ImportModal from './ImportModal.jsx'
import AssetIllustration from './AssetIllustration.jsx'

// Carga SheetJS bajo demanda
let xlsxPromise = null
function loadXLSX() {
  if (typeof window !== 'undefined' && window.XLSX) return Promise.resolve(window.XLSX)
  if (xlsxPromise) return xlsxPromise
  xlsxPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
    s.async = true
    s.onload = () => resolve(window.XLSX)
    s.onerror = () => reject(new Error('No se pudo cargar la libreria Excel.'))
    document.head.appendChild(s)
  })
  return xlsxPromise
}

export default function BrowseView() {
  const { canEdit, isAdmin } = useAuth()
  const [sys, setSys]   = useState(null)
  const [type, setType] = useState(null)
  const skipPush = useRef(false)

  // Soporte para boton Atras del navegador
  useEffect(() => {
    history.replaceState({ sys: null, type: null }, '')
    const onPop = (e) => {
      skipPush.current = true
      const st = e.state || {}
      setSys(st.sys || null)
      setType(st.type || null)
      setTimeout(() => { skipPush.current = false }, 0)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const push = useCallback((ns, nt) => {
    if (!skipPush.current) history.pushState({ sys: ns, type: nt }, '')
  }, [])

  const goToSystem  = useCallback((s) => { setSys(s); setType(null); push(s, null) }, [push])
  const goToType    = useCallback((t) => { setType(t); push(sys, t) }, [push, sys])
  const goToTypes   = useCallback(() => { setType(null); push(sys, null) }, [push, sys])
  const goToSystems = useCallback(() => { setSys(null); setType(null); push(null, null) }, [push])

  if (type) return <AssetsLevel system={sys} type={type} canEdit={canEdit} onBack={goToTypes} onBackRoot={goToSystems} />
  if (sys)  return <TypesLevel system={sys} canEdit={canEdit} onOpenType={goToType} onBack={goToSystems} />
  return <SystemsLevel canEdit={canEdit} isAdmin={isAdmin} onOpenSystem={goToSystem} />
}

/* ─── Grafico de dona ─── */
function DonutChart({ systems, counts }) {
  const total = systems.reduce((s, sy) => s + (counts[sy.id] || 0), 0)
  if (total === 0) return null
  const COLORS = ['#1d4ed8','#16a34a','#dc2626','#d97706','#7c3aed','#0891b2','#db2777']
  const r = 54, sw = 22, cx = 80, cy = 80, circ = 2 * Math.PI * r
  let offset = 0
  const segs = systems.map((s, i) => {
    const cnt = counts[s.id] || 0
    if (cnt === 0) return null
    const dash = (cnt / total) * circ
    const seg = { s, cnt, dash, offset, color: COLORS[i % COLORS.length] }
    offset += dash
    return seg
  }).filter(Boolean)

  return (
    <div style={{ background:'var(--panel)', border:'1px solid var(--border)', borderRadius:14, padding:'16px 24px', marginBottom:20, display:'flex', alignItems:'center', gap:28, flexWrap:'wrap', boxShadow:'var(--shadow)' }}>
      <svg width={160} height={160} viewBox="0 0 160 160" style={{ flexShrink:0 }}>
        {segs.map((sg, i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={sg.color} strokeWidth={sw}
            strokeDasharray={sg.dash + ' ' + (circ - sg.dash)}
            strokeDashoffset={-sg.offset}
            transform={'rotate(-90 ' + cx + ' ' + cy + ')'} />
        ))}
        <text x={cx} y={cy - 8} textAnchor="middle" fontSize={24} fontWeight={800} fill="var(--text)">{total}</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize={11} fill="var(--muted)">activos totales</text>
      </svg>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {segs.map((sg, i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ width:13, height:13, borderRadius:'50%', background:sg.color, flexShrink:0 }} />
            <span style={{ fontSize:13 }}>{sg.s.name}</span>
            <span style={{ fontSize:14, fontWeight:700, color:sg.color, marginLeft:4 }}>{sg.cnt}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Nivel 1: Sistemas ─── */
function SystemsLevel({ canEdit, onOpenSystem }) {
  const [items, setItems]     = useState(null)
  const [counts, setCounts]   = useState({})
  const [editing, setEditing] = useState(null)
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)

  const load = useCallback(async () => {
    try {
      const systems = await getSystems()
      setItems(systems)
      const [types, assets] = await Promise.all([getAllAssetTypes(), getAllAssets()])
      const typeToSys = {}
      types.forEach(t => { typeToSys[t.id] = t.system_id })
      const c = {}
      systems.forEach(s => { c[s.id] = 0 })
      assets.forEach(a => {
        const sid = typeToSys[a.asset_type_id]
        if (sid && c[sid] !== undefined) c[sid]++
      })
      setCounts(c)
    } catch (e) { alert(e.message) }
  }, [])
  useEffect(() => { load() }, [load])

  const remove = async (e, s) => {
    e.stopPropagation()
    if (!confirm('¿Eliminar el sistema "' + s.name + '" y todo su contenido?')) return
    try { await deleteSystem(s.id); load() } catch (err) { alert(err.message) }
  }

  const exportExcel = async () => {
    setExporting(true)
    try {
      const XLSX = await loadXLSX()
      const wb = XLSX.utils.book_new()
      const types = await getAllAssetTypes()
      const used = {}
      for (const t of types) {
        const [defs, assets] = await Promise.all([getFieldDefs(t.id), getAssets(t.id)])
        const headers = ['Nombre', 'Nombre alternativo', 'Estado', ...defs.map(d => d.label)]
        const rows = assets.map(a => [
          a.name || '',
          a.alt_name || '',
          a.status ? a.status.toUpperCase() : '',
          ...defs.map(d => { const v = a.data?.[d.key]; return v != null ? String(v) : '' })
        ])
        const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
        let sn = t.name.slice(0, 31), n = 1
        while (used[sn]) { sn = t.name.slice(0, 29) + '(' + (++n) + ')' }
        used[sn] = true
        XLSX.utils.book_append_sheet(wb, ws, sn)
      }
      XLSX.writeFile(wb, 'CMDB_Icetel_' + new Date().toISOString().slice(0, 10) + '.xlsx')
    } catch (e) { alert('Error al exportar: ' + e.message) }
    finally { setExporting(false) }
  }

  if (!items) return <Loading />
  return (
    <>
      <div className="toolbar">
        <div>
          <h1 className="page-title">Sistemas</h1>
          <p className="page-sub">Categorias de activos del datacenter</p>
        </div>
        <div className="spacer" />
        <button className="btn" onClick={exportExcel} disabled={exporting}>
          {exporting ? 'Exportando…' : '↓ Exportar Excel'}
        </button>
        {canEdit && <button className="btn" onClick={() => setImporting(true)}><IconChip width={18} height={18} /> Importar Excel</button>}
        {canEdit && <button className="btn btn-primary" onClick={() => setEditing({})}><IconPlus width={18} height={18} /> Nuevo sistema</button>}
      </div>

      <DonutChart systems={items} counts={counts} />

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
            <div className="card-desc">{s.description || 'Sin descripcion'}</div>
            {counts[s.id] !== undefined && <div className="card-meta"><span style={{fontWeight:600}}>{counts[s.id]}</span> activos</div>}
          </div>
        ))}
        {items.length === 0 && <div className="empty">No hay sistemas todavia.</div>}
      </div>

      {editing   && <SystemForm system={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load() }} />}
      {importing && <ImportModal onClose={() => setImporting(false)} onDone={() => { setImporting(false); load() }} />}
    </>
  )
}

/* ─── Nivel 2: Tipos ─── */
function TypesLevel({ system, canEdit, onOpenType, onBack }) {
  const [items, setItems]       = useState(null)
  const [counts, setCounts]     = useState({})
  const [editing, setEditing]   = useState(null)
  const [fieldsFor, setFieldsFor] = useState(null)

  const load = useCallback(() => {
    getAssetTypes(system.id).then(async (types) => {
      setItems(types)
      const c = {}
      await Promise.all(types.map(async (t) => {
        const a = await getAssets(t.id)
        c[t.id] = { total: a.length, on: a.filter(x => x.status === 'on').length, off: a.filter(x => x.status === 'off').length }
      }))
      setCounts(c)
    }).catch(e => alert(e.message))
  }, [system.id])
  useEffect(() => { load() }, [load])

  const remove = async (e, t) => {
    e.stopPropagation()
    if (!confirm('¿Eliminar el tipo "' + t.name + '"? (debe no tener activos)')) return
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
                {c ? (<><span>{c.total} en total</span><span className="count-on">● {c.on} activos</span><span className="count-off">● {c.off} apagados</span></>) : '…'}
              </div>
            </div>
          )
        })}
        {items.length === 0 && <div className="empty">Este sistema no tiene tipos de activo aun.</div>}
      </div>
      {editing   && <AssetTypeForm type={editing} systemId={system.id} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load() }} />}
      {fieldsFor && <FieldDefsEditor type={fieldsFor} onClose={() => { setFieldsFor(null); load() }} />}
    </>
  )
}

/* ─── Nivel 3: Activos ─── */
function AssetsLevel({ system, type, canEdit, onBack, onBackRoot }) {
  const [items, setItems]         = useState(null)
  const [fieldDefs, setFieldDefs] = useState([])
  const [q, setQ]                 = useState('')
  const [editing, setEditing]     = useState(null)
  const [detail, setDetail]       = useState(null)

  const load = useCallback(async () => {
    try {
      const [assets, defs] = await Promise.all([getAssets(type.id), getFieldDefs(type.id)])
      setItems(assets)
      setFieldDefs(defs)
    } catch (e) { alert(e.message) }
  }, [type.id])
  useEffect(() => { load() }, [load])

  const remove = async (e, a) => {
    e.stopPropagation()
    if (!confirm('¿Eliminar el activo "' + a.name + '"?')) return
    try { await deleteAsset(a.id); load() } catch (err) { alert(err.message) }
  }

  if (!items) return <Loading />
  const sq = q.toLowerCase()
  const filtered = items.filter(a =>
    a.name.toLowerCase().includes(sq) || (a.alt_name || '').toLowerCase().includes(sq)
  )

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
        <div style={{ position:'relative' }}>
          <IconSearch width={16} height={16} style={{ position:'absolute', left:10, top:10, color:'var(--muted)' }} />
          <input className="search-input" style={{ paddingLeft:32 }} placeholder="Buscar…" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        {canEdit && <button className="btn btn-primary" onClick={() => setEditing({ asset_type_id: type.id })}><IconPlus width={18} height={18} /> Nuevo activo</button>}
      </div>

      <div className="table-wrap" style={{ overflowX:'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Nombre alternativo</th>
              {fieldDefs.map(f => <th key={f.id}>{f.label}</th>)}
              <th>Estado</th>
              <th style={{ width:90 }}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(a => (
              <tr key={a.id} onClick={() => setDetail(a)}>
                <td style={{ fontWeight:600 }}>{a.name}</td>
                <td style={{ color:'var(--muted)' }}>{a.alt_name || '—'}</td>
                {fieldDefs.map(f => (
                  <td key={f.id}>{(a.data?.[f.key] != null && a.data[f.key] !== '') ? a.data[f.key] : '—'}</td>
                ))}
                <td><StatusPill status={a.status} /></td>
                <td>
                  {canEdit && (
                    <div className="row-actions">
                      <button className="btn-ghost" title="Editar" onClick={e => { e.stopPropagation(); setEditing(a) }}><IconEdit width={17} height={17} /></button>
                      <button className="btn-ghost" title="Eliminar" onClick={e => remove(e, a)}><IconTrash width={17} height={17} /></button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={3 + fieldDefs.length + 1}><div className="empty">No hay activos.</div></td></tr>
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
  if (status === 'on')  return <span className="status-pill status-on"><span className="dot" /> ON</span>
  if (status === 'off') return <span className="status-pill status-off"><span className="dot" /> OFF</span>
  return <span className="status-pill status-na">—</span>
}

function Loading() { return <div className="center-screen"><div className="spinner" /></div> }
