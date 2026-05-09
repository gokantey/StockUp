import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Eye, EyeOff, KeyRound, User, Mail, Shield, CheckCircle } from 'lucide-react'
import api from '../api/axios'
import useAuthStore from '../store/authStore'

export default function Account() {
  const { user } = useAuthStore()

  const [form,        setForm]        = useState({ current_password: '', new_password: '', confirm_password: '' })
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew,     setShowNew]     = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error,       setError]       = useState('')
  const [success,     setSuccess]     = useState(false)
  const [loading,     setLoading]     = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (form.new_password !== form.confirm_password) {
      setError('New passwords do not match.')
      return
    }
    if (form.new_password.length < 8) {
      setError('New password must be at least 8 characters.')
      return
    }

    setLoading(true)
    try {
      await api.post('/users/me/change-password/', {
        current_password: form.current_password,
        new_password:     form.new_password,
      })
      setSuccess(true)
      setForm({ current_password: '', new_password: '', confirm_password: '' })
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Account</h1>
          <p className="page-subtitle">Your profile and security settings</p>
        </div>
      </div>

      {/* Profile card */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <span className="card-header-title">Profile</span>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.5rem' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '14px', flexShrink: 0,
              background: 'linear-gradient(135deg, var(--teal), var(--blue))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#061010', fontSize: '1.125rem', fontWeight: 800,
              boxShadow: '0 4px 16px var(--teal-glow)',
            }}>
              {user?.full_name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: '1.0625rem', color: 'var(--text)', marginBottom: '0.2rem' }}>{user?.full_name}</p>
              <span className={`badge ${user?.role === 'admin' ? 'badge-teal' : 'badge-blue'}`}>
                {user?.role === 'admin' ? <><Shield size={10} /> Admin</> : <><User size={10} /> Staff</>}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '0.875rem 1rem', background: 'var(--surface)', borderRadius: '10px', border: '1px solid var(--border)' }}>
              <Mail size={15} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: '0.69rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.2rem' }}>Email</p>
                <p style={{ fontSize: '0.875rem', color: 'var(--text)' }}>{user?.email}</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '0.875rem 1rem', background: 'var(--surface)', borderRadius: '10px', border: '1px solid var(--border)' }}>
              <Shield size={15} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: '0.69rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.2rem' }}>Role</p>
                <p style={{ fontSize: '0.875rem', color: 'var(--text)', textTransform: 'capitalize' }}>{user?.role}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Change password card */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <KeyRound size={15} style={{ color: 'var(--teal)' }} />
            <span className="card-header-title">Change Password</span>
          </div>
        </div>
        <div className="card-body">
          {success && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--green-dim)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '10px', padding: '0.875rem 1rem', marginBottom: '1.25rem' }}>
              <CheckCircle size={16} style={{ color: 'var(--green)', flexShrink: 0 }} />
              <p style={{ fontSize: '0.845rem', color: 'var(--green)', fontWeight: 600 }}>Password changed successfully.</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="form-group">
            <div>
              <label className="label">Current Password *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showCurrent ? 'text' : 'password'}
                  required className="input"
                  style={{ paddingRight: '2.75rem' }}
                  placeholder="Your current password"
                  value={form.current_password}
                  onChange={e => set('current_password', e.target.value)}
                />
                <button type="button" onClick={() => setShowCurrent(v => !v)} style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex' }}>
                  {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div>
              <label className="label">New Password *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showNew ? 'text' : 'password'}
                  required className="input"
                  style={{ paddingRight: '2.75rem' }}
                  placeholder="Min 8 characters"
                  value={form.new_password}
                  onChange={e => set('new_password', e.target.value)}
                />
                <button type="button" onClick={() => setShowNew(v => !v)} style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex' }}>
                  {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div>
              <label className="label">Confirm New Password *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  required className="input"
                  style={{ paddingRight: '2.75rem' }}
                  placeholder="Repeat new password"
                  value={form.confirm_password}
                  onChange={e => set('confirm_password', e.target.value)}
                />
                <button type="button" onClick={() => setShowConfirm(v => !v)} style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex' }}>
                  {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {error && (
              <p style={{ color: 'var(--red)', fontSize: '0.845rem', background: 'var(--red-dim)', border: '1px solid rgba(255,82,82,0.2)', borderRadius: '8px', padding: '0.7rem 1rem' }}>
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%' }}>
              {loading ? 'Saving…' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}