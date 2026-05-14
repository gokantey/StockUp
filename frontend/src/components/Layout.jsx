import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Package, ArrowUpCircle, ShoppingCart,
  ClipboardList, AlertTriangle, BarChart2, Truck, Users,
  LogOut, Eye, EyeOff, X, CheckCircle, UserCircle,
  ChevronRight, FileText, History
} from 'lucide-react'
import api from '../api/axios'
import useAuthStore from '../store/authStore'

const nav = [
  { to: '/',          label: 'Dashboard',     Icon: LayoutDashboard, end: true },
  { to: '/products',  label: 'Products',      Icon: Package },
  { to: '/stock-in',  label: 'Stock In',      Icon: ArrowUpCircle },
  { to: '/purchase-orders', label: 'Purchase Orders', Icon: FileText },
  { to: '/sales/new', label: 'New Sale',      Icon: ShoppingCart,   end: true },
  { to: '/sales',     label: 'Sales History', Icon: ClipboardList,  end: true },
  { to: '/end-of-day', label: 'End of Day',    Icon: CheckCircle },
  { to: '/low-stock', label: 'Low Stock',     Icon: AlertTriangle },
  { to: '/reports',   label: 'Reports',       Icon: BarChart2 },
  { to: '/suppliers', label: 'Suppliers',     Icon: Truck },
]

