import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, Eye, EyeOff, ArrowRight, ShoppingBag, TrendingUp, BarChart2 } from 'lucide-react'
import api from '../api/axios'
import useAuthStore from '../store/authStore'

const features = [
  { Icon: ShoppingBag, label: 'Point of Sale',  desc: 'Fast checkout for every transaction' },
  { Icon: TrendingUp,  label: 'Stock Control',  desc: 'Real-time inventory levels' },
  { Icon: BarChart2,   label: 'Sales Reports',  desc: 'Revenue insights at a glance' },
]

export default function Login() {
  const navigate  = useNavigate()
  const login     = useAuthStore(s => s.login)
  const [form,    setForm]    = useState({ email: '', password: '' })
  const [showPw,  setShowPw]  = useState(false)
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const { data: tokens } = await api.post('/auth/login/', form)
      const { data: user }   = await api.get('/users/me/', { headers: { Authorization: `Bearer ${tokens.access}` } })
      login(tokens, user); navigate('/')
    } catch {
      setError('Invalid email or password.')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'DM Sans', sans-serif", background: 'var(--bg)' }}>

      {/* Left navy panel */}
      <div style={{
        width: 420, flexShrink: 0,
        background: 'linear-gradient(170deg, var(--navy) 0%, var(--navy-2) 55%, #1a3a5c 100%)',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: '2.75rem 2.5rem', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -80, right: -80, width: 320, height: 320, borderRadius: '50%', background: 'rgba(59,167,255,0.07)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 240, height: 240, borderRadius: '50%', background: 'rgba(99,102,241,0.07)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '3.5rem' }}>
            <div style={{ width: 42, height: 42, borderRadius: '11px', background: 'linear-gradient(135deg, #3ba7ff, #1a6bdb)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px rgba(59,167,255,0.4)' }}>
              <Package size={21} color="#fff" strokeWidth={2.3} />
            </div>
            <div>
              <p style={{ color: '#fff', fontWeight: 800, fontSize: '1.125rem', fontFamily: "'Sora', sans-serif", letterSpacing: '-0.01em', lineHeight: 1.1 }}>StockUp</p>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.68rem', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '0.1rem' }}>Inventory Manager</p>
            </div>
          </div>

          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', fontFamily: "'Sora', sans-serif", letterSpacing: '-0.03em', lineHeight: 1.2, marginBottom: '0.875rem' }}>
            Run your shop<br />like a business.
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, maxWidth: 290 }}>
            Manage stock, record sales, and track your revenue — all in one place.
          </p>
        </div>

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {features.map(({ Icon, label, desc }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
              <div style={{ width: 38, height: 38, borderRadius: '9px', flexShrink: 0, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={17} color="rgba(255,255,255,0.7)" strokeWidth={1.8} />
              </div>
              <div>
                <p style={{ color: '#fff', fontSize: '0.845rem', fontWeight: 600, marginBottom: '0.1rem' }}>{label}</p>
                <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: '0.775rem' }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <p style={{ position: 'relative', zIndex: 1, fontSize: '0.67rem', color: 'rgba(255,255,255,0.18)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          © {new Date().getFullYear()} StockUp
        </p>
      </div>

      {/* Right form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <div style={{ marginBottom: '2.25rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)', fontFamily: "'Sora', sans-serif", letterSpacing: '-0.02em', marginBottom: '0.4rem' }}>Welcome back</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-3)' }}>Sign in to your account to continue.</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
            <div>
              <label className="label">Email address</label>
              <input type="email" required autoFocus className="input" placeholder="admin@yourshop.com"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>

            <div>
              <label className="label">Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPw ? 'text' : 'password'} required className="input" style={{ paddingRight: '2.75rem' }} placeholder="••••••••"
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                <button type="button" onClick={() => setShowPw(v => !v)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex' }}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ background: 'var(--red-light)', border: '1px solid #f8b4b4', borderRadius: '8px', padding: '0.7rem 0.875rem', fontSize: '0.845rem', color: 'var(--red)' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '0.75rem', fontSize: '0.9375rem', marginTop: '0.25rem' }}>
              {loading
                ? <><span className="spinner" style={{ width: 16, height: 16, borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} /> Signing in…</>
                : <><span>Sign In</span><ArrowRight size={16} /></>
              }
            </button>
          </form>

          <p style={{ marginTop: '2rem', fontSize: '0.75rem', color: 'var(--text-3)', textAlign: 'center' }}>
            Don't have an account? Contact your administrator.
          </p>
        </div>
      </div>
    </div>
  )
}