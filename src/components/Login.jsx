import { useState } from 'react'
import { useAuth } from '../auth/AuthContext.jsx'

const LogoIcetel = () => (
  <svg width="110" height="36" viewBox="0 0 110 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Icetel">
    <rect width="36" height="36" rx="8" fill="#0f3d6b"/>
    <g fill="#fff">
      <rect x="7" y="7"    width="22" height="5.5" rx="1.5"/>
      <rect x="7" y="14.5" width="22" height="5.5" rx="1.5"/>
      <rect x="7" y="22"   width="22" height="5.5" rx="1.5"/>
      <circle cx="11" cy="9.75"  r="1.4" fill="#22c55e"/>
      <circle cx="11" cy="17.25" r="1.4" fill="#22c55e"/>
      <circle cx="11" cy="24.75" r="1.4" fill="#22c55e"/>
    </g>
    <text x="44" y="24" fontFamily="system-ui,sans-serif" fontWeight="700" fontSize="16" fill="#0f3d6b">Icetel</text>
  </svg>
)

const LogoNextstream = () => (
  <svg width="130" height="36" viewBox="0 0 130 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Nextstream">
    <rect width="36" height="36" rx="8" fill="#7c3aed"/>
    <path d="M9 27 L18 9 L27 27" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <path d="M12.5 21 h11" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round"/>
    <text x="44" y="24" fontFamily="system-ui,sans-serif" fontWeight="700" fontSize="13" fill="#7c3aed">Nextstream</text>
  </svg>
)

export default function Login() {
  const { signIn } = useAuth()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [err,      setErr]      = useState('')
  const [busy,     setBusy]     = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setErr(''); setBusy(true)
    const error = await signIn(email.trim(), password)
    setBusy(false)
    if (error) {
      setErr(
        error.message === 'Invalid login credentials'
          ? 'Correo o contraseña incorrectos.'
          : error.message
      )
    }
  }

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={submit}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 8 }}>
          <LogoIcetel />
          <span style={{ color: '#cbd5e1', fontSize: 18, fontWeight: 300 }}>×</span>
          <LogoNextstream />
        </div>

        <div className="brand" style={{ marginTop: 8 }}>
          <div className="name">CMDB <span>Icetel</span></div>
        </div>

        <p className="lead">
          Base de activos de infraestructura de misión crítica.<br/>
          Ingresa con tu cuenta corporativa.
        </p>

        {err && <div className="login-error">{err}</div>}

        <div className="field">
          <label htmlFor="email">Correo</label>
          <input
            id="email" type="email" autoComplete="username" required
            value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="usuario@icetel.cl"
          />
        </div>
        <div className="field">
          <label htmlFor="pwd">Contraseña</label>
          <input
            id="pwd" type="password" autoComplete="current-password" required
            value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        <button className="btn btn-primary" disabled={busy}>
          {busy ? 'Ingresando…' : 'Ingresar'}
        </button>

        <div className="login-foot">
          Acceso restringido · Icetel / Nextstream · Datacenter
        </div>
      </form>
    </div>
  )
}