function initials(name = '') {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

function NavItem({ to, label, Icon, end }) {
  return (
    <NavLink to={to} end={end} style={({ isActive }) => ({
      display: 'flex', alignItems: 'center', gap: '0.75rem',
      padding: '0.625rem 0.875rem', borderRadius: '9px',
      fontSize: '0.845rem', fontWeight: isActive ? 600 : 400,
      textDecoration: 'none', transition: 'all 0.14s',
      color: isActive ? '#fff' : 'var(--navy-muted)',
      background: isActive ? 'var(--navy-active)' : 'transparent',
      borderLeft: `2px solid ${isActive ? '#3ba7ff' : 'transparent'}`,
    })}>
      {({ isActive }) => (
        <>
          <span style={{ flexShrink: 0, opacity: isActive ? 1 : 0.65 }}>
            <Icon size={16} strokeWidth={isActive ? 2.2 : 1.8} />
          </span>
          <span style={{ flex: 1 }}>{label}</span>
          {isActive && <ChevronRight size={11} style={{ opacity: 0.5 }} />}
        </>
      )}
    </NavLink>
  )
}

function ChangePasswordModal({ onClose }) {
  const [form,        setForm]        = useState({ current_password: '', new_password: '', confirm_password: '' })
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew,     setShowNew]     = useState(false)
  const [error,       setError]       = useState('')
  const [success,     setSuccess]     = useState(false)
  const [loading,     setLoading]     = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('')
    if (form.new_password !== form.confirm_password) { setError('New passwords do not match.'); return }
    if (form.new_password.length < 8) { setError('New password must be at least 8 characters.'); return }
    setLoading(true)
    try {
      await api.post('/users/me/change-password/', { current_password: form.current_password, new_password: form.new_password })
      setSuccess(true); setTimeout(onClose, 2000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong.')
    } finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.375rem' }}>
          <h3 className="modal-title" style={{ margin: 0 }}>Change My Password</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer' }}><X size={17} /></button>
        </div>
        {success ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--green-light)', border: '1px solid #a0f0cf', borderRadius: '10px', padding: '1rem 1.125rem' }}>
            <CheckCircle size={17} style={{ color: 'var(--green)', flexShrink: 0 }} />
            <p style={{ fontSize: '0.875rem', color: 'var(--green)', fontWeight: 600 }}>Password changed successfully.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="form-group">
            <div>
              <label className="label">Current Password *</label>
              <div style={{ position: 'relative' }}>
                <input autoFocus type={showCurrent ? 'text' : 'password'} required className="input" style={{ paddingRight: '2.5rem' }} placeholder="Your current password" value={form.current_password} onChange={e => set('current_password', e.target.value)} />
                <button type="button" onClick={() => setShowCurrent(v => !v)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex' }}>
                  {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div>
              <label className="label">New Password *</label>
              <div style={{ position: 'relative' }}>
                <input type={showNew ? 'text' : 'password'} required className="input" style={{ paddingRight: '2.5rem' }} placeholder="Min 8 characters" value={form.new_password} onChange={e => set('new_password', e.target.value)} />
                <button type="button" onClick={() => setShowNew(v => !v)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex' }}>
                  {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div>
              <label className="label">Confirm New Password *</label>
              <input type="password" required className="input" placeholder="Repeat new password" value={form.confirm_password} onChange={e => set('confirm_password', e.target.value)} />
            </div>
            {error && <p style={{ color: 'var(--red)', fontSize: '0.845rem', background: 'var(--red-light)', border: '1px solid #f8b4b4', borderRadius: '8px', padding: '0.7rem 0.875rem' }}>{error}</p>}
            <div style={{ display: 'flex', gap: '0.625rem', paddingTop: '0.25rem' }}>
              <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex: 1 }}>{loading ? 'Saving…' : 'Change Password'}</button>
              <button type="button" onClick={onClose} className="btn btn-ghost" style={{ flex: 1 }}>Cancel</button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default function Layout({ children }) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [showChangePw, setShowChangePw] = useState(false)
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>

      <aside style={{
        width: 256, minWidth: 256,
        background: 'linear-gradient(180deg, var(--navy) 0%, var(--navy-2) 50%, var(--navy-3) 100%)',
        borderRight: '1px solid rgba(255,255,255,0.05)',
        position: 'fixed', top: 0, left: 0, height: '100vh',
        display: 'flex', flexDirection: 'column', zIndex: 40,
        boxShadow: '4px 0 24px rgba(0,0,0,0.15)',
      }}>

        <div style={{ padding: '1.5rem 1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ width: 38, height: 38, borderRadius: '10px', flexShrink: 0, background: 'linear-gradient(135deg, #3ba7ff, #1a6bdb)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(59,167,255,0.4)' }}>
              <Package size={19} color="#fff" strokeWidth={2.3} />
            </div>
            <div>
              <p style={{ color: '#fff', fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.01em', lineHeight: 1.2, fontFamily: "'Sora', sans-serif" }}>R&J</p>
              <p style={{ color: 'var(--navy-muted)', fontSize: '0.67rem', marginTop: '0.1rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Inventory</p>
            </div>
          </div>

          <NavLink to="/account" style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: '0.7rem',
            background: isActive ? 'rgba(59,167,255,0.18)' : 'rgba(255,255,255,0.06)',
            border: `1px solid ${isActive ? 'rgba(59,167,255,0.35)' : 'rgba(255,255,255,0.09)'}`,
            borderRadius: '10px', padding: '0.7rem 0.875rem',
            textDecoration: 'none', transition: 'all 0.14s',
          })}>
            <div style={{ width: 32, height: 32, borderRadius: '8px', flexShrink: 0, background: 'linear-gradient(135deg, #3ba7ff, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.72rem', fontWeight: 700, boxShadow: '0 2px 8px rgba(99,102,241,0.3)' }}>
              {initials(user?.full_name)}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ color: '#fff', fontSize: '0.82rem', fontWeight: 600, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.full_name}</p>
              <p style={{ color: 'var(--navy-muted)', fontSize: '0.68rem', marginTop: '0.15rem', textTransform: 'capitalize' }}>{user?.role}</p>
            </div>
            <UserCircle size={13} style={{ color: 'rgba(255,255,255,0.25)', flexShrink: 0 }} />
          </NavLink>
        </div>

        <div style={{ margin: '0 1.25rem', borderTop: '1px solid var(--navy-border)' }} />

        <nav style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 0.875rem' }}>
          <p style={{ color: 'rgba(255,255,255,0.18)', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.625rem', paddingLeft: '0.875rem' }}>Main Menu</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
            {nav.map(item => <NavItem key={item.to} {...item} />)}
          </div>

          {user?.role === 'admin' && (
            <>
              <div style={{ margin: '1.25rem 0.375rem 1rem', borderTop: '1px solid var(--navy-border)' }} />
              <p style={{ color: 'rgba(255,255,255,0.18)', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.625rem', paddingLeft: '0.875rem' }}>Administration</p>
              <NavItem to="/users" label="Users" Icon={Users} />
              <NavItem to="/audit-logs" label="Audit Logs" Icon={History} />
            </>
          )}
        </nav>

        <div style={{ borderTop: '1px solid var(--navy-border)', padding: '0.875rem' }}>
          
          <button onClick={() => { logout(); navigate('/login') }} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: '0.575rem 0.875rem', borderRadius: '9px',
            fontSize: '0.82rem', fontWeight: 400, color: 'var(--navy-muted)',
            background: 'none', border: 'none', cursor: 'pointer', transition: 'all 0.14s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; e.currentTarget.style.color = '#fca5a5' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--navy-muted)' }}>
            <LogOut size={15} strokeWidth={1.8} /> Sign Out
          </button>
        </div>
      </aside>

      <div style={{ marginLeft: 256, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <header style={{
          height: 62, background: 'rgba(240,244,248,0.92)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          paddingLeft: '2rem', paddingRight: '2rem',
          position: 'sticky', top: 0, zIndex: 30,
          boxShadow: '0 1px 8px rgba(13,27,46,0.05)',
        }}>
          <p style={{ fontSize: '0.845rem', color: 'var(--text-3)' }}>
            {greeting},{' '}<span style={{ fontWeight: 700, color: 'var(--text)' }}>{user?.full_name?.split(' ')[0]}</span>
          </p>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '999px', padding: '0.32rem 0.875rem',
            fontSize: '0.76rem', fontWeight: 500, color: 'var(--text-3)',
            boxShadow: 'var(--shadow-sm)',
          }}>
            {new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        </header>

        <main style={{ flex: 1, padding: '2rem 2.25rem' }}>{children}</main>
      </div>

      {showChangePw && <ChangePasswordModal onClose={() => setShowChangePw(false)} />}
    </div>
  )
}