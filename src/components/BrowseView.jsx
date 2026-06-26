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

// Carga ExcelJS bajo demanda
let excelJsPromise = null
function loadExcelJS() {
  if (typeof window !== 'undefined' && window.ExcelJS) return Promise.resolve(window.ExcelJS)
  if (excelJsPromise) return excelJsPromise
  excelJsPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js'
    s.async = true
    s.onload = () => resolve(window.ExcelJS)
    s.onerror = () => reject(new Error('No se pudo cargar ExcelJS'))
    document.head.appendChild(s)
  })
  return excelJsPromise
}

export default function BrowseView() {
  const { canEdit, isAdmin } = useAuth()
  const [sys, setSys]   = useState(null)
  const [type, setType] = useState(null)
  const skipPush = useRef(false)

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

/* --- Grafico de dona --- */
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
      <svg width={160} height={160} viewBox='0 0 160 160' style={{ flexShrink:0 }}>
        {segs.map((sg, i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill='none'
            stroke={sg.color} strokeWidth={sw}
            strokeDasharray={sg.dash + ' ' + (circ - sg.dash)}
            strokeDashoffset={-sg.offset}
            transform={'rotate(-90 ' + cx + ' ' + cy + ')'} />
        ))}
        <text x={cx} y={cy - 8} textAnchor='middle' fontSize={24} fontWeight={800} fill='var(--text)'>{total}</text>
        <text x={cx} y={cy + 10} textAnchor='middle' fontSize={11} fill='var(--muted)'>activos totales</text>
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

/* --- Gráfico de barras: activos por ubicación --- */
function LocationCard({ assets }) {
  const LOCATION_KEYS = ['ubicacion', 'ubicación', 'location', 'ubicacion_fisica', 'ubicacion fisica', 'sala', 'rack_ubicacion']
  const counts = {}
  for (const a of assets) {
    if (!a.data) continue
    let val = null
    for (const k of Object.keys(a.data)) {
      if (LOCATION_KEYS.includes(k.toLowerCase().trim())) { val = a.data[k]; break }
    }
    if (!val || String(val).trim() === '') continue
    const label = String(val).trim()
    counts[label] = (counts[label] || 0) + 1
  }
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1])
  if (entries.length === 0) return null
  return (
    <div style={{ background:'var(--panel)', border:'1px solid var(--border)', borderRadius:14, padding:'14px 24px', marginBottom:20, boxShadow:'var(--shadow)' }}>
      <div style={{ fontSize:12, fontWeight:700, color:'var(--muted)', marginBottom:12, textTransform:'uppercase', letterSpacing:'0.05em' }}>
        Activos por ubicación
      </div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:'8px 20px' }}>
        {entries.map(([label, count]) => (
          <div key={label} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 14px', background:'var(--bg)', border:'1px solid var(--border)', borderRadius:8 }}>
            <span style={{ fontSize:13, color:'var(--text)' }}>{label}</span>
            <span style={{ fontSize:14, fontWeight:700, color:'var(--brand, #1d4ed8)', minWidth:20, textAlign:'center' }}>{count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* --- Export helper --- */
async function buildStyledExcel(getSystems, getAllAssetTypes, getAllAssets, getFieldDefs, getAssets) {
  const ExcelJS = await loadExcelJS()
  const wb = new ExcelJS.Workbook()
  wb.creator = 'CMDB Icetel'
  wb.created = new Date()
  wb.modified = new Date()

  const NAVY  = 'FF0F3D6B', BLUE  = 'FF1D4ED8'
  const ALT   = 'FFEFF6FF', WHITE = 'FFFFFFFF'
  const GRAY  = 'FFE2E8F0', MUTED = 'FF64748B'
  const GREEN = 'FF16A34A', RED   = 'FFDC2626'

  const hdrFont  = (sz) => ({ name: 'Calibri', size: sz || 11, bold: true, color: { argb: WHITE } })
  const bodyFont = (o)  => ({ name: 'Calibri', size: 11, ...o })
  const fill     = (argb) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } })
  const thin     = { style: 'thin', color: { argb: 'FFD1D5DB' } }
  const borders  = { top: thin, left: thin, bottom: thin, right: thin }

  // ---- Hoja resumen ----
  const cover = wb.addWorksheet('Resumen', { views: [{ showGridLines: false }] })
  cover.getColumn(1).width = 35
  cover.getColumn(2).width = 18

  cover.mergeCells('A1:B1')
  const t1 = cover.getCell('A1')
  t1.value = 'CMDB Icetel — Respaldo de datos'
  t1.font  = { name: 'Calibri', size: 16, bold: true, color: { argb: NAVY } }
  t1.alignment = { vertical: 'middle' }
  cover.getRow(1).height = 32

  cover.getCell('A2').value = 'Exportado:'
  cover.getCell('A2').font  = bodyFont({ color: { argb: MUTED } })
  cover.getCell('B2').value = new Date().toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' })
  cover.getCell('B2').font  = bodyFont({ bold: true })
  cover.getRow(3).height = 12

  ;['A4','B4'].forEach((addr, i) => {
    const c = cover.getCell(addr)
    c.value = ['Sistema', 'Activos'][i]
    c.font  = hdrFont()
    c.fill  = fill(NAVY)
    c.border = borders
    c.alignment = { horizontal: i === 1 ? 'right' : 'left', vertical: 'middle' }
  })
  cover.getRow(4).height = 20

  const sysList = await getSystems()
  const [allTypes, allAssets] = await Promise.all([getAllAssetTypes(), getAllAssets()])
  const t2s = {}
  allTypes.forEach(t => { t2s[t.id] = t.system_id })
  const sysCount = {}
  sysList.forEach(s => { sysCount[s.id] = 0 })
  allAssets.forEach(a => { const sid = t2s[a.asset_type_id]; if (sid !== undefined && sysCount[sid] !== undefined) sysCount[sid]++ })

  sysList.forEach((sys, idx) => {
    const row = cover.getRow(5 + idx)
    row.height = 18
    const bg = fill(idx % 2 === 1 ? ALT : WHITE)
    const na = row.getCell(1), nb = row.getCell(2)
    na.value = sys.name; na.font = bodyFont(); na.fill = bg; na.border = borders
    nb.value = sysCount[sys.id] || 0
    nb.font  = bodyFont({ bold: true, color: { argb: BLUE } })
    nb.fill  = bg; nb.border = borders; nb.alignment = { horizontal: 'right' }
  })

  const totRow = cover.getRow(5 + sysList.length)
  totRow.height = 20
  ;[1,2].forEach(col => {
    const c = totRow.getCell(col)
    c.fill = fill(GRAY); c.border = borders
    if (col === 1) { c.value = 'Total'; c.font = bodyFont({ bold: true }) }
    else { c.value = allAssets.length; c.font = bodyFont({ bold: true, size: 12 }); c.alignment = { horizontal: 'right' } }
  })

  // ---- Hojas de datos por tipo ----
  const used = {}
  for (const t of allTypes) {
    const [defs, typeAssets] = await Promise.all([getFieldDefs(t.id), getAssets(t.id)])
    let sn = t.name.slice(0, 31), n = 1
    while (used[sn]) { sn = t.name.slice(0, 29) + '(' + (++n) + ')' }
    used[sn] = true

    const ws = wb.addWorksheet(sn, { views: [{ state: 'frozen', ySplit: 1 }] })

    const colDefs = [
      { label: 'Nombre', width: 28 },
      { label: 'Nombre alternativo', width: 22 },
      { label: 'Estado', width: 10 },
      ...defs.map(d => ({ label: d.label, width: Math.max(d.label.length + 4, 14) }))
    ]
    ws.columns = colDefs.map((c, i) => ({ key: String(i), width: c.width }))

    const hdr = ws.getRow(1)
    hdr.height = 22
    colDefs.forEach((col, i) => {
      const cell = hdr.getCell(i + 1)
      cell.value = col.label
      cell.font  = hdrFont()
      cell.fill  = fill(NAVY)
      cell.border = borders
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
    })

    typeAssets.forEach((a, rowIdx) => {
      const values = [
        a.name || '', a.alt_name || '',
        a.status ? a.status.toUpperCase() : '',
        ...defs.map(d => { const v = a.data?.[d.key]; return (v != null && v !== '') ? String(v) : '' })
      ]
      const row = ws.getRow(rowIdx + 2)
      row.height = 18
      const bg = fill(rowIdx % 2 === 0 ? WHITE : ALT)
      values.forEach((val, ci) => {
        const cell = row.getCell(ci + 1)
        cell.value = val; cell.fill = bg; cell.border = borders
        cell.alignment = { vertical: 'middle' }
        if (ci === 0)       cell.font = bodyFont({ bold: true })
        else if (ci === 2) {
          if (val === 'ON')  cell.font = bodyFont({ bold: true, color: { argb: GREEN } })
          else if (val === 'OFF') cell.font = bodyFont({ bold: true, color: { argb: RED } })
          else cell.font = bodyFont()
        } else cell.font = bodyFont()
      })
    })
  }

  const buf = await wb.xlsx.writeBuffer()
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'CMDB_Icetel_' + new Date().toISOString().slice(0, 10) + '.xlsx'
  anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/* --- Nivel 1: Sistemas --- */
function SystemsLevel({ canEdit, onOpenSystem }) {
  const [items, setItems]         = useState(null)
  const [counts, setCounts]        = useState({})
  const [allAssets, setAllAssets]  = useState([])
  const [editing, setEditing]      = useState(null)
  const [importing, setImporting]  = useState(false)
  const [exporting, setExporting]  = useState(false)

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
      setAllAssets(assets)
    } catch (e) { alert(e.message) }
  }, [])
  useEffect(() => { load() }, [load])

  const remove = async (e, s) => {
    e.stopPropagation()
    if (!confirm('Eliminar el sistema "' + s.name + '" y todo su contenido?')) return
    try { await deleteSystem(s.id); load() } catch (err) { alert(err.message) }
  }

  const exportExcel = async () => {
    setExporting(true)
    try {
      await buildStyledExcel(getSystems, getAllAssetTypes, getAllAssets, getFieldDefs, getAssets)
    } catch (e) { alert('Error al exportar: ' + e.message) }
    finally { setExporting(false) }
  }

  if (!items) return <Loading />
  return (
    <>
      <div className='toolbar'>
        <div>
          <h1 className='page-title'>Sistemas</h1>
          <p className='page-sub'>Categorias de activos del datacenter</p>
        </div>
        <div className='spacer' />
        <button className='btn' onClick={exportExcel} disabled={exporting}>
          {exporting ? 'Exportando...' : 'Exportar Excel'}
        </button>
        {canEdit && <button className='btn' onClick={() => setImporting(true)}><IconChip width={18} height={18} /> Importar Excel</button>}
        {canEdit && <button className='btn btn-primary' onClick={() => setEditing({})}><IconPlus width={18} height={18} /> Nuevo sistema</button>}
      </div>

      <DonutChart systems={items} counts={counts} />
      <LocationCard assets={allAssets} />

      <div className='grid'>
        {items.map(s => (
          <div className='card' key={s.id} onClick={() => onOpenSystem(s)}>
            {canEdit && (
              <div className='card-edit row-actions'>
                <button className='btn-ghost' title='Editar' onClick={(e) => { e.stopPropagation(); setEditing(s) }}><IconEdit width={17} height={17} /></button>
                <button className='btn-ghost' title='Eliminar' onClick={(e) => remove(e, s)}><IconTrash width={17} height={17} /></button>
              </div>
            )}
            <div className='card-icon'>{systemIcon(s.icon, { width: 40, height: 40 })}</div>
            <div className='card-title'>{s.name}</div>
            <div className='card-desc'>{s.description || 'Sin descripcion'}</div>
            {counts[s.id] !== undefined && <div className='card-meta'><span style={{fontWeight:600}}>{counts[s.id]}</span> activos</div>}
          </div>
        ))}
        {items.length === 0 && <div className='empty'>No hay sistemas todavia.</div>}
      </div>

      {editing   && <SystemForm system={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load() }} />}
      {importing && <ImportModal onClose={() => setImporting(false)} onDone={() => { setImporting(false); load() }} />}
    </>
  )
}

