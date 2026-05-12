import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Package, AlertTriangle, TrendingUp, ShoppingCart, ArrowRight, PlusCircle, ClipboardList, ArrowUpCircle, BarChart2 } from 'lucide-react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import api from '../api/axios'

function StatCard({ label, value, sub, Icon, colorClass }) {
  return (
    <div className={`stat-card ${colorClass}`}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem', position: 'relative', zIndex: 1 }}>
        <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-3)' }}>{label}</p>
        <div style={{ width: 36, height: 36, borderRadius: '9px', background: 'var(--stat-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={17} style={{ color: 'var(--stat-color)' }} strokeWidth={2} />
        </div>
      </div>
      <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em', lineHeight: 1, fontFamily: "'Outfit', sans-serif", position: 'relative', zIndex: 1 }}>{value ?? '—'}</p>
      {sub && <p style={{ fontSize: '0.74rem', color: 'var(--text-3)', marginTop: '0.4rem', position: 'relative', zIndex: 1 }}>{sub}</p>}
    </div>
  )
}

const quickActions = [
  { to: '/sales/new',  label: 'New Sale',   Icon: PlusCircle,    color: '#1a6bdb' },
  { to: '/stock-in',   label: 'Stock In',   Icon: ArrowUpCircle, color: '#0d9a6a' },
  { to: '/sales',      label: 'Sales Log',  Icon: ClipboardList, color: '#6d3fc5' },
  { to: '/reports',    label: 'Reports',    Icon: BarChart2,     color: '#0891b2' },
]

const DAYS = [{ label: '7D', days: 7 }, { label: '14D', days: 14 }, { label: '30D', days: 30 }]

function RevTip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--navy)', borderRadius: '10px', padding: '0.75rem 1rem', boxShadow: 'var(--shadow-lg)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.7rem', marginBottom: '0.3rem' }}>{label}</p>
      <p style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem', fontFamily: "'JetBrains Mono', monospace" }}>GHS {payload[0].value.toLocaleString('en', { minimumFractionDigits: 2 })}</p>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', marginTop: '0.15rem' }}>{payload[1]?.value ?? 0} sale{payload[1]?.value !== 1 ? 's' : ''}</p>
    </div>
  )
}

function ProdTip({ active, payload }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--navy)', borderRadius: '10px', padding: '0.75rem 1rem', boxShadow: 'var(--shadow-lg)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.7rem', marginBottom: '0.3rem' }}>{payload[0]?.payload?.name}</p>
      <p style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>{payload[0]?.value} units</p>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', marginTop: '0.15rem' }}>GHS {payload[0]?.payload?.revenue?.toLocaleString('en', { minimumFractionDigits: 2 })}</p>
    </div>
  )
}

