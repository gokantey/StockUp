import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Eye, EyeOff, User, Mail, Shield, CheckCircle,
  Lock, ShoppingCart, TrendingUp, Receipt, Clock,
  ArrowRight, Activity,
} from 'lucide-react'
import api from '../api/axios'
import useAuthStore from '../store/authStore'

function PasswordStrength({ password }) {
  if (!password) return null
  const checks = [
    { label: 'Min 8 chars', pass: password.length >= 8 },
    { label: 'Has number',  pass: /\d/.test(password) },
    { label: 'Has letter',  pass: /[a-zA-Z]/.test(password) },
  ]
  const score  = checks.filter(c => c.pass).length
  const colors = ['var(--red)', 'var(--amber)', 'var(--green)']
  const labels = ['Weak', 'Fair', 'Strong']
  return (
    <div style={{ marginTop: '0.625rem' }}>
      <div style={{ display: 'flex', gap: '3px', marginBottom: '0.45rem' }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: '2px', background: i < score ? colors[score-1] : 'var(--border-2)', transition: 'background 0.2s' }} />
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {checks.map(({ label, pass }) => (
            <span key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.275rem', fontSize: '0.7rem', color: pass ? 'var(--green)' : 'var(--text-3)', transition: 'color 0.2s' }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: pass ? 'var(--green)' : 'var(--border-2)', display: 'inline-block' }} />
              {label}
            </span>
          ))}
        </div>
        {score > 0 && <span style={{ fontSize: '0.7rem', fontWeight: 700, color: colors[score-1] }}>{labels[score-1]}</span>}
      </div>
    </div>
  )
}