/* --- Nivel 2: Tipos --- */
function TypesLevel({ system, canEdit, onOpenType, onBack }) {
  const [items, setItems]         = useState(null)
  const [counts, setCounts]        = useState({})
  const [editing, setEditing]      = useState(null)
  const [fieldsFor, setFieldsFor]  = useState(null)

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
    if (!confirm('Eliminar el tipo "' + t.name + '"? (debe no tener activos)')) return
    try { await deleteAssetType(t.id); load() } catch (err) { alert(err.message) }
  }

  if (!items) return <Loading />
  return (
    <>
      <div className='crumbs'>
        <button onClick={onBack}>Sistemas</button>
        <span className='sep'>/</span>
        <span className='current'>{system.name}</span>
      </div>
      <div className='toolbar'>
        <h1 className='page-title'>{system.name}</h1>
        <div className='spacer' />
        {canEdit && <button className='btn btn-primary' onClick={() => setEditing({ system_id: system.id })}><IconPlus width={18} height={18} /> Nuevo tipo</button>}
      </div>
      <div className='grid'>
        {items.map(t => {
          const c = counts[t.id]
          return (
            <div className='card' key={t.id} onClick={() => onOpenType(t)}>
              {canEdit && (
                <div className='card-edit row-actions'>
                  <button className='btn-ghost' title='Campos' onClick={(e) => { e.stopPropagation(); setFieldsFor(t) }}><IconChip width={17} height={17} /></button>
                  <button className='btn-ghost' title='Editar' onClick={(e) => { e.stopPropagation(); setEditing(t) }}><IconEdit width={17} height={17} /></button>
                  <button className='btn-ghost' title='Eliminar' onClick={(e) => remove(e, t)}><IconTrash width={17} height={17} /></button>
                </div>
              )}
              <div className='type-card-row'>
                <div className='type-card-main'>
                  <div className='card-title'>{t.name}</div>
                  <div className='card-desc'>{t.description || '---'}</div>
                </div>
                <div className='type-card-thumb'><AssetIllustration illustration={t.illustration} data={{}} /></div>
              </div>
              <div className='card-meta'>
                {c ? (<><span>{c.total} en total</span><span className='count-on'>● {c.on} activos</span><span className='count-off'>● {c.off} apagados</span></>) : '...'}
              </div>
            </div>
          )
        })}
        {items.length === 0 && <div className='empty'>Este sistema no tiene tipos de activo aun.</div>}
      </div>
      {editing   && <AssetTypeForm type={editing} systemId={system.id} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load() }} />}
      {fieldsFor && <FieldDefsEditor type={fieldsFor} onClose={() => { setFieldsFor(null); load() }} />}
    </>
  )
}