export default function Dashboard() {
  const [days, setDays] = useState(7)

  const { data, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: () => api.get('/dashboard/').then(r => r.data), refetchInterval: 30000 })
  const { data: trend = [] } = useQuery({ queryKey: ['sales-trend', days], queryFn: () => api.get(`/dashboard/sales-trend/?days=${days}`).then(r => r.data), refetchInterval: 60000 })
  const { data: topProducts = [] } = useQuery({ queryKey: ['top-products'], queryFn: () => api.get('/dashboard/top-products/').then(r => r.data), refetchInterval: 60000 })

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
      <div className="spinner" style={{ width: 28, height: 28 }} />
    </div>
  )

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Here's your shop overview for today</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--green-light)', border: '1px solid #a0f0cf', borderRadius: '999px', padding: '0.3rem 0.875rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--green)' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />
          Live
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4" style={{ gap: '1.125rem', marginBottom: '1.5rem' }}>
        <StatCard label="Total Products"  value={data.total_products}  sub="active in inventory"    Icon={Package}      colorClass="stat-blue"   />
        <StatCard label="Low Stock"       value={data.low_stock_count} sub={data.low_stock_count > 0 ? 'need restocking' : 'all healthy'} Icon={AlertTriangle} colorClass="stat-amber"  />
        <StatCard label="Inventory Value" value={`GHS ${Number(data.total_stock_value).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} sub="at cost price" Icon={TrendingUp} colorClass="stat-green" />
        <StatCard label="Today's Revenue" value={`GHS ${Number(data.today_revenue).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} sub={`${data.today_sales_count} transaction${data.today_sales_count !== 1 ? 's' : ''}`} Icon={ShoppingCart} colorClass="stat-purple" />
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <p className="section-title">Quick Actions</p>
        <div className="grid grid-cols-2 sm:grid-cols-4" style={{ gap: '0.875rem' }}>
          {quickActions.map(({ to, label, Icon, color }) => (
            <Link key={to} to={to} className="action-tile">
              <div className="action-tile-icon" style={{ background: `${color}18`, color }}>
                <Icon size={20} strokeWidth={1.8} />
              </div>
              <span className="action-tile-label">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5" style={{ gap: '1.125rem', marginBottom: '1.5rem' }}>
        <div className="card lg:col-span-3" style={{ overflow: 'hidden' }}>
          <div className="card-header">
            <div>
              <span className="card-header-title">Revenue Trend</span>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-3)', marginTop: '0.15rem' }}>Daily sales over selected period</p>
            </div>
            <div style={{ display: 'flex', gap: '0.25rem', background: '#f1f5f9', borderRadius: '999px', padding: '3px' }}>
              {DAYS.map(({ label, days: d }) => (
                <button key={d} onClick={() => setDays(d)} style={{
                  padding: '0.28rem 0.75rem', borderRadius: '999px', fontSize: '0.74rem', fontWeight: 600,
                  border: 'none', cursor: 'pointer', transition: 'all 0.13s',
                  background: days === d ? 'var(--blue)' : 'transparent',
                  color: days === d ? '#fff' : 'var(--text-3)',
                  boxShadow: days === d ? '0 2px 8px rgba(26,107,219,0.28)' : 'none',
                }}>{label}</button>
              ))}
            </div>
          </div>
          <div style={{ padding: '1.5rem 1.375rem 1.125rem' }}>
            {trend.every(t => t.revenue === 0) ? (
              <div style={{ height: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)' }}>
                <TrendingUp size={28} strokeWidth={1.2} />
                <p style={{ fontSize: '0.845rem', marginTop: '0.625rem' }}>No sales in this period</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={trend} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1a6bdb" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#1a6bdb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-3)', fontFamily: 'DM Sans' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-3)', fontFamily: 'DM Sans' }} axisLine={false} tickLine={false} tickFormatter={v => `GHS${v >= 1000 ? (v/1000).toFixed(1)+'k' : v}`} width={60} />
                  <Tooltip content={<RevTip />} cursor={{ stroke: '#e2e8f2', strokeWidth: 1.5 }} />
                  <Area type="monotone" dataKey="revenue" stroke="var(--blue)" strokeWidth={2.2} fill="url(#revGrad)" dot={false} activeDot={{ r: 4, fill: 'var(--blue)', strokeWidth: 2, stroke: '#fff' }} />
                  <Area type="monotone" dataKey="transactions" stroke="transparent" fill="transparent" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="card lg:col-span-2" style={{ overflow: 'hidden' }}>
          <div className="card-header">
            <div>
              <span className="card-header-title">Top Products</span>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-3)', marginTop: '0.15rem' }}>Best sellers by units</p>
            </div>
          </div>
          <div style={{ padding: '1.5rem 1.375rem 1.125rem' }}>
            {topProducts.length === 0 ? (
              <div style={{ height: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)' }}>
                <ShoppingCart size={28} strokeWidth={1.2} />
                <p style={{ fontSize: '0.845rem', marginTop: '0.625rem' }}>No sales recorded yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={topProducts} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="var(--purple)" />
                      <stop offset="100%" stopColor="var(--blue)" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={86} tick={{ fontSize: 11, fill: 'var(--text-2)' }} axisLine={false} tickLine={false} tickFormatter={v => v.length > 11 ? v.slice(0, 11)+'…' : v} />
                  <Tooltip content={<ProdTip />} cursor={{ fill: 'rgba(26,107,219,0.05)' }} />
                  <Bar dataKey="units_sold" fill="url(#barGrad)" radius={[0, 6, 6, 0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {data.low_stock_count > 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--amber-light)', border: '1px solid #f3d080', borderLeft: '3px solid var(--amber)', borderRadius: 'var(--radius)', padding: '0.875rem 1.375rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 32, height: 32, borderRadius: '8px', flexShrink: 0, background: '#fde68a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={15} style={{ color: 'var(--amber)' }} />
            </div>
            <div>
              <p style={{ fontSize: '0.845rem', fontWeight: 700, color: 'var(--text)' }}>{data.low_stock_count} item{data.low_stock_count > 1 ? 's' : ''} running low on stock</p>
              <p style={{ fontSize: '0.755rem', color: 'var(--text-3)', marginTop: '0.1rem' }}>Restock before you run out.</p>
            </div>
          </div>
          <Link to="/low-stock" className="btn btn-ghost btn-sm no-print">View <ArrowRight size={13} /></Link>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--green-light)', border: '1px solid #a0f0cf', borderLeft: '3px solid var(--green)', borderRadius: 'var(--radius)', padding: '0.875rem 1.375rem' }}>
          <div style={{ width: 32, height: 32, borderRadius: '8px', flexShrink: 0, background: '#bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Package size={15} style={{ color: 'var(--green)' }} />
          </div>
          <div>
            <p style={{ fontSize: '0.845rem', fontWeight: 700, color: 'var(--text)' }}>All stock levels are healthy</p>
            <p style={{ fontSize: '0.755rem', color: 'var(--text-3)', marginTop: '0.1rem' }}>Nothing needs restocking right now.</p>
          </div>
        </div>
      )}
    </div>
  )
}