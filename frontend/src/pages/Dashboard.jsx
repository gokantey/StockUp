import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Package, AlertTriangle, TrendingUp, ShoppingCart, ArrowRight } from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import api from '../api/axios'

const cards = {
  blue:   { icon: '#2563eb', iconBg: '#eff6ff', border: '#bfdbfe', label: '#2563eb', value: '#1e3a5f' },
  amber:  { icon: '#d97706', iconBg: '#fffbeb', border: '#fde68a', label: '#b45309', value: '#3b2000' },
  green:  { icon: '#059669', iconBg: '#f0fdf4', border: '#a7f3d0', label: '#047857', value: '#052e16' },
  purple: { icon: '#7c3aed', iconBg: '#f5f3ff', border: '#ddd6fe', label: '#6d28d9', value: '#2e1065' },
}

function StatCard({ label, value, sub, Icon, color }) {
  const c = cards[color]
  return (
    <div
      style={{
        borderRadius: '1.25rem', padding: '1.375rem 1.5rem',
        background: '#fff',
        border: `1.5px solid ${c.border}`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'default',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.09)' }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)';    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <p style={{ fontSize: '0.72rem', fontWeight: 700, color: c.label, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
        <div style={{ width: 34, height: 34, borderRadius: '0.75rem', background: c.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={16} color={c.icon} strokeWidth={2} />
        </div>
      </div>
      <p style={{ fontSize: '1.5rem', fontWeight: 800, color: c.value, letterSpacing: '-0.02em', lineHeight: 1 }}>{value ?? '—'}</p>
      {sub && <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.4rem' }}>{sub}</p>}
    </div>
  )
}

const TREND_DAYS = [
  { label: '7D', days: 7 },
  { label: '14D', days: 14 },
  { label: '30D', days: 30 },
]

function RevenueTip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.875rem', padding: '0.875rem 1.125rem', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem', marginBottom: '0.35rem' }}>{label}</p>
      <p style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>GH₵ {payload[0].value.toLocaleString('en', { minimumFractionDigits: 2 })}</p>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem', marginTop: '0.2rem' }}>{payload[1]?.value ?? 0} transaction{payload[1]?.value !== 1 ? 's' : ''}</p>
    </div>
  )
}

function ProductTip({ active, payload }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.875rem', padding: '0.875rem 1.125rem', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem', marginBottom: '0.35rem' }}>{payload[0]?.payload?.name}</p>
      <p style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>{payload[0]?.value} units sold</p>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem', marginTop: '0.2rem' }}>GH₵ {payload[0]?.payload?.revenue?.toLocaleString('en', { minimumFractionDigits: 2 })}</p>
    </div>
  )
}

