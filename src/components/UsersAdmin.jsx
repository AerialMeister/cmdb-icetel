import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../auth/AuthContext.jsx'
import Modal from './Modal.jsx'
import { sbDcsm, supabase } from '../supabaseClient.js'

const ROLES = [
  { v: 'admin',  l: 'Administrador', desc: 'Puede crear, editar y eliminar activos' },
  { v: 'viewer', l: 'Solo lectura',  desc: 'Puede consultar, pero no modificar'    },
]

export default function UsersAdmin() {
  const { user: currentUser, refreshRole } = useAuth()

  const [users, setUsers]     = useState(null)
  const [err, setErr]         = useState('')
  const [editing, setEditing] = useState(null)
  const [busy, setBusy]       = useState(false)

  const loadAll = useCallback(async () => {
    setErr('')
    try {
      const { data: dcsmUsers, error: dcsmErr } = await sbDcsm
        .from('dcsm_users')
        .select('id, email, full_name')
        .order('email')
      if (dcsmErr) throw dcsmErr

      const { data: rolesData, error: rolesErr } = await supabase
        .from('cmdb_roles')
        .select('user_id, role')
      if (rolesErr) throw rolesErr

      const rolesMap = {}
      for (const r of (rolesData || [])) rolesMap[r.user_id] = r.role

      const combined = (dcsmUsers || []).map(u => ({
        id:           u.id,
        email:        u.email || '',
        display_name: u.full_name || '',
        role:         rolesMap[u.id] ?? null,
      }))

      setUsers(combined)
    } catch (e) {
      setErr(e.message)
      setUsers([])
    }
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  const saveRole = async (userId, role, email, displayName) => {
    setBusy(true); setErr('')
    try {
      const { error } = await supabase
        .from('cmdb_roles')
        .upsert({
          user_id:      userId,
          role,
          email:        email       || '',
          display_name: displayName || '',
          updated_at:   new Date().toISOString(),
        }, { onConflict: 'user_id' })
      if (error) throw error
      if (userId === currentUser?.id) await refreshRole()
      await loadAll()
      setEditing(null)
    } catch (e) {
      setErr(e.message)
    } finally {
      setBusy(false)
    }
  }

  const removeRole = async (userId) => {
    if (!confirm('¿Quitar el acceso de este usuario a la CMDB?')) return
    setBusy(true); setErr('')
    try {
      const { error } = await supabase
        .from('cmdb_roles')
        .delete()
        .eq('user_id', userId)
      if (error) throw error
      if (userId === currentUser?.id) await refreshRole()
      await loadAll()
    } catch (e) {
      setErr(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="toolbar">
        <div>
          <h1 className="page-title">Usuarios con acceso</h1>
          <p className="page-sub">Cuentas corporativas y sus permisos en la CMDB</p>
        </div>
      </div>

      {err && <div className="banner banner-warn">{err}</div>}

      {users === null ? (
        <div className="center-screen"><div className="spinner" /></div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Rol en CMDB</th>
                <th style={{ width: 200 }}></th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && (
                <tr><td colSpan={4}><div className="empty">No hay usuarios.</div></td></tr>
              )}
              {users.map(u => {
                const isMe = u.id === currentUser?.id
                return (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 600 }}>
                      {u.display_name || <span style={{ color: 'var(--muted)' }}>—</span>}
                      {isMe && <span className="tag" style={{ marginLeft: 8, fontSize: 11 }}>Tú</span>}
                    </td>
                    <td>{u.email}</td>
                    <td>
                      {u.role ? (
                        <span
                          className="tag"
                          style={{
                            background: u.role === 'admin' ? 'var(--brand)' : 'var(--panel)',
                            color:      u.role === 'admin' ? '#fff'         : 'var(--text)',
                            border:     u.role === 'admin' ? 'none'         : '1px solid var(--border)',
                          }}
                        >
                          {ROLES.find(r => r.v === u.role)?.l}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--muted)', fontSize: 13 }}>Sin acceso</span>
                      )}
                    </td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="btn btn-sm"
                          onClick={() => setEditing(u)}
                          disabled={busy}
                        >
                          Asignar rol
                        </button>
                        {u.role && (
                          <button
                            className="btn btn-sm"
                            style={{ color: 'var(--danger, #dc2626)' }}
                            onClick={() => removeRole(u.id)}
                            disabled={busy || isMe}
                            title={isMe ? 'No puedes quitarte el acceso a ti mismo' : 'Quitar acceso'}
                          >
                            Quitar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          <p className="hint" style={{ marginTop: 16, padding: '0 4px' }}>
            Los usuarios con rol <strong>Administrador</strong> pueden crear, editar y eliminar activos.
            Los de <strong>Solo lectura</strong> pueden consultar sin modificar.
            Los usuarios <strong>Sin acceso</strong> pueden iniciar sesión pero no ver datos.
          </p>
        </div>
      )}

      {editing && (
        <RoleModal
          user={editing}
          currentRole={editing.role ?? 'viewer'}
          onClose={() => setEditing(null)}
          onSave={(role) => saveRole(editing.id, role, editing.email, editing.display_name)}
          busy={busy}
        />
      )}
    </>
  )
}

function RoleModal({ user, currentRole, onClose, onSave, busy }) {
  const [role, setRole] = useState(currentRole)

  return (
    <Modal size="sm" title={`Rol de ${user.display_name || user.email}`} onClose={onClose}
      footer={<>
        <button className="btn" onClick={onClose} disabled={busy}>Cancelar</button>
        <button className="btn btn-primary" onClick={() => onSave(role)} disabled={busy}>
          {busy ? 'Guardando…' : 'Guardar'}
        </button>
      </>}
    >
      <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 16 }}>
        Correo: <strong>{user.email}</strong>
      </p>
      <div className="field">
        <label>Rol en la CMDB</label>
        <select value={role} onChange={e => setRole(e.target.value)}>
          {ROLES.map(r => (
            <option key={r.v} value={r.v}>{r.l} — {r.desc}</option>
          ))}
        </select>
      </div>
    </Modal>
  )
}
