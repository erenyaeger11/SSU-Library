import { useState } from 'react'
import { BookOpen, Eye, EyeOff, LockKeyhole } from 'lucide-react'
import { authApi } from '../services/api'

export default function Login({ onLogin }) {
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const result = await authApi.login(form)
      onLogin(result.data)
    } catch (requestError) {
      setError(requestError.message || 'We could not sign you in. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-page">
      <section className="auth-art">
        <div className="auth-brand"><div className="brand-mark"><BookOpen size={21} /></div><div><strong>SSU Library</strong><small>SSU LIBRARY</small></div></div>
        <div className="auth-quote"><div className="quote-mark">“</div><h1>A little more time for the things that matter.</h1><p>A calm, thoughtful space to learn, discover, and find your next favorite idea.</p></div>
        <div className="auth-foot">A welcoming place for every reader.</div>
      </section>
      <section className="auth-form-side">
        <form className="auth-form" onSubmit={submit}>
          <div className="brand-mark" style={{ marginBottom: 25 }}><LockKeyhole size={19} /></div>
          <h2>Welcome back</h2><p>Sign in to your library staff account.</p>
          {error && <div className="alert alert-error" role="alert">{error}</div>}
          <div className="form-field"><label htmlFor="username">Username or email</label><input id="username" className="field-control" autoComplete="username" autoFocus required value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} placeholder="you@school.edu" /></div>
          <div className="form-field"><label htmlFor="password">Password</label><div className="password-wrap"><input id="password" className="field-control" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Enter your password" /><button type="button" className="password-toggle" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></div>
          <button className="button button-full" style={{ height: 43, marginTop: 7 }} disabled={busy}>{busy ? 'Signing in…' : 'Sign in to library'}</button>
          <div className="auth-help">Only authorized library staff can access this portal.</div>
        </form>
      </section>
    </div>
  )
}