export default function Dashboard() {
  const [trendDays, setTrendDays] = useState(7)

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/dashboard/').then((r) => r.data),
    refetchInterval: 30000,
  })

  const { data: trend = [] } = useQuery({
    queryKey: ['sales-trend', trendDays],
    queryFn: () => api.get(`/dashboard/sales-trend/?days=${trendDays}`).then((r) => r.data),
    refetchInterval: 60000,
  })

  const { data: topProducts = [] } = useQuery({
    queryKey: ['top-products'],
    queryFn: () => api.get('/dashboard/top-products/').then((r) => r.data),
    refetchInterval: 60000,
  })

  if (isLoading) return (
    <div className="flex items-center justify-center h-40">
      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const maxRevenue = Math.max(...trend.map((t) => t.revenue), 1)

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginTop: '0.3rem' }}>Here's what's happening in your shop today.</p>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4" style={{ gap: '1.5rem', marginBottom: '2rem' }}>
        <StatCard label="Total Products"  value={data.total_products} sub="active items in inventory" Icon={Package} color="blue" />
        <StatCard label="Low Stock Items" value={data.low_stock_count} sub={data.low_stock_count > 0 ? 'need restocking soon' : 'all levels healthy'} Icon={AlertTriangle} color="amber" />
        <StatCard label="Stock Value"     value={`GH₵ ${Number(data.total_stock_value).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} sub="total at cost price" Icon={TrendingUp} color="green" />
        <StatCard label="Today's Revenue" value={`GH₵ ${Number(data.today_revenue).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} sub={`${data.today_sales_count} transaction${data.today_sales_count !== 1 ? 's' : ''} today`} Icon={ShoppingCart} color="purple" />
      </div>

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5" style={{ gap: '1.5rem', marginBottom: '2rem' }}>

        {/* Revenue trend – wider */}
        <div className="card lg:col-span-3 overflow-hidden">
          <div className="card-header">
            <div>
              <span className="card-header-title">Revenue Trend</span>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>Daily sales over the selected period</p>
            </div>
            <div style={{ display: 'flex', gap: '0.375rem' }}>
              {TREND_DAYS.map(({ label, days }) => (
                <button
                  key={days}
                  onClick={() => setTrendDays(days)}
                  style={{
                    padding: '0.35rem 0.875rem', borderRadius: '999px',
                    fontSize: '0.75rem', fontWeight: 600, border: 'none', cursor: 'pointer',
                    transition: 'all 0.15s',
                    background: trendDays === days ? 'linear-gradient(135deg,#3b82f6,#1d4ed8)' : '#f1f5f9',
                    color: trendDays === days ? '#fff' : '#64748b',
                    boxShadow: trendDays === days ? '0 2px 8px rgba(59,130,246,0.3)' : 'none',
                  }}
                >{label}</button>
              ))}
            </div>
          </div>
          <div style={{ padding: '1.75rem 1.75rem 1.25rem' }}>
            {trend.every((t) => t.revenue === 0) ? (
              <div style={{ height: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1' }}>
                <TrendingUp size={32} strokeWidth={1.2} />
                <p style={{ fontSize: '0.875rem', marginTop: '0.75rem' }}>No sales in this period yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={trend} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                    tickFormatter={(v) => `GH₵${v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v}`}
                    width={60}
                  />
                  <Tooltip content={<RevenueTip />} cursor={{ stroke: '#e2e8f0', strokeWidth: 1.5 }} />
                  <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2.5} fill="url(#revenueGrad)" dot={false} activeDot={{ r: 5, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} />
                  <Area type="monotone" dataKey="transactions" stroke="transparent" fill="transparent" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Top products – narrower */}
        <div className="card lg:col-span-2 overflow-hidden">
          <div className="card-header">
            <div>
              <span className="card-header-title">Top Products</span>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>Best sellers by units sold</p>
            </div>
          </div>
          <div style={{ padding: '1.75rem 1.75rem 1.25rem' }}>
            {topProducts.length === 0 ? (
              <div style={{ height: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1' }}>
                <ShoppingCart size={32} strokeWidth={1.2} />
                <p style={{ fontSize: '0.875rem', marginTop: '0.75rem' }}>No sales recorded yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={topProducts} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis
                    type="category" dataKey="name" width={90}
                    tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false}
                    tickFormatter={(v) => v.length > 12 ? v.slice(0, 12) + '…' : v}
                  />
                  <Tooltip content={<ProductTip />} cursor={{ fill: 'rgba(59,130,246,0.05)' }} />
                  <Bar dataKey="units_sold" fill="url(#barGrad)" radius={[0, 6, 6, 0]} maxBarSize={22} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ── Alert banner ── */}
      {data.low_stock_count > 0 ? (
        <div className="card flex items-center justify-between" style={{ padding: '1rem 1.75rem', borderLeft: '3px solid #f59e0b' }}>
          <div className="flex items-center gap-3">
            <div style={{ width: 36, height: 36, borderRadius: '0.75rem', flexShrink: 0, background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={16} style={{ color: '#d97706' }} />
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a' }}>
                {data.low_stock_count} item{data.low_stock_count > 1 ? 's are' : ' is'} running low on stock
              </p>
              <p style={{ fontSize: '0.775rem', color: '#94a3b8', marginTop: '0.15rem' }}>Review and restock before you run out.</p>
            </div>
          </div>
          <Link to="/low-stock" className="btn btn-ghost btn-sm no-print" style={{ flexShrink: 0 }}>
            View all <ArrowRight size={13} />
          </Link>
        </div>
      ) : (
        <div className="card flex items-center gap-3" style={{ padding: '1rem 1.75rem', borderLeft: '3px solid #10b981' }}>
          <div style={{ width: 36, height: 36, borderRadius: '0.75rem', flexShrink: 0, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Package size={16} style={{ color: '#059669' }} />
          </div>
          <div>
            <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a' }}>All stock levels are healthy</p>
            <p style={{ fontSize: '0.775rem', color: '#94a3b8', marginTop: '0.15rem' }}>Nothing needs restocking right now.</p>
          </div>
        </div>
      )}
    </div>
  )
}
