import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, Mail, Lock, Eye, EyeOff, ArrowRight, ShoppingBag, TrendingUp, BarChart2 } from 'lucide-react'
import api from '../api/axios'
import useAuthStore from '../store/authStore'

const features = [
  { Icon: ShoppingBag, title: 'Sales Tracking',    desc: 'Record every transaction instantly' },
  { Icon: TrendingUp,  title: 'Live Inventory',    desc: 'Real-time stock levels at a glance' },
  { Icon: BarChart2,   title: 'Smart Reports',     desc: 'Revenue and stock value insights' },
]

export default function Login() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data: tokens } = await api.post('/auth/login/', form)
      const { data: user } = await api.get('/users/me/', {
        headers: { Authorization: `Bearer ${tokens.access}` },
      })
      login(tokens, user)
      navigate('/')
    } catch {
      setError('Invalid email or password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Left panel ───────────────────────────── */}
      <div
        style={{
          flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: '3rem 4rem',
          background: 'linear-gradient(160deg, #0f2535 0%, #1a3c52 50%, #0f2d45 100%)',
          position: 'relative', overflow: 'hidden',
        }}
        className="hidden lg:flex"
      >
        {/* Decorative circles */}
        <div style={{
          position: 'absolute', top: -80, right: -80, width: 320, height: 320,
          borderRadius: '50%', background: 'rgba(59,130,246,0.08)',
        }} />
        <div style={{
          position: 'absolute', bottom: -60, left: -60, width: 240, height: 240,
          borderRadius: '50%', background: 'rgba(99,102,241,0.08)',
        }} />
        <div style={{
          position: 'absolute', top: '40%', right: '10%', width: 140, height: 140,
          borderRadius: '50%', background: 'rgba(16,185,129,0.06)',
        }} />

        {/* Brand */}
        <div style={{ position: 'relative', zIndex: 1, marginBottom: '4rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 60, height: 60, borderRadius: '1.25rem',
            background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
            boxShadow: '0 8px 32px rgba(59,130,246,0.4)',
            marginBottom: '1.5rem',
          }}>
            <Package size={28} color="white" strokeWidth={2.2} />
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: '0.75rem' }}>
            Welcome to<br />StockUp
          </h1>
          <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, maxWidth: 320 }}>
            Your all-in-one inventory management system for your provision shop.
          </p>
        </div>

        {/* Feature list */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {features.map(({ Icon, title, desc }) => (
            <div key={title} style={{ display: 'flex', alignItems: 'center', gap: '1.125rem' }}>
              <div style={{
                width: 44, height: 44, borderRadius: '0.875rem', flexShrink: 0,
                background: 'rgba(255,255,255,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={20} color="rgba(255,255,255,0.75)" strokeWidth={1.7} />
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#fff', marginBottom: '0.2rem' }}>{title}</p>
                <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)' }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom tagline */}
        <p style={{ position: 'absolute', bottom: '2rem', left: '4rem', fontSize: '0.72rem', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          StockUp · Inventory Manager
        </p>
      </div>

      {/* ── Right panel (form) ────────────────────── */}
      <div style={{
        width: '100%', maxWidth: 480,
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '3rem 3.5rem',
        background: '#f8fafc',
      }}>
        {/* Mobile brand */}
        <div className="lg:hidden" style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 52, height: 52, borderRadius: '1rem',
            background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
            marginBottom: '0.875rem',
          }}>
            <Package size={24} color="white" strokeWidth={2.2} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>StockUp</h1>
        </div>

        <div style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.625rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
            Sign in
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#64748b' }}>Enter your credentials to access your dashboard.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Email */}
          <div>
            <label className="label">Email address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
              <input
                type="email" required autoFocus
                className="input"
                style={{ paddingLeft: '2.75rem' }}
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
              <input
                type={showPassword ? 'text' : 'password'} required
                className="input"
                style={{ paddingLeft: '2.75rem', paddingRight: '2.75rem' }}
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca',
              borderRadius: '0.625rem', padding: '0.875rem 1rem',
              fontSize: '0.875rem', color: '#dc2626',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}>
              <span style={{ fontSize: '1rem' }}>⚠️</span> {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{
              width: '100%', padding: '0.85rem',
              fontSize: '0.9375rem', fontWeight: 600,
              background: loading ? '#93c5fd' : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              boxShadow: loading ? 'none' : '0 4px 16px rgba(59,130,246,0.35)',
              transition: 'all 0.2s', marginTop: '0.25rem',
            }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                Signing in…
              </span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                Sign In <ArrowRight size={16} />
              </span>
            )}
          </button>
        </form>

        <p style={{ marginTop: '2.5rem', fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center' }}>
          StockUp Inventory Manager · All rights reserved
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