function PwInput({ value, onChange, placeholder, show, onToggle }) {
  return (
    <div style={{ position: 'relative' }}>
      <input type={show ? 'text' : 'password'} required className="input"
        style={{ paddingRight: '2.75rem' }} placeholder={placeholder}
        value={value} onChange={onChange} />
      <button type="button" onClick={onToggle} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex' }}>
        {show ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  )
}

function StatTile({ label, value, Icon, color, bg }) {
  return (
    <div style={{ background: bg, border: `1px solid ${color}30`, borderRadius: '12px', padding: '1rem 1.125rem', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
      <div style={{ width: 38, height: 38, borderRadius: '10px', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={17} style={{ color }} />
      </div>
      <div>
        <p style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text)', fontFamily: "'Sora', sans-serif", lineHeight: 1 }}>{value}</p>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: '0.2rem', fontWeight: 500 }}>{label}</p>
      </div>
    </div>
  )
}

export default function Account() {
  const { user } = useAuthStore()
  const [form,        setForm]        = useState({ current_password: '', new_password: '', confirm_password: '' })
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew,     setShowNew]     = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error,       setError]       = useState('')
  const [success,     setSuccess]     = useState(false)
  const [loading,     setLoading]     = useState(false)

  const { data: stats } = useQuery({
    queryKey: ['me-stats'],
    queryFn:  () => api.get('/users/me/stats/').then(r => r.data),
    refetchInterval: 60000,
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setSuccess(false)
    if (form.new_password !== form.confirm_password) { setError('New passwords do not match.'); return }
    if (form.new_password.length < 8) { setError('Password must be at least 8 characters.'); return }
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
    } finally { setLoading(false) }
  }

  const initials   = user?.full_name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  const isAdmin    = user?.role === 'admin'
  const joinedDate = user?.date_joined
    ? new Date(user.date_joined).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Account</h1>
          <p className="page-subtitle">Your profile, activity and security settings</p>
        </div>
      </div>

      {/* Hero banner */}
      <div style={{
        background: 'linear-gradient(135deg, var(--navy) 0%, var(--navy-2) 60%, #1a3a5c 100%)',
        borderRadius: 'var(--radius-xl)', padding: '1.75rem 2rem',
        marginBottom: '1.25rem', position: 'relative', overflow: 'hidden',
        boxShadow: 'var(--shadow-md)',
      }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(59,167,255,0.08)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -30, right: 100, width: 130, height: 130, borderRadius: '50%', background: 'rgba(99,102,241,0.07)', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.375rem', position: 'relative', zIndex: 1 }}>
          <div style={{ width: 64, height: 64, borderRadius: '18px', flexShrink: 0, background: 'linear-gradient(135deg, #3ba7ff, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.25rem', fontWeight: 800, fontFamily: "'Sora', sans-serif", boxShadow: '0 8px 24px rgba(59,167,255,0.35)', border: '2px solid rgba(255,255,255,0.15)' }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
              <h2 style={{ color: '#fff', fontWeight: 800, fontSize: '1.1875rem', fontFamily: "'Sora', sans-serif", margin: 0 }}>{user?.full_name}</h2>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: isAdmin ? 'rgba(8,145,178,0.25)' : 'rgba(59,167,255,0.2)', border: `1px solid ${isAdmin ? 'rgba(8,145,178,0.4)' : 'rgba(59,167,255,0.35)'}`, borderRadius: '999px', padding: '0.18rem 0.65rem', fontSize: '0.68rem', fontWeight: 700, color: isAdmin ? '#67e8f9' : '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {isAdmin ? <Shield size={9} /> : <User size={9} />} {user?.role}
              </span>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.82rem', margin: 0 }}>{user?.email}</p>
            {joinedDate && <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.72rem', marginTop: '0.25rem' }}>Member since {joinedDate}</p>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.25)', borderRadius: '999px', padding: '0.3rem 0.875rem', flexShrink: 0 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#4ade80' }}>Online</span>
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: '1.25rem', alignItems: 'start' }}>

        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Activity stats */}
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: 28, height: 28, borderRadius: '7px', background: 'var(--blue-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Activity size={14} style={{ color: 'var(--blue)' }} />
                </div>
                <span className="card-header-title">My Activity</span>
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>All time</span>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-2" style={{ gap: '0.875rem', marginBottom: '0.875rem' }}>
                <StatTile label="Total Sales"   value={stats?.total_sales ?? '—'}  Icon={ShoppingCart} color="var(--blue)"   bg="var(--blue-light)"   />
                <StatTile label="Today's Sales" value={stats?.today_sales ?? '—'}  Icon={Clock}        color="var(--purple)" bg="var(--purple-light)" />
              </div>
              <div className="grid grid-cols-2" style={{ gap: '0.875rem' }}>
                <StatTile
                  label="Total Revenue"
                  value={stats ? `GH₵ ${Number(stats.total_revenue).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                  Icon={TrendingUp} color="var(--green)" bg="var(--green-light)"
                />
                <StatTile
                  label="Today's Revenue"
                  value={stats ? `GH₵ ${Number(stats.today_revenue).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                  Icon={TrendingUp} color="var(--amber)" bg="var(--amber-light)"
                />
              </div>
            </div>
          </div>

          {/* Recent sales */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: 28, height: 28, borderRadius: '7px', background: 'var(--purple-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Receipt size={14} style={{ color: 'var(--purple)' }} />
                </div>
                <span className="card-header-title">My Recent Sales</span>
              </div>
              <Link to="/sales" style={{ fontSize: '0.775rem', color: 'var(--blue)', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                View all <ArrowRight size={12} />
              </Link>
            </div>
            {!stats?.recent_sales?.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2.5rem', color: 'var(--text-3)' }}>
                <ShoppingCart size={26} strokeWidth={1.2} style={{ marginBottom: '0.625rem' }} />
                <p style={{ fontSize: '0.845rem' }}>No sales recorded yet</p>
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr><th>Receipt</th><th>Items</th><th>Total</th><th>Date</th></tr>
                </thead>
                <tbody>
                  {stats.recent_sales.map(s => (
                    <tr key={s.id}>
                      <td>
                        <Link to={`/sales/${s.id}`} style={{ textDecoration: 'none' }}>
                          <span className="mono" style={{ fontSize: '0.8rem', color: 'var(--blue)', fontWeight: 600, background: 'var(--blue-light)', padding: '0.15rem 0.5rem', borderRadius: '5px' }}>
                            #{String(s.id).padStart(4, '0')}
                          </span>
                        </Link>
                      </td>
                      <td style={{ color: 'var(--text-2)', fontSize: '0.845rem' }}>{s.items} item{s.items !== 1 ? 's' : ''}</td>
                      <td className="mono" style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.875rem' }}>GH₵ {Number(s.total).toFixed(2)}</td>
                      <td style={{ fontSize: '0.775rem', color: 'var(--text-3)' }}>
                        {new Date(s.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Profile info */}
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: 28, height: 28, borderRadius: '7px', background: 'var(--teal-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={14} style={{ color: 'var(--teal)' }} />
                </div>
                <span className="card-header-title">Profile Info</span>
              </div>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { Icon: User,   label: 'Full Name', value: user?.full_name },
                { Icon: Mail,   label: 'Email',     value: user?.email },
                { Icon: Shield, label: 'Role',      value: user?.role,      cap: true },
                { Icon: Clock,  label: 'Joined',    value: joinedDate },
              ].map(({ Icon, label, value, cap }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '0.75rem 0.875rem', background: 'var(--surface-2)', borderRadius: '10px', border: '1px solid var(--border)' }}>
                  <div style={{ width: 30, height: 30, borderRadius: '8px', background: 'var(--blue-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={13} style={{ color: 'var(--blue)' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.15rem' }}>{label}</p>
                    <p style={{ fontSize: '0.845rem', color: 'var(--text)', fontWeight: 500, textTransform: cap ? 'capitalize' : 'none' }}>{value || '—'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Change password */}
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: 28, height: 28, borderRadius: '7px', background: 'var(--amber-light)', border: '1px solid #f3d080', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Lock size={13} style={{ color: 'var(--amber)' }} />
                </div>
                <span className="card-header-title">Change Password</span>
              </div>
            </div>
            <div className="card-body">
              {success && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--green-light)', border: '1px solid #a0f0cf', borderLeft: '3px solid var(--green)', borderRadius: '10px', padding: '0.875rem 1rem', marginBottom: '1.125rem' }}>
                  <CheckCircle size={15} style={{ color: 'var(--green)', flexShrink: 0 }} />
                  <p style={{ fontSize: '0.845rem', color: 'var(--green)', fontWeight: 600 }}>Password updated successfully.</p>
                </div>
              )}
              <form onSubmit={handleSubmit} className="form-group">
                <div>
                  <label className="label">Current Password *</label>
                  <PwInput value={form.current_password} onChange={e => set('current_password', e.target.value)} placeholder="Your current password" show={showCurrent} onToggle={() => setShowCurrent(v => !v)} />
                </div>
                <div>
                  <label className="label">New Password *</label>
                  <PwInput value={form.new_password} onChange={e => set('new_password', e.target.value)} placeholder="Min 8 characters" show={showNew} onToggle={() => setShowNew(v => !v)} />
                  <PasswordStrength password={form.new_password} />
                </div>
                <div>
                  <label className="label">Confirm New Password *</label>
                  <PwInput value={form.confirm_password} onChange={e => set('confirm_password', e.target.value)} placeholder="Repeat new password" show={showConfirm} onToggle={() => setShowConfirm(v => !v)} />
                  {form.confirm_password && form.new_password && (
                    <p style={{ fontSize: '0.72rem', marginTop: '0.4rem', fontWeight: 600, color: form.new_password === form.confirm_password ? 'var(--green)' : 'var(--red)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: form.new_password === form.confirm_password ? 'var(--green)' : 'var(--red)', display: 'inline-block' }} />
                      {form.new_password === form.confirm_password ? 'Passwords match' : 'Passwords do not match'}
                    </p>
                  )}
                </div>
                {error && (
                  <p style={{ color: 'var(--red)', fontSize: '0.845rem', background: 'var(--red-light)', border: '1px solid #f8b4b4', borderRadius: '8px', padding: '0.7rem 0.875rem' }}>{error}</p>
                )}
                <button type="submit" disabled={loading || !form.current_password || !form.new_password || !form.confirm_password} className="btn btn-primary" style={{ width: '100%' }}>
                  {loading
                    ? <><span className="spinner" style={{ width: 15, height: 15, borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} /> Updating…</>
                    : <><Lock size={14} /> Update Password</>
                  }
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}