import { useEffect, useState } from 'react'
import Modal from './Modal.jsx'
import AssetIllustration from './AssetIllustration.jsx'
import { StatusPill } from './BrowseView.jsx'
import { getFieldDefs } from '../lib/api.js'
import { supabase } from '../supabaseClient.js'

const TABLERO_FIELD_KEYS = ['tablero', 'tablero_electrico', 'tablero electrico']
const TABLEROS_ABAJO_KEYS = ['tablero_aguas_abajo', 'tableros_aguas_abajo', 'aguas_abajo', 'tablero aguas abajo', 'tableros aguas abajo']

// Parsea el campo tableros_aguas_abajo (puede ser JSON array o texto)
function parseTablerosAbajo(v) {
  if (!v) return []
  if (Array.isArray(v)) return v.filter(Boolean)
  try { const p = JSON.parse(v); if (Array.isArray(p)) return p.filter(Boolean) } catch {}
  return v.split(',').map(s => s.trim()).filter(Boolean)
}

// Carga la cadena eléctrica de un tablero dado su nombre
async function loadCadenaElectrica(tableroNombre) {
  if (!tableroNombre) return null
  // Buscar el tablero por nombre en cmdb_asset_types de tipo tablero
  const { data: types } = await supabase
    .from('cmdb_asset_types').select('id').ilike('name', '%tablero%')
  if (!types?.length) return null
  const { data: assets } = await supabase
    .from('cmdb_assets').select('id, name, data')
    .in('asset_type_id', types.map(t => t.id))
    .ilike('name', tableroNombre)
    .limit(1)
  if (!assets?.length) return null
  const tablero = assets[0]
  // Recopilar campos relevantes de la cadena
  const campos = ['generador', 'empalme', 'subestacion', 'subestación', 'alimentado_por', 'alimentado por', 'ups', 'transformador']
  const cadena = {}
  for (const [k, v] of Object.entries(tablero.data || {})) {
    if (campos.some(c => k.toLowerCase().includes(c)) && v) cadena[k] = v
  }
  return { nombre: tablero.name, cadena }
}

export default function AssetDetail({ asset, type, system, canEdit, onClose, onEdit }) {
  const [defs, setDefs] = useState(null)
  const [cadena, setCadena] = useState(null)   // cadena eléctrica del tablero asociado

  useEffect(() => { getFieldDefs(type.id).then(setDefs).catch(() => setDefs([])) }, [type.id])

  // Si el activo tiene un campo "tablero", cargar la cadena eléctrica
  useEffect(() => {
    if (!asset.data) return
    const tableroKey = Object.keys(asset.data).find(k =>
      TABLERO_FIELD_KEYS.includes(k.toLowerCase().trim())
    )
    if (!tableroKey || !asset.data[tableroKey]) return
    loadCadenaElectrica(asset.data[tableroKey]).then(setCadena).catch(() => {})
  }, [asset])

  return (
    <Modal size="lg" title={asset.name} onClose={onClose}
      footer={<>
        <button className="btn" onClick={onClose}>Cerrar</button>
        {canEdit && <button className="btn btn-primary" onClick={onEdit}>Editar</button>}
      </>}>
      <div className="detail-grid">
        <div>
          <div className="illustration-box">
            <AssetIllustration illustration={type.illustration} data={asset.data} imageUrl={asset.image_url} />
          </div>
        </div>
        <div>
          <div className="detail-props" style={{ marginBottom: 18 }}>
            <Prop k="Nombre alternativo" v={asset.alt_name} />
            <Prop k="Sistema" v={system.name} />
            <Prop k="Tipo" v={type.name} />
            <Prop k="Estado" v={asset.status ? <StatusPill status={asset.status} /> : null} />
            <Prop k="ID único" v={<span style={{ fontFamily: 'monospace', fontSize: 12 }}>{asset.id}</span>} />
          </div>
          {defs === null ? <div className="spinner" /> : (
            <div className="detail-props">
              {defs.map(f => {
                const isAbajo = TABLEROS_ABAJO_KEYS.includes((f.key || '').toLowerCase().trim()) ||
                                TABLEROS_ABAJO_KEYS.includes((f.label || '').toLowerCase().trim())
                const rawVal = asset.data?.[f.key]
                if (isAbajo) {
                  const lista = parseTablerosAbajo(rawVal)
                  return (
                    <div className="prop" key={f.id} style={{ alignItems: 'flex-start' }}>
                      <span className="k">{f.label}</span>
                      <span className="v">
                        {lista.length === 0
                          ? <span className="empty-v">—</span>
                          : <ul style={{ margin: 0, paddingLeft: 16 }}>
                              {lista.map((t, i) => <li key={i} style={{ fontSize: 13 }}>{t}</li>)}
                            </ul>
                        }
                      </span>
                    </div>
                  )
                }
                return <Prop key={f.id} k={f.label} v={fmt(rawVal)} />
              })}
            </div>
          )}
        </div>
      </div>

      {/* Cadena eléctrica — solo aparece si el activo tiene campo "tablero" */}
      {cadena && Object.keys(cadena.cadena).length > 0 && (
        <div style={{
          marginTop: 20, padding: '14px 18px',
          background: 'var(--panel)', border: '1px solid var(--border)',
          borderRadius: 10, borderLeft: '4px solid #1d4ed8'
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#1d4ed8', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            ⚡ Cadena eléctrica — vía tablero {cadena.nombre}
          </div>
          <div className="detail-props">
            {Object.entries(cadena.cadena).map(([k, v]) => (
              <Prop key={k} k={k.replace(/_/g, ' ')} v={v} />
            ))}
          </div>
        </div>
      )}
    </Modal>
  )
}

function fmt(v) {
  if (v === 'si') return 'Sí'
  if (v === 'no') return 'No'
  return v
}

function Prop({ k, v }) {
  const empty = v === undefined || v === null || v === ''
  return (
    <div className="prop">
      <span className="k">{k}</span>
      <span className={'v' + (empty ? ' empty-v' : '')}>{empty ? '—' : v}</span>
    </div>
  )
}
