import { useState } from 'react'
import Modal from './Modal.jsx'
import {
  getAllAssetTypes, getFieldDefs, getAssets, insertAssetsBulk, upsertAssetsBulk,
  getAllAssets, getCircuitos, saveCircuito,
} from '../lib/api.js'
import {
  parseFases, parseNumeroFase, parseEstado, parseNumero, nivelDeRuta, aplicarFilasEnTablero,
} from '../lib/circuitosExcel.js'

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

// Arma el plan de la hoja "Circuitos". La jerarquía viene en la columna
// Ruta; ver src/lib/circuitosExcel.js para el formato.
async function planCircuitos(XLSX, sheet, sheetName) {
  const aoa = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })
  const headers = (aoa[0] || []).map(h => String(h).trim())

  const idx = {}
  headers.forEach((h, i) => {
    const n = norm(h)
    if (n === 'tablero') idx.tablero = i
    else if (n === 'ruta') idx.ruta = i
    else if (n === 'tipo') idx.tipo = i
    else if (n === 'tag') idx.tag = i
    else if (n === 'marca') idx.marca = i
    else if (n === 'fila') idx.fila = i
    else if (n === 'rack') idx.rack = i
    else if (n === 'pdu') idx.pdu = i
    else if (n === 'cliente') idx.cliente = i
    else if (n === 'estado') idx.estado = i
    else if (n.includes('numero fase') || n === 'n fase') idx.numero_fase = i
    else if (n.startsWith('fase')) idx.fases = i
    else if (n.includes('capacidad')) idx.capacidad_a = i
    else if (n.includes('consumo') && n.includes('kw')) idx.consumo_kw = i
    else if (n.includes('consumo')) idx.consumo_a = i
    else if (n.includes('circuito')) idx.numero = i
  })

  const assets = await getAllAssets()
  const byName = new Map(assets.map(a => [norm(a.name), a]))

  const porTablero = new Map()
  const sinTablero = new Set()

  for (const r of aoa.slice(1)) {
    const get = (k) => (idx[k] === undefined ? '' : String(r[idx[k]] ?? '').trim())
    const tablero = get('tablero')
    if (!tablero) continue

    const asset = byName.get(norm(tablero))
    if (!asset) { sinTablero.add(tablero); continue }

    const ruta = get('ruta')
    const fila = {
      ruta,
      tipo: get('tipo'),
      numero: get('numero'),
      tag: get('tag'),
      fases: parseFases(get('fases')),
      numero_fase: parseNumeroFase(get('numero_fase')),
      estado: parseEstado(get('estado')),
      capacidad_a: parseNumero(get('capacidad_a')),
      consumo_a: parseNumero(get('consumo_a')),
      consumo_kw: parseNumero(get('consumo_kw')),
      marca: get('marca'),
      fila: get('fila'),
      rack: get('rack'),
      pdu: get('pdu'),
      cliente: get('cliente'),
      _nivel: nivelDeRuta(ruta),
    }
    if (!porTablero.has(asset.id)) {
      porTablero.set(asset.id, { assetId: asset.id, assetName: asset.name, filas: [] })
    }
    porTablero.get(asset.id).filas.push(fila)
  }

  const grupos = [...porTablero.values()]
  return {
    kind: 'circuitos',
    sheet: sheetName,
    typeName: 'Circuitos de tableros',
    grupos,
    filasTotal: grupos.reduce((a, g) => a + g.filas.length, 0),
    sinTablero: [...sinTablero],
    inserts: [], updates: [], ignored: [],
  }
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
        // ---- Hoja especial de circuitos de tableros ----
        if (norm(sheetName) === 'circuitos') {
          out.push(await planCircuitos(XLSX, wb.Sheets[sheetName], sheetName))
          continue
        }

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
      const nuevos = allInserts.length ? await insertAssetsBulk(allInserts) : 0
      const actualizados = allUpdates.length ? await upsertAssetsBulk(allUpdates) : 0

      // Circuitos: se procesan tablero por tablero porque hay que crear las
      // barras intermedias antes de colgarles las protecciones.
      let circCreados = 0
      let circActualizados = 0
      for (const p of plan.filter(x => x.kind === 'circuitos')) {
        for (const g of p.grupos) {
          const existentes = await getCircuitos(g.assetId)
          const res = await aplicarFilasEnTablero({
            assetId: g.assetId,
            filas: g.filas,
            existentes,
            guardar: saveCircuito,
          })
          circCreados += res.creados
          circActualizados += res.actualizados
        }
      }

      setResult({ nuevos, actualizados, circCreados, circActualizados })
      onDone?.()
    } catch (e) {
      setErr('Error al importar: ' + e.message)
    } finally {
      setImporting(false)
    }
  }

  const totalNew = plan ? plan.reduce((a, p) => a + p.inserts.length, 0) : 0
  const totalUpd = plan ? plan.reduce((a, p) => a + p.updates.length, 0) : 0
  const totalCirc = plan ? plan.reduce((a, p) => a + (p.filasTotal || 0), 0) : 0
  const total = totalNew + totalUpd + totalCirc

  return (
    <Modal size="lg" title="Importar activos desde Excel" onClose={onClose}
      footer={result == null ? (<>
        <button className="btn" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={doImport} disabled={!plan || total === 0 || importing}>
          {importing ? 'Importando…' : `Procesar ${total} fila(s)`}
        </button>
      </>) : (<button className="btn btn-primary" onClick={onClose}>Listo</button>)}>

      {result != null ? (
        <div className="banner" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534' }}>
          Importación completada: <b>{result.nuevos}</b> activo(s) creado(s) y <b>{result.actualizados}</b> actualizado(s).
          {(result.circCreados > 0 || result.circActualizados > 0) && (
            <> En circuitos: <b>{result.circCreados}</b> creado(s) y <b>{result.circActualizados}</b> actualizado(s).</>
          )}
        </div>
      ) : (
        <>
          <p className="hint" style={{ margin: 0 }}>
            Usa la plantilla <b>Plantilla_Carga_CMDB_Icetel.xlsx</b>. Cada hoja se asocia a un tipo por su nombre;
            la columna <b>Nombre</b> es obligatoria. Los activos con un <b>nombre ya existente se actualizan</b> (no se duplican).
          </p>
          <p className="hint" style={{ margin: 0 }}>
            La hoja <b>Circuitos</b> carga el detalle de los tableros. La columna <b>Ruta</b> lleva el camino
            de barras separado por <b>&gt;</b> (vacía = protección general; <i>BARRA PRINCIPAL</i>;
            <i> BARRA PRINCIPAL &gt; C3 &gt; BARRA TDA-2</i>). Las barras que falten se crean solas.
            <b> Capacidad (A)</b> y <b>Consumo kW</b> van solo como número, sin unidad.
            Nada se borra: solo se agrega y se actualiza.
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
                      <td>{p.kind === 'circuitos' ? p.filasTotal : p.inserts.length}</td>
                      <td>{p.kind === 'circuitos' ? '—' : p.updates.length}</td>
                      <td className="hint">
                        {p.kind === 'circuitos'
                          ? (p.sinTablero.length
                              ? 'Tablero no encontrado: ' + p.sinTablero.join(', ')
                              : '—')
                          : (p.ignored.length ? p.ignored.join(', ') : '—')}
                      </td>
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
