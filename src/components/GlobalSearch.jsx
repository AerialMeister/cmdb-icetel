import { useEffect, useState, useRef } from 'react'
import Modal from './Modal.jsx'
import { supabase } from '../supabaseClient.js'
import { StatusPill } from './BrowseView.jsx'

export default function GlobalSearch({ onClose }) {
  const [q, setQ]           = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef(null)
  const timer = useRef(null)

  // Foco automático al abrir
  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 50) }, [])

  useEffect(() => {
    clearTimeout(timer.current)
    const query = q.trim()
    if (query.length < 2) { setResults([]); return }

    timer.current = setTimeout(async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('cmdb_assets')
          .select(`
            id, name, alt_name, status,
            cmdb_asset_types ( name, cmdb_systems ( name ) )
          `)
          .ilike('name', `%${query}%`)
          .limit(30)
        if (error) throw error
        setResults(data || [])
      } catch (e) {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 250)

    return () => clearTimeout(timer.current)
  }, [q])

  return (
    <Modal size="lg" title="Buscar activo" onClose={onClose}
      footer={<button className="btn" onClick={onClose}>Cerrar</button>}
    >
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <input
          ref={inputRef}
          type="text"
          className="search-input"
          style={{ width: '100%', paddingLeft: 16, fontSize: 15 }}
          placeholder="Escribe el nombre del activo…"
          value={q}
          onChange={e => setQ(e.target.value)}
        />
      </div>

      {loading && <div style={{ textAlign: 'center', padding: 20 }}><div className="spinner" /></div>}

      {!loading && q.trim().length >= 2 && results.length === 0 && (
        <div className="empty">No se encontraron activos con ese nombre.</div>
      )}

      {!loading && results.length > 0 && (
        <div className="table-wrap" style={{ maxHeight: 420, overflowY: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Nombre alternativo</th>
                <th>Tipo</th>
                <th>Sistema</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {results.map(a => (
                <tr key={a.id}>
                  <td style={{ fontWeight: 600 }}>{a.name}</td>
                  <td>{a.alt_name || '—'}</td>
                  <td>{a.cmdb_asset_types?.name || '—'}</td>
                  <td>{a.cmdb_asset_types?.cmdb_systems?.name || '—'}</td>
                  <td><StatusPill status={a.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {results.length === 30 && (
            <p className="hint" style={{ padding: '8px 4px' }}>
              Se muestran los primeros 30 resultados. Refina la búsqueda para ver más.
            </p>
          )}
        </div>
      )}

      {q.trim().length < 2 && (
        <p className="hint" style={{ textAlign: 'center', padding: 12 }}>
          Ingresa al menos 2 caracteres para buscar.
        </p>
      )}
    </Modal>
  )
}
