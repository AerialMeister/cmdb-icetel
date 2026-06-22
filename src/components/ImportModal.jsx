import { useState } from 'react'
import Modal from './Modal.jsx'
import { getAllAssetTypes, getFieldDefs, getAssets, insertAssetsBulk, upsertAssetsBulk } from '../lib/api.js'

// SheetJS se carga desde CDN bajo demanda (sin dependencia npm).
let xlsxPromise = null
function loadXLSX() {
  if (typeof window !== 'undefined' && window.XLSX) return Promise.resolve(window.XLSX)
  if (xlsxPromise) return xlsxPromise
  xlsxPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
    s.async = true
    s.onload = () => resolve(window.XLSX)
    s.onerror = () => reject(new Error('No se pudo cargar la librería de Excel (revisa tu conexión).'))
    document.head.appendChild(s)
  })
  return xlsxPromise
}

const norm = (s) => String(s ?? '').toLowerCase().normalize('NFD')
  .replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim()

const parseStatus = (v) => {
  const n = norm(v)
  if (['on', 'encendido', '1', 'true', 'si'].includes(n)) return 'on'
  if (['off', 'apagado', '0', 'false', 'no'].includes(n)) return 'off'
  return null
}

export default function ImportModal({ onClose, onDone }) {
  const [plan, setPlan] = useState(null)
  const [fileName, setFileName] = useState('')
  const [parsing, setParsing] = useState(false)
  const [importing, setImporting] = useState(false)
  const [err, setErr] = useState('')
  const [result, setResult] = useState(null)

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setErr(''); setResult(null); setPlan(null); setParsing(true); setFileName(file.name)
    try {
      const XLSX = await loadXLSX()
      const buf = await file.arrayBuffer()
      const wb = XLSX.read(buf, { type: 'array' })
      const types = await getAllAssetTypes()
      const typeByName = {}
      types.forEach(t => { typeByName[norm(t.name)] = t })

      const out = []
      for (const sheetName of wb.SheetNames) {
        const t = typeByName[norm(sheetName)]
        if (!t) continue   // hojas como "Instrucciones" se ignoran
        const aoa = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, defval: '' })
        if (!aoa.length) continue
        const headers = aoa[0].map(h => String(h).trim())
        const dataRows = aoa.slice(1)

        const defs = await getFieldDefs(t.id)
        const fieldByNorm = {}
        defs.forEach(f => { fieldByNorm[norm(f.label)] = f.key; fieldByNorm[norm(f.key)] = f.key })

        // mapeo de columnas
        const colMap = headers.map(h => {
          const nh = norm(h)
          if (nh.includes('alternativ')) return { kind: 'altname', header: h }
          if (nh === 'nombre') return { kind: 'name', header: h }
          if (nh.includes('estado') || nh === 'on off') return { kind: 'status', header: h }
          if (fieldByNorm[nh]) return { kind: 'field', key: fieldByNorm[nh], header: h }
          return { kind: 'ignore', header: h }
        })
        const ignored = colMap.filter(c => c.kind === 'ignore' && c.header).map(c => c.header)

        // activos existentes de este tipo (para actualizar por nombre)
        const existing = await getAssets(t.id)
        const byName = {}
        existing.forEach(a => { byName[norm(a.name)] = a })

        // parseo de filas (de-duplicando por nombre dentro de la hoja: última gana)
        const parsedByName = {}
        for (const r of dataRows) {
          const prov = { data: {} }
          let nm = ''
          colMap.forEach((cm, i) => {
            const val = r[i]
            if (val === undefined || val === '') return
            const sval = String(val).trim()
            if (cm.kind === 'name') nm = sval
            else if (cm.kind === 'altname') prov.altName = sval
            else if (cm.kind === 'status') prov.status = parseStatus(sval)
            else if (cm.kind === 'field') prov.data[cm.key] = sval
          })
          if (nm) parsedByName[norm(nm)] = { name: nm, prov }
        }

        const inserts = []
        const updates = []
        for (const key of Object.keys(parsedByName)) {
          const { name, prov } = parsedByName[key]
          const ex = byName[key]
          if (ex) {
            updates.push({
              id: ex.id,
              asset_type_id: t.id,
              name,
              alt_name: 'altName' in prov ? prov.altName : (ex.alt_name ?? null),
              status: 'status' in prov ? prov.status : (ex.status ?? null),
              data: { ...(ex.data || {}), ...prov.data },
            })
          } else {
            inserts.push({
              asset_type_id: t.id,
              name,
              alt_name: prov.altName ?? null,
              status: prov.status ?? null,
              data: prov.data,
            })
          }
        }
        out.push({ sheet: sheetName, typeName: t.name, inserts, updates, ignored })
      }
      if (out.length === 0) setErr('No se encontraron hojas que coincidan con tipos de activo de la CMDB.')
      setPlan(out)
    } catch (e) {
      setErr('No se pudo leer el archivo: ' + e.message)
    } finally {
      setParsing(false)
    }
  }

  const doImport = async () => {
    setImporting(true); setErr('')
    try {
      const allInserts = plan.flatMap(p => p.inserts)
      const allUpdates = plan.flatMap(p => p.updates)
      const nuevos = await insertAssetsBulk(allInserts)
      const actualizados = allUpdates.length ? await upsertAssetsBulk(allUpdates) : 0
      setResult({ nuevos, actualizados })
      onDone?.()
    } catch (e) {
      setErr('Error al importar: ' + e.message)
    } finally {
      setImporting(false)
    }
  }

  const totalNew = plan ? plan.reduce((a, p) => a + p.inserts.length, 0) : 0
  const totalUpd = plan ? plan.reduce((a, p) => a + p.updates.length, 0) : 0
  const total = totalNew + totalUpd

  return (
    <Modal size="lg" title="Importar activos desde Excel" onClose={onClose}
      footer={result == null ? (<>
        <button className="btn" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={doImport} disabled={!plan || total === 0 || importing}>
          {importing ? 'Importando…' : `Procesar ${total} activo(s)`}
        </button>
      </>) : (<button className="btn btn-primary" onClick={onClose}>Listo</button>)}>

      {result != null ? (
        <div className="banner" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534' }}>
          Importación completada: <b>{result.nuevos}</b> activo(s) creado(s) y <b>{result.actualizados}</b> actualizado(s).
        </div>
      ) : (
        <>
          <p className="hint" style={{ margin: 0 }}>
            Usa la plantilla <b>Plantilla_Carga_CMDB_Icetel.xlsx</b>. Cada hoja se asocia a un tipo por su nombre;
            la columna <b>Nombre</b> es obligatoria. Los activos con un <b>nombre ya existente se actualizan</b> (no se duplican).
          </p>

          <div className="field">
            <label className="btn btn-primary" style={{ width: 'fit-content' }}>
              Seleccionar archivo .xlsx
              <input type="file" accept=".xlsx,.xls" onChange={handleFile} style={{ display: 'none' }} />
            </label>
            {fileName && <span className="hint">{fileName}</span>}
          </div>

          {err && <div className="error-text">{err}</div>}
          {parsing && <div className="spinner" />}

          {plan && plan.length > 0 && (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Hoja</th><th>Tipo destino</th><th>Nuevos</th><th>Actualizar</th><th>Columnas ignoradas</th></tr></thead>
                <tbody>
                  {plan.map(p => (
                    <tr key={p.sheet} style={{ cursor: 'default' }}>
                      <td style={{ fontWeight: 600 }}>{p.sheet}</td>
                      <td>{p.typeName}</td>
                      <td>{p.inserts.length}</td>
                      <td>{p.updates.length}</td>
                      <td className="hint">{p.ignored.length ? p.ignored.join(', ') : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </Modal>
  )
}
