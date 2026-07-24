import { useEffect, useState } from 'react'
import Modal from './Modal.jsx'
import AssetIllustration from './AssetIllustration.jsx'
import { IconChip } from './Icons.jsx'
import { StatusPill } from './BrowseView.jsx'
import { getFieldDefs } from '../lib/api.js'
import { supabase } from '../supabaseClient.js'
import CircuitosModal from './CircuitosModal.jsx'

// Parsea el campo tablero_aguas_abajo (JSON array, texto libre o vacío)
function parseTablerosAbajo(v) {
  if (!v) return []
  if (Array.isArray(v)) return v.filter(Boolean)
  try { const p = JSON.parse(v); if (Array.isArray(p)) return p.filter(Boolean) } catch {}
  return String(v).split(',').map(s => s.trim()).filter(Boolean)
}

// Carga la cadena eléctrica del tablero que alimenta a un activo mecánico
async function loadCadenaElectrica(tableroNombre) {
  if (!tableroNombre) return null
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
  const campos = ['generador', 'empalme', 'subestacion', 'subestación', 'alimentado_por', 'ups', 'transformador', 'tablero_alimenta']
  const cadena = {}
  for (const [k, v] of Object.entries(tablero.data || {})) {
    if (v && campos.some(c => k.toLowerCase().includes(c))) cadena[k] = v
  }
  return Object.keys(cadena).length ? { nombre: tablero.name, cadena } : null
}

export default function AssetDetail({ asset, type, system, canEdit, onClose, onEdit }) {
  const [defs, setDefs]     = useState(null)
  const [cadena, setCadena] = useState(null)
  const [verCircuitos, setVerCircuitos] = useState(false)

  // El detalle de circuitos aplica a los tipos de activo "tablero ..."
  const esTablero = (type?.name || '').toLowerCase().includes('tablero')

  useEffect(() => { getFieldDefs(type.id).then(setDefs).catch(() => setDefs([])) }, [type.id])

  // Si el activo tiene campo "tablero_alimenta", carga su cadena eléctrica
  useEffect(() => {
    if (!asset.data) return
    const v = asset.data['tablero_alimenta'] || asset.data['tablero'] || ''
    if (v) loadCadenaElectrica(v).then(setCadena).catch(() => {})
  }, [asset])

  return (
    <Modal size="lg" title={asset.name} onClose={onClose}
      footer={<>
        {esTablero && (
          <button className="btn" style={{ marginRight: 'auto' }} onClick={() => setVerCircuitos(true)}>
            <IconChip width={17} height={17} /> Ver detalle de circuitos
          </button>
        )}
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
                const rawVal = asset.data?.[f.key]
                const key = (f.key || '').toLowerCase().trim()
                const label = (f.label || '').toLowerCase().trim()
                const isAbajo = key === 'tablero_aguas_abajo' || key === 'tableros_aguas_abajo' || label.includes('aguas abajo')

                if (isAbajo) {
                  const lista = parseTablerosAbajo(rawVal)
                  return (
                    <div key={f.id} style={{ marginBottom: 12 }}>
                      <div style={{
                        fontSize: 12, fontWeight: 700, color: '#1d4ed8',
                        textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8,
                        paddingBottom: 6, borderBottom: '1px solid var(--border)'
                      }}>
                        ⬇ {f.label}
                      </div>
                      {lista.length === 0 ? (
                        <span style={{ color: 'var(--muted)', fontSize: 13 }}>Sin tableros aguas abajo registrados</span>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {lista.map((t, i) => (
                            <div key={i} style={{
                              display: 'flex', alignItems: 'center', gap: 10,
                              padding: '6px 12px', background: 'var(--bg)',
                              border: '1px solid var(--border)', borderRadius: 6, fontSize: 13
                            }}>
                              <span style={{ color: 'var(--muted)', fontWeight: 600, minWidth: 20 }}>{i + 1}.</span>
                              <span>{t}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                }

                return <Prop key={f.id} k={f.label} v={fmt(rawVal)} />
              })}
            </div>
          )}
        </div>
      </div>

      {/* Cadena eléctrica — aparece si el activo tiene campo tablero_alimenta */}
      {cadena && (
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

      {verCircuitos && (
        <CircuitosModal asset={asset} canEdit={canEdit} onClose={() => setVerCircuitos(false)} />
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
