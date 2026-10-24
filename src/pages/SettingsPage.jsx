import { useState } from 'react'
import { ShieldCheck, Clock3, KeyRound } from 'lucide-react'
import { authApi } from '../services/api'

export default function SettingsPage({ user, onUserUpdated }) {
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [passwords, setPasswords] = useState({ current_password: '', new_password: '', confirm_password: '' })
  const logout = async () => { try { await authApi.logout(); window.location.assign('/login') } catch (e) { setNotice(e.message) } }
  const updatePassword = async (event) => {
    event.preventDefault()
    setError('')
    setNotice('')
    if (passwords.new_password !== passwords.confirm_password) {
      setError('The new passwords do not match.')
      return
    }
    setSaving(true)
    try {
      const response = await authApi.changePassword({ current_password: passwords.current_password, new_password: passwords.new_password })
      onUserUpdated(response.data)
      setPasswords({ current_password: '', new_password: '', confirm_password: '' })
      setNotice(response.message)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }
  return <>
    <div className="page-intro"><div><h2>{user?.must_change_password ? 'One quick security step.' : 'A comfortable desk, your way.'}</h2><p>{user?.must_change_password ? 'Choose a stronger password before you start using the staff portal.' : 'Your account and a few helpful notes about this workspace.'}</p></div></div>
    {notice && <div className="alert alert-success">{notice}</div>}
    <div className="settings-grid">
      <section className="content-card"><div className="content-heading"><h3>Staff account</h3></div>
        <div className="setting-row"><div><strong>Name</strong><p>{user?.name || 'Library staff'}</p></div></div>
        <div className="setting-row"><div><strong>Email</strong><p>{user?.email || 'Not provided'}</p></div></div>
        <div className="setting-row"><div><strong>Role</strong><p>{user?.role || 'Staff'}</p></div><span className="status-pill"><ShieldCheck size={12} /> Authorized</span></div>
        <div className="setting-row"><div><strong>Session security</strong><p>Your session is protected by a server-side PHP session.</p></div></div>
        <div style={{ borderTop: '1px solid #eff1ef', paddingTop: 17, marginTop: 17 }}>
          <div className="content-heading"><h3>{user?.must_change_password ? 'Set a new password' : 'Change password'}</h3></div>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={updatePassword}>
            <div className="form-grid">
              <div className="form-field form-span"><label htmlFor="current-password">Current password</label><input className="field-control" id="current-password" type="password" autoComplete="current-password" required value={passwords.current_password} onChange={(e) => setPasswords({ ...passwords, current_password: e.target.value })} /></div>
              <div className="form-field"><label htmlFor="new-password">New password</label><input className="field-control" id="new-password" type="password" autoComplete="new-password" minLength={12} required value={passwords.new_password} onChange={(e) => setPasswords({ ...passwords, new_password: e.target.value })} /><small className="form-help">At least 12 characters.</small></div>
              <div className="form-field"><label htmlFor="confirm-password">Confirm new password</label><input className="field-control" id="confirm-password" type="password" autoComplete="new-password" minLength={12} required value={passwords.confirm_password} onChange={(e) => setPasswords({ ...passwords, confirm_password: e.target.value })} /></div>
            </div>
            <div style={{ marginTop: 15 }}><button className="button" disabled={saving}><KeyRound size={14} />{saving ? 'Updating…' : 'Update password'}</button></div>
          </form>
        </div>
        <div style={{ marginTop: 17 }}><button className="button button-secondary" onClick={logout}>Sign out of this account</button></div>
      </section>
      <aside className="settings-aside"><div style={{ width: 35, height: 35, borderRadius: 10, background: '#dcebe0', color: '#477656', display: 'grid', placeItems: 'center', marginBottom: 13 }}><Clock3 size={18} /></div><h3>Time is kept server-side.</h3><p>Visitor dates and check-in times are created by the PHP API and MySQL database, so reports don’t depend on a staff device’s clock.</p></aside>
    </div>
  </>
}