/* --- Nivel 3: Activos --- */
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
    if (!confirm('Eliminar el activo "' + a.name + '"?')) return
    try { await deleteAsset(a.id); load() } catch (err) { alert(err.message) }
  }

  if (!items) return <Loading />
  const sq = q.toLowerCase()
  const filtered = items.filter(a =>
    a.name.toLowerCase().includes(sq) || (a.alt_name || '').toLowerCase().includes(sq)
  )

  return (
    <>
      <div className='crumbs'>
        <button onClick={onBackRoot}>Sistemas</button>
        <span className='sep'>/</span>
        <button onClick={onBack}>{system.name}</button>
        <span className='sep'>/</span>
        <span className='current'>{type.name}</span>
      </div>
      <div className='toolbar'>
        <h1 className='page-title'>{type.name}</h1>
        <div className='spacer' />
        <div style={{ position:'relative' }}>
          <IconSearch width={16} height={16} style={{ position:'absolute', left:10, top:10, color:'var(--muted)' }} />
          <input className='search-input' style={{ paddingLeft:32 }} placeholder='Buscar...' value={q} onChange={e => setQ(e.target.value)} />
        </div>
        {canEdit && <button className='btn btn-primary' onClick={() => setEditing({ asset_type_id: type.id })}><IconPlus width={18} height={18} /> Nuevo activo</button>}
      </div>

      <div className='table-wrap'>
        <table>
          <thead>
            <tr>
              <th className='col-pin col-name'>Nombre</th>
              <th className='col-altname'>Nombre alternativo</th>
              {fieldDefs.map(f => <th key={f.id} className='col-field'>{f.label}</th>)}
              <th className='col-status'>Estado</th>
              <th className='col-actions'></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(a => (
              <tr key={a.id} onClick={() => setDetail(a)}>
                <td className='col-pin col-name' style={{ fontWeight:600 }}>{a.name}</td>
                <td className='col-altname'>{a.alt_name || '---'}</td>
                {fieldDefs.map(f => (
                  <td key={f.id} className='col-field'>{(a.data?.[f.key] != null && a.data[f.key] !== '') ? a.data[f.key] : '---'}</td>
                ))}
                <td className='col-status'><StatusPill status={a.status} /></td>
                <td className='col-actions'>
                  {canEdit && (
                    <div className='row-actions'>
                      <button className='btn-ghost' title='Editar' onClick={e => { e.stopPropagation(); setEditing(a) }}><IconEdit width={17} height={17} /></button>
                      <button className='btn-ghost' title='Eliminar' onClick={e => remove(e, a)}><IconTrash width={17} height={17} /></button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={3 + fieldDefs.length + 1}><div className='empty'>No hay activos.</div></td></tr>
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
  if (status === 'on')  return <span className='status-pill status-on'><span className='dot' /> ON</span>
  if (status === 'off') return <span className='status-pill status-off'><span className='dot' /> OFF</span>
  return <span className='status-pill status-na'>---</span>
}

function Loading() { return <div className='center-screen'><div className='spinner' /></div> }
