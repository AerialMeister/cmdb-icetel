import { useState } from 'react'
import { useAuth } from './auth/AuthContext.jsx'
import { supabaseConfigured } from './supabaseClient.js'
import Login from './components/Login.jsx'
import BrowseView from './components/BrowseView.jsx'
import UsersAdmin from './components/UsersAdmin.jsx'
import GlobalSearch from './components/GlobalSearch.jsx'
import { IconChip, IconUsers, IconLogout, IconSearch } from './components/Icons.jsx'

function Shell() {
  const { session, displayName, role, loading, isAdmin, signOut } = useAuth()
  const [tab, setTab] = useState('browse')
  const [browseKey, setBrowseKey] = useState(0)  // fuerza reset de BrowseView al volver al inicio
  const [searchOpen, setSearchOpen] = useState(false)

  if (!supabaseConfigured) {
    return (
      <div className="center-screen" style={{ flexDirection: 'column', gap: 12, padding: 24, textAlign: 'center' }}>
        <h2>Falta configurar Supabase</h2>
        <p style={{ maxWidth: 460, color: 'var(--muted)' }}>
          Crea un archivo <code>.env</code> (ver <code>.env.example</code>) con las 4 variables
          de entorno y reinicia <code>npm run dev</code>.
        </p>
      </div>
    )
  }

  if (loading) return <div className="center-screen"><div className="spinner" /></div>
  if (!session) return <Login />

  if (!role) {
    return (
      <div className="center-screen" style={{ flexDirection: 'column', gap: 12, textAlign: 'center' }}>
        <h3>Acceso pendiente</h3>
        <p style={{ color: 'var(--muted)', maxWidth: 360 }}>
          Tu cuenta está autenticada pero aún no tiene permisos asignados en la CMDB.
          Solicita a un administrador que te asigne un rol.
        </p>
        <button className="btn" onClick={signOut}>Cerrar sesión</button>
      </div>
    )
  }

  const goHome = () => {
    setTab('browse')
    setBrowseKey(k => k + 1)  // resetea navegación interna de BrowseView al menú principal
  }

  return (
    <>
      <header className="app-header">
        {/* Logo clickeable → vuelve al menú principal */}
        <button
          className="logo"
          onClick={goHome}
          title="Volver al menú principal"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <svg width="26" height="26" viewBox="0 0 32 32">
            <rect width="32" height="32" rx="7" fill="#1d4ed8"/>
            <g fill="#fff">
              <rect x="7" y="7"    width="18" height="5"   rx="1.5"/>
              <rect x="7" y="13.5" width="18" height="5"   rx="1.5"/>
              <rect x="7" y="20"   width="18" height="5"   rx="1.5"/>
            </g>
          </svg>
          CMDB <span>Icetel</span>
        </button>

        <nav className="tabs">
          <button
            className={'tab' + (tab === 'browse' ? ' active' : '')}
            onClick={() => setTab('browse')}
          >
            <IconChip width={18} height={18} /> Activos
          </button>
          {isAdmin && (
            <button
              className={'tab' + (tab === 'users' ? ' active' : '')}
              onClick={() => setTab('users')}
            >
              <IconUsers width={18} height={18} /> Usuarios
            </button>
          )}
        </nav>

        <div className="spacer" />

        {/* Buscador global — solo visible en pestaña Activos */}
        {tab === 'browse' && (
          <button
            className="btn"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            onClick={() => setSearchOpen(true)}
            title="Buscar activo"
          >
            <IconSearch width={16} height={16} /> Buscar activo
          </button>
        )}

        <div className="user-chip">
          <span>{displayName}</span>
          <span
            className="role-badge"
            title={role === 'admin' ? 'Administrador: puede editar' : 'Solo lectura'}
          >
            {role === 'admin' ? 'Admin' : 'Viewer'}
          </span>
          <button
            className="btn-ghost"
            style={{ color: '#fff' }}
            title="Cerrar sesión"
            onClick={signOut}
          >
            <IconLogout width={20} height={20} />
          </button>
        </div>
      </header>

      <main className="container">
        {tab === 'browse' && <BrowseView key={browseKey} />}
        {tab === 'users'  && isAdmin && <UsersAdmin />}
      </main>

      {searchOpen && <GlobalSearch onClose={() => setSearchOpen(false)} />}
    </>
  )
}

export default function App() {
  return <Shell />
}
