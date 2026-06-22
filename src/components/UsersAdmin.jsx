import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext.jsx'
import Modal from './Modal.jsx'
import { adminUsers } from '../lib/api.js'
import { IconPlus, IconEdit, IconTrash, IconKey } from './Icons.jsx'

const ROLES = [
  { v: 'admin', l: 'Administrador' },
  { v: 'editor', l: 'Editor' },
  { v: 'viewer', l: 'Solo lectura' },
]

export default function UsersAdmin() {
  const { session } = useAuth()
  const [users, setUsers] = useState(null)
  const [err, setErr] = useState('')
  const [editing, setEditing] = useState(null)
  const [pwdFor, setPwdFor] = useState(null)

  const load = async () => {
    setErr('')
    try { const r = await adminUsers('list'); setUsers(r.users) }
    catch (e) { setErr(e.message); setUsers([]) }
  }
  useEffect(() => { load() }, [])

  const remove = async (u) => {
    if (!confirm(`¿Eliminar la cuenta ${u.email}?`)) return
    try { await adminUsers('delete', { id: u.id }); load() } catch (e) { alert(e.message) }
  }
  const toggleActive = async (u) => {
    try { await adminUsers('update', { id: u.id, active: !u.active }); load() } catch (e) { alert(e.message) }
  }

  return (
    <>
      <div className="toolbar">
        <div>
          <h1 className="page-title">Usuarios</h1>
          <p className="page-sub">Cuentas con acceso al portal CMDB</p>
        </div>
        <div className="spacer" />
        <button className="btn btn-primary" onClick={() => setEditing({})}><IconPlus width={18} height={18} /> Nueva cuenta</button>
      </div>

      {err && <div className="banner banner-warn">{err}</div>}

      {users === null ? <div className="center-screen"><div className="spinner" /></div> : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Estado</th><th style={{ width: 140 }}></th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ cursor: 'default' }}>
                  <td style={{ fontWeight: 600 }}>{u.full_name || '—'}</td>
                  <td>{u.email}</td>
                  <td><span className="tag">{ROLES.find(r => r.v === u.role)?.l || u.role}</span></td>
                  <td>
                    <button className={'status-pill ' + (u.active ? 'status-on' : 'status-off')}
                      style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                      onClick={() => toggleActive(u)} title="Activar / desactivar">
                      <span className="dot" /> {u.active ? 'Activo' : 'Inactivo'}
                    </button>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button className="btn-ghost" title="Editar" onClick={() => setEditing(u)}><IconEdit width={17} height={17} /></button>
                      <button className="btn-ghost" title="Resetear contraseña" onClick={() => setPwdFor(u)}><IconKey width={17} height={17} /></button>
                      <button className="btn-ghost" title="Eliminar" disabled={u.id === session?.user?.id}
                        onClick={() => remove(u)}><IconTrash width={17} height={17} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && <tr><td colSpan={5}><div className="empty">Sin usuarios.</div></td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {editing && <UserForm user={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load() }} />}
      {pwdFor && <PasswordForm user={pwdFor} onClose={() => setPwdFor(null)} onSaved={() => setPwdFor(null)} />}
    </>
  )
}

function UserForm({ user, onClose, onSaved }) {
  const isNew = !user.id
  const [email, setEmail] = useState(user.email || '')
  const [fullName, setFullName] = useState(user.full_name || '')
  const [role, setRole] = useState(user.role || 'viewer')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const submit = async () => {
    setErr('')
    if (!email.trim()) { setErr('El correo es obligatorio.'); return }
    if (isNew && password.length < 8) { setErr('La contraseña debe tener al menos 8 caracteres.'); return }
    setBusy(true)
    try {
      if (isNew) await adminUsers('create', { email: email.trim(), password, full_name: fullName, role })
      else await adminUsers('update', { id: user.id, email: email.trim(), full_name: fullName, role })
      onSaved()
    } catch (e) { setErr(e.message); setBusy(false) }
  }

  return (
    <Modal size="sm" title={isNew ? 'Nueva cuenta' : 'Editar cuenta'} onClose={onClose}
      footer={<>
        <button className="btn" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={submit} disabled={busy}>{busy ? 'Guardando…' : 'Guardar'}</button>
      </>}>
      {err && <div className="error-text">{err}</div>}
      <div className="field">
        <label>Nombre</label>
        <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} />
      </div>
      <div className="field">
        <label>Correo</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="usuario@icetel.cl" />
      </div>
      <div className="field">
        <label>Rol</label>
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          {ROLES.map(r => <option key={r.v} value={r.v}>{r.l}</option>)}
        </select>
      </div>
      {isNew && (
        <div className="field">
          <label>Contraseña inicial</label>
          <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="mínimo 8 caracteres" />
          <span className="hint">El usuario podrá cambiarla luego. Mínimo 8 caracteres.</span>
        </div>
      )}
    </Modal>
  )
}

function PasswordForm({ user, onClose, onSaved }) {
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const submit = async () => {
    if (password.length < 8) { setErr('Mínimo 8 caracteres.'); return }
    setBusy(true); setErr('')
    try { await adminUsers('reset_password', { id: user.id, password }); onSaved() }
    catch (e) { setErr(e.message); setBusy(false) }
  }

  return (
    <Modal size="sm" title={`Resetear contraseña · ${user.email}`} onClose={onClose}
      footer={<>
        <button className="btn" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={submit} disabled={busy}>{busy ? 'Guardando…' : 'Cambiar contraseña'}</button>
      </>}>
      {err && <div className="error-text">{err}</div>}
      <div className="field">
        <label>Nueva contraseña</label>
        <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="mínimo 8 caracteres" />
        <span className="hint">Se aplicará de inmediato. Comunícala al usuario por un canal seguro.</span>
      </div>
    </Modal>
  )
}
