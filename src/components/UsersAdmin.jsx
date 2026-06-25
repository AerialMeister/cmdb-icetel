import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../auth/AuthContext.jsx'
import Modal from './Modal.jsx'
import { sbDcsm, supabase } from '../supabaseClient.js'

// ── Helpers de rol ─────────────────────────────────────────────────────────────
const ROLES = [
  { v: 'admin',  l: 'Administrador', desc: 'Puede crear, editar y eliminar activos' },
  { v: 'viewer', l: 'Solo lectura',  desc: 'Puede consultar, pero no modificar'    },
]
const roleLabel = (r) => ROLES.find(x => x.v === r)?.l ?? '—'

// ── Componente principal ────────────────────────────────────────────────────────
export default function UsersAdmin() {
  const { user: currentUser, refreshRole } = useAuth()

  const [dcsmUsers, setDcsmUsers]   = useState(null)   // usuarios del proyecto DCSM
  const [cmdbRoles, setCmdbRoles]   = useState({})     // { user_id: 'admin'|'viewer' }
  const [err, setErr]               = useState('')
  const [editing, setEditing]       = useState(null)   // usuario al que se le edita el rol
  const [busy, setBusy]             = useState(false)

  // Carga la lista de usuarios del proyecto DCSM usando la Admin API a través de sbDcsm
  // (disponible porque la anon key del proyecto DCSM permite listar usuarios públicos vía RPC,
  //  o bien lo hacemos leyendo los perfiles DCSM si hay una tabla pública. Aquí usamos
  //  la forma más simple: leer la tabla auth.users vía una Edge Function del proyecto DCSM
  //  — o, si no existe, obtenemos los usuarios que ya tienen rol registrado + el usuario actual)
  const loadAll = useCallback(async () => {
    setErr('')
    try {
      // 1. Leer roles desde la tabla cmdb_roles del proyecto CMDB propio
      const { data: rolesData, error: rolesErr } = await supabase
        .from('cmdb_roles')
        .select('user_id, role, email, display_name')
      if (rolesErr) throw rolesErr

      const rolesMap = {}
      const knownUsers = []
      for (const r of (rolesData || [])) {
        rolesMap[r.user_id] = r.role
        knownUsers.push({
          id:           r.user_id,
          email:        r.email        || '',
          display_name: r.display_name || '',
          role:         r.role,
        })
      }

      // 2. Asegurarse de que el usuario actual aparece aunque no tenga rol asignado aún
      const { data: me } = await sbDcsm.auth.getUser()
      if (me?.user) {
        const meId = me.user.id
        if (!rolesMap[meId]) {
          knownUsers.unshift({
            id:           meId,
            email:        me.user.email || '',
            display_name: me.user.user_metadata?.full_name || me.user.user_metadata?.name || '',
            role:         null,
          })
        }
      }

      setDcsmUsers(knownUsers)
      setCmdbRoles(rolesMap)
    } catch (e) {
      setErr(e.message)
      setDcsmUsers([])
    }
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  // Guarda o actualiza rol en cmdb_roles
  const saveRole = async (userId, role, email, displayName) => {
    setBusy(true); setErr('')
    try {
      const row = {
        user_id:      userId,
        role,
        email:        email       || '',
        display_name: displayName || '',
        updated_at:   new Date().toISOString(),
      }
      const { error } = await supabase
        .from('cmdb_roles')
        .upsert(row, { onConflict: 'user_id' })
      if (error) throw error

      // Si el usuario editado es el actual, refresca su rol en el contexto
      if (userId === currentUser?.id) await refreshRole()

      await loadAll()
      setEditing(null)
    } catch (e) {
      setErr(e.message)
    } finally {
      setBusy(false)
    }
  }

  // Elimina el rol (deja al usuario sin acceso admin/viewer → solo lectura implícita)
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

  // ── Añadir usuario por email (lo busca en DCSM y le asigna rol) ─────────────
  const [addEmail, setAddEmail]   = useState('')
  const [addRole, setAddRole]     = useState('viewer')
  const [addBusy, setAddBusy]     = useState(false)
  const [addErr, setAddErr]       = useState('')
  const [showAdd, setShowAdd]     = useState(false)

  const handleAdd = async () => {
    setAddErr('')
    if (!addEmail.trim()) { setAddErr('Ingresa un correo.'); return }
    setAddBusy(true)
    try {
      // Intenta obtener datos del usuario desde DCSM
      // Como no tenemos Admin API, usamos una búsqueda de sesión propia o RPC si existe.
      // Aquí usamos un enfoque pragmático: guardamos el row con el email como identificador
      // y el user_id se completará al primer login de ese usuario.
      // Si el usuario ya tiene sesión activa en el navegador, lo tenemos arriba.
      // Para el caso de agregar a alguien por email, guardamos un "pre-rol" con user_id vacío
      // y email como clave alternativa. La tabla cmdb_roles tiene una columna email indexada.
      const emailKey = addEmail.trim().toLowerCase()

      // Verificar si ya existe en los usuarios conocidos
      const exists = dcsmUsers?.find(u => u.email.toLowerCase() === emailKey)
      if (exists) {
        await saveRole(exists.id, addRole, exists.email, exists.display_name)
        setShowAdd(false); setAddEmail(''); setAddRole('viewer')
        return
      }

      // Si no está en la lista, guardarlo con un placeholder UUID derivado del email
      // (se actualizará cuando el usuario haga login y `loadRole` lo empareje por email)
      const { error } = await supabase.from('cmdb_roles').upsert({
        user_id:      'pending:' + emailKey,
        role:         addRole,
        email:        emailKey,
        display_name: '',
        updated_at:   new Date().toISOString(),
      }, { onConflict: 'user_id' })
      if (error) throw error
      await loadAll()
      setShowAdd(false); setAddEmail(''); setAddRole('viewer')
    } catch (e) {
      setAddErr(e.message)
    } finally {
      setAddBusy(false)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="toolbar">
        <div>
          <h1 className="page-title">Usuarios con acceso</h1>
          <p className="page-sub">Cuentas corporativas y sus permisos en la CMDB</p>
        </div>
        <div className="spacer" />
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          + Agregar usuario
        </button>
      </div>

      {err && <div className="banner banner-warn">{err}</div>}

      {dcsmUsers === null ? (
        <div className="center-screen"><div className="spinner" /></div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Rol en CMDB</th>
                <th style={{ width: 180 }}></th>
              </tr>
            </thead>
            <tbody>
              {dcsmUsers.length === 0 && (
                <tr><td colSpan={4}><div className="empty">No hay usuarios registrados.</div></td></tr>
              )}
              {dcsmUsers.map(u => {
                const isMe = u.id === currentUser?.id
                const rol  = cmdbRoles[u.id] ?? null
                return (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 600 }}>
                      {u.display_name || <span style={{ color: 'var(--muted)' }}>—</span>}
                      {isMe && <span className="tag" style={{ marginLeft: 8, fontSize: 11 }}>Tú</span>}
                    </td>
                    <td>{u.email}</td>
                    <td>
                      {rol ? (
                        <span
                          className="tag"
                          style={{
                            background: rol === 'admin' ? 'var(--brand)' : 'var(--panel)',
                            color:      rol === 'admin' ? '#fff'         : 'var(--text)',
                            border:     rol === 'admin' ? 'none'         : '1px solid var(--border)',
                          }}
                        >
                          {roleLabel(rol)}
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
                          Cambiar rol
                        </button>
                        {rol && (
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
            Los usuarios sin rol asignado no tienen acceso a ninguna función de edición.
          </p>
        </div>
      )}

      {/* Modal para editar rol */}
      {editing && (
        <RoleModal
          user={editing}
          currentRole={cmdbRoles[editing.id] ?? 'viewer'}
          onClose={() => setEditing(null)}
          onSave={(role) => saveRole(editing.id, role, editing.email, editing.display_name)}
          busy={busy}
        />
      )}

      {/* Modal para agregar usuario */}
      {showAdd && (
        <Modal size="sm" title="Agregar usuario" onClose={() => setShowAdd(false)}
          footer={<>
            <button className="btn" onClick={() => setShowAdd(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleAdd} disabled={addBusy}>
              {addBusy ? 'Guardando…' : 'Agregar'}
            </button>
          </>}
        >
          {addErr && <div className="error-text">{addErr}</div>}
          <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 16 }}>
            Ingresa el correo corporativo del usuario que ya tiene cuenta en el portal de horas extra o ITSM.
          </p>
          <div className="field">
            <label>Correo</label>
            <input
              type="email"
              value={addEmail}
              onChange={e => setAddEmail(e.target.value)}
              placeholder="usuario@icetel.cl"
            />
          </div>
          <div className="field">
            <label>Rol inicial</label>
            <select value={addRole} onChange={e => setAddRole(e.target.value)}>
              {ROLES.map(r => (
                <option key={r.v} value={r.v}>{r.l} — {r.desc}</option>
              ))}
            </select>
          </div>
        </Modal>
      )}
    </>
  )
}

// ── Sub-modal de cambio de rol ─────────────────────────────────────────────────
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
