import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ShieldOff, ArrowLeft } from 'lucide-react'
import api from '../api/axios'
import useAuthStore from '../store/authStore'

function AccessDenied() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#eef2f7' }}>
      <div className="text-center" style={{ maxWidth: 420, padding: '2rem' }}>
        {/* Animated icon */}
        <div className="flex items-center justify-center mb-6">
          <div
            style={{
              width: 96, height: 96, borderRadius: '1.75rem',
              background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
              boxShadow: '0 12px 40px rgba(239,68,68,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite',
            }}
          >
            <ShieldOff size={44} color="white" strokeWidth={1.6} />
          </div>
        </div>

        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>
          Access Restricted
        </h1>
        <p style={{ fontSize: '0.9375rem', color: '#64748b', lineHeight: 1.6, marginBottom: '2rem' }}>
          This area is for <span style={{ fontWeight: 700, color: '#dc2626' }}>administrators only</span>.
          You don't have the required permissions to view this page.
        </p>

        <button
          onClick={() => navigate('/')}
          className="btn btn-primary"
          style={{ padding: '0.75rem 2rem', fontSize: '0.9375rem' }}
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
      </div>
    </div>
  )
}

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { isAuthenticated, user, setUser, logout } = useAuthStore()
  const [loading, setLoading] = useState(isAuthenticated && !user)

  useEffect(() => {
    if (isAuthenticated && !user) {
      api.get('/users/me/')
        .then((r) => { setUser(r.data); setLoading(false) })
        .catch(() => { logout(); setLoading(false) })
    }
  }, [isAuthenticated, user, setUser, logout])

  if (!isAuthenticated) return <Navigate to="/login" replace />

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (adminOnly && user?.role !== 'admin') return <AccessDenied />

  return children
}
