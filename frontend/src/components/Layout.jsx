import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Package, ArrowUpCircle, ShoppingCart,
  ClipboardList, AlertTriangle, BarChart2, Truck, Users, LogOut,
} from 'lucide-react'
import useAuthStore from '../store/authStore'

const nav = [
  { to: '/',             label: 'Dashboard',     Icon: LayoutDashboard, end: true },
  { to: '/products',     label: 'Products',      Icon: Package },
  { to: '/stock-in',     label: 'Stock In',      Icon: ArrowUpCircle },
  { to: '/sales/new',    label: 'New Sale',       Icon: ShoppingCart,   end: true },
  { to: '/sales',        label: 'Sales History',  Icon: ClipboardList,  end: true },
  { to: '/low-stock',    label: 'Low Stock',      Icon: AlertTriangle },
  { to: '/reports',      label: 'Reports',        Icon: BarChart2 },
  { to: '/suppliers',    label: 'Suppliers',      Icon: Truck },
]

function initials(name = '') {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
}

function NavItem({ to, label, Icon, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      style={({ isActive }) => ({
        display: 'flex', alignItems: 'center', gap: '0.875rem',
        padding: '0.8rem 1.25rem',
        borderRadius: '0.875rem',
        fontSize: '0.875rem', fontWeight: 500,
        textDecoration: 'none',
        transition: 'all 0.18s',
        position: 'relative', overflow: 'hidden',
        ...(isActive ? {
          background: 'rgba(59,130,246,0.22)',
          color: '#fff',
          fontWeight: 600,
          boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
          borderLeft: '3px solid #3b82f6',
          paddingLeft: '1.125rem',
        } : {
          color: 'rgba(255,255,255,0.5)',
          borderLeft: '3px solid transparent',
        }),
      })}
    >
      {({ isActive }) => (
        <>
          <span style={{ flexShrink: 0, opacity: isActive ? 1 : 0.5 }}>
            <Icon size={17} strokeWidth={isActive ? 2.2 : 1.8} />
          </span>
          {label}
        </>
      )}
    </NavLink>
  )
}

export default function Layout({ children }) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="flex min-h-screen">

      {/* ── Sidebar ─────────────────────────────── */}
      <aside
        style={{
          width: 272, minWidth: 272,
          background: 'linear-gradient(180deg, #0f2535 0%, #0d1f2d 60%, #0a1a26 100%)',
          borderRight: '1px solid rgba(255,255,255,0.04)',
        }}
        className="fixed top-0 left-0 h-screen flex flex-col z-40"
      >
        {/* Brand */}
        <div style={{ padding: '2rem 1.5rem 2rem' }}>
          <div className="flex items-center gap-3" style={{ marginBottom: '2.5rem' }}>
            <div style={{
              width: 42, height: 42, borderRadius: '0.875rem', flexShrink: 0,
              background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              boxShadow: '0 4px 16px rgba(59,130,246,0.45)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Package size={20} color="white" strokeWidth={2.4} />
            </div>
            <div>
              <p style={{ color: '#fff', fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.01em', lineHeight: 1.2 }}>StockUp</p>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.72rem', marginTop: '0.2rem', letterSpacing: '0.02em' }}>Inventory Manager</p>
            </div>
          </div>

          {/* User card */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.875rem',
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '1rem',
            padding: '0.875rem 1rem',
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: '0.75rem', flexShrink: 0,
              background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: '0.75rem', fontWeight: 700,
              boxShadow: '0 2px 8px rgba(59,130,246,0.3)',
            }}>
              {initials(user?.full_name)}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ color: '#fff', fontSize: '0.8375rem', fontWeight: 600, lineHeight: 1.25 }} className="truncate">{user?.full_name}</p>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.72rem', marginTop: '0.2rem', textTransform: 'capitalize' }}>{user?.role}</p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ margin: '0 1.5rem', borderTop: '1px solid rgba(255,255,255,0.07)' }} />

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto" style={{ padding: '1.75rem 0.875rem' }}>
          <p style={{
            color: 'rgba(255,255,255,0.2)', fontSize: '0.65rem', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.1em',
            marginBottom: '0.875rem', paddingLeft: '1.25rem',
          }}>
            Menu
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {nav.map((item) => <NavItem key={item.to} {...item} />)}
          </div>

          {user?.role === 'admin' && (
            <>
              <div style={{ margin: '1.75rem 0.375rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.07)' }} />
              <p style={{
                color: 'rgba(255,255,255,0.2)', fontSize: '0.65rem', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.1em',
                marginBottom: '0.875rem', paddingLeft: '1.25rem',
              }}>
                Admin
              </p>
              <NavItem to="/users" label="Users" Icon={Users} />
            </>
          )}
        </nav>

        {/* Logout */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '1.25rem 0.875rem 1.75rem' }}>
          <button
            onClick={() => { logout(); navigate('/login') }}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '0.875rem',
              padding: '0.8rem 1.25rem', borderRadius: '0.875rem',
              fontSize: '0.875rem', fontWeight: 500,
              color: 'rgba(255,255,255,0.35)',
              background: 'none', border: 'none', cursor: 'pointer',
              transition: 'all 0.18s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; e.currentTarget.style.color = 'rgba(252,165,165,0.9)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'rgba(255,255,255,0.35)' }}
          >
            <LogOut size={17} strokeWidth={1.8} />
            Logout
          </button>
        </div>
      </aside>

      {/* ── Main ──────────────────────────────────── */}
      <div style={{ marginLeft: 272 }} className="flex-1 flex flex-col min-h-screen">

        {/* Topbar */}
        <header style={{
          height: 68,
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(226,232,240,0.8)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          paddingLeft: '2.5rem', paddingRight: '2.5rem',
          position: 'sticky', top: 0, zIndex: 30,
          boxShadow: '0 1px 12px rgba(0,0,0,0.05)',
        }}>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
            {greeting},{' '}
            <span style={{ fontWeight: 700, color: '#0f172a' }}>{user?.full_name?.split(' ')[0]}</span>
          </p>

          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
            border: '1px solid #e2e8f0',
            borderRadius: '999px', padding: '0.4rem 1.125rem',
            fontSize: '0.78rem', fontWeight: 600, color: '#475569',
            boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
          }}>
            {new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: '2.75rem 3rem' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
