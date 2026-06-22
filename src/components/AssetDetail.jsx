import { useEffect, useState } from 'react'
import Modal from './Modal.jsx'
import AssetIllustration from './AssetIllustration.jsx'
import { StatusPill } from './BrowseView.jsx'
import { getFieldDefs } from '../lib/api.js'

export default function AssetDetail({ asset, type, system, canEdit, onClose, onEdit }) {
  const [defs, setDefs] = useState(null)
  useEffect(() => { getFieldDefs(type.id).then(setDefs).catch(() => setDefs([])) }, [type.id])

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
              {defs.map(f => <Prop key={f.id} k={f.label} v={fmt(asset.data?.[f.key])} />)}
            </div>
          )}
        </div>
      </div>
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
