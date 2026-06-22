import { useState } from 'react'
import { useAuth } from '../auth/AuthContext.jsx'

export default function Login() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setErr(''); setBusy(true)
    const error = await signIn(email.trim(), password)
    setBusy(false)
    if (error) {
      setErr(error.message === 'Invalid login credentials'
        ? 'Correo o contraseña incorrectos.'
        : error.message)
    }
  }

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={submit}>
        <div className="brand">
          <svg width="40" height="40" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#0f3d6b"/><g fill="#fff"><rect x="7" y="7" width="18" height="5" rx="1.5"/><rect x="7" y="13.5" width="18" height="5" rx="1.5"/><rect x="7" y="20" width="18" height="5" rx="1.5"/><circle cx="10.5" cy="9.5" r="1.1" fill="#22c55e"/><circle cx="10.5" cy="16" r="1.1" fill="#22c55e"/><circle cx="10.5" cy="22.5" r="1.1" fill="#22c55e"/></g></svg>
          <div className="name">CMDB <span>Icetel</span></div>
        </div>
        <p className="lead">Base de activos de infraestructura de misión crítica. Ingresa con tu cuenta.</p>

        {err && <div className="login-error">{err}</div>}

        <div className="field">
          <label htmlFor="email">Correo</label>
          <input id="email" type="email" autoComplete="username" required
            value={email} onChange={(e) => setEmail(e.target.value)} placeholder="usuario@icetel.cl" />
        </div>
        <div className="field">
          <label htmlFor="pwd">Contraseña</label>
          <input id="pwd" type="password" autoComplete="current-password" required
            value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </div>

        <button className="btn btn-primary" disabled={busy}>
          {busy ? 'Ingresando…' : 'Ingresar'}
        </button>
        <div className="login-foot">Acceso restringido · Icetel · Datacenter</div>
      </form>
    </div>
  )
}
