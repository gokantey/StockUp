import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download, BarChart2, Package, TrendingUp, DollarSign, PieChart, Banknote } from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import api from '../api/axios'
import { downloadCsv } from '../utils/exportCsv'

function SummaryTip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border-2)', borderRadius: '10px', padding: '0.75rem 1rem', boxShadow: '0 8px 28px rgba(0,0,0,0.4)' }}>
      <p style={{ color: 'var(--text-3)', fontSize: '0.72rem', marginBottom: '0.35rem' }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color, fontWeight: 700, fontSize: '0.875rem', fontFamily: 'JetBrains Mono, monospace' }}>
          {p.name === 'revenue' || p.name === 'cogs' || p.name === 'profit' ? `GHS ${Number(p.value).toFixed(2)}` : `${p.value} sales`}
        </p>
      ))}
    </div>
  )
}

function ValueTip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  return (
    <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border-2)', borderRadius: '10px', padding: '0.75rem 1rem', boxShadow: '0 8px 28px rgba(0,0,0,0.4)' }}>
      <p style={{ color: 'var(--text-3)', fontSize: '0.72rem', marginBottom: '0.3rem' }}>{d?.name}</p>
      <p style={{ color: 'var(--blue)', fontWeight: 700, fontSize: '0.875rem', fontFamily: 'JetBrains Mono, monospace' }}>GHS {Number(d?.total_value).toFixed(2)}</p>
      <p style={{ color: 'var(--text-3)', fontSize: '0.72rem', marginTop: '0.2rem' }}>{d?.stock_quantity} units in stock</p>
    </div>
  )
}

export default function Reports() {
  const [activeTab, setActiveTab] = useState('sales') // 'sales' or 'pl'
  const [dateFrom, setDateFrom]   = useState('')
  const [dateTo, setDateTo]       = useState('')
  const [exporting, setExporting] = useState(false)

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['report-summary', dateFrom, dateTo],
    queryFn: () => {
      const p = new URLSearchParams()
      if (dateFrom) p.append('date_from', dateFrom)
      if (dateTo)   p.append('date_to',   dateTo)
      return api.get(`/reports/sales-summary/?${p}`).then(r => r.data)
    },
    enabled: activeTab === 'sales'
  })

  const { data: stockValue = [], isLoading: valueLoading } = useQuery({
    queryKey: ['report-stock-value'],
    queryFn: () => api.get('/reports/stock-value/').then(r => r.data),
    enabled: activeTab === 'sales'
  })

  const { data: plData, isLoading: plLoading } = useQuery({
    queryKey: ['report-pl', dateFrom, dateTo],
    queryFn: () => {
      const p = new URLSearchParams()
      if (dateFrom) p.append('date_from', dateFrom)
      if (dateTo)   p.append('date_to',   dateTo)
      return api.get(`/reports/profit-loss/?${p}`).then(r => r.data)
    },
    enabled: activeTab === 'pl'
  })

  const handleExport = async (type) => {
    setExporting(type)
    try {
      const p = new URLSearchParams()
      if (dateFrom) p.append('date_from', dateFrom)
      if (dateTo)   p.append('date_to',   dateTo)

      if (type === 'sales') {
        await downloadCsv(`/api/sales/export/?${p}`, `sales_${dateFrom || 'all'}.csv`)
      } else if (type === 'value') {
        await downloadCsv('/api/reports/stock-value/export/', 'inventory_value.csv')
      } else if (type === 'pl') {
        await downloadCsv(`/api/reports/profit-loss/export/?${p}`, `profit_loss_${dateFrom || 'all'}.csv`)
      }
    } finally {
      setExporting(false)
    }
  }

  // Calculate totals
  const totalInventoryValue = stockValue.reduce((sum, p) => sum + Number(p.total_value || 0), 0)
  const topByValue          = [...stockValue].sort((a, b) => Number(b.total_value) - Number(a.total_value)).slice(0, 8)

  const salesMetricCards = summary
    ? [
        { label: 'Total Revenue',   value: `GHS ${Number(summary.total_revenue  || 0).toFixed(2)}`,      color: 'var(--teal)',   Icon: TrendingUp },
        { label: 'Total Sales',     value: summary.total_sales      ?? 0,                                 color: 'var(--blue)',   Icon: BarChart2  },
        { label: 'Items Sold',      value: summary.total_items_sold ?? 0,                                 color: 'var(--purple)', Icon: Package    },
        { label: 'Avg Order Value', value: `GHS ${Number(summary.avg_sale_value || 0).toFixed(2)}`,      color: 'var(--amber)',  Icon: DollarSign },
      ]
    : []
  
  const plMetricCards = plData
    ? [
        { label: 'Total Revenue',  value: `GHS ${Number(plData.total_revenue || 0).toFixed(2)}`, color: 'var(--teal)',   Icon: TrendingUp },
        { label: 'COGS (Cost of Goods Sold)', value: `GHS ${Number(plData.total_cogs || 0).toFixed(2)}`,    color: 'var(--amber)',  Icon: Banknote },
        { label: 'Gross Profit',   value: `GHS ${Number(plData.gross_profit || 0).toFixed(2)}`,  color: 'var(--green)',  Icon: Banknote },
        { label: 'Gross Margin',   value: `${Number(plData.gross_margin_pct || 0).toFixed(1)}%`, color: 'var(--purple)', Icon: PieChart },
      ]
    : []

  const trendData = summary?.trend ?? []
  const plTrendData = plData?.trend ?? []
  
  // Custom styles for tabs
  const tabBtnStyle = (active) => ({
    padding: '0.625rem 1.25rem',
    fontSize: '0.85rem',
    fontWeight: 600,
    border: 'none',
    borderBottom: active ? '2px solid var(--blue)' : '2px solid transparent',
    background: 'transparent',
    color: active ? 'var(--blue)' : 'var(--text-3)',
    cursor: 'pointer',
    transition: 'all 0.2s',
  })

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">Sales performance and inventory analytics</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {activeTab === 'sales' ? (
            <>
              <button onClick={() => handleExport('sales')} disabled={!!exporting} className="btn btn-ghost btn-sm">
                <Download size={13} /> {exporting === 'sales' ? 'Exporting…' : 'Sales CSV'}
              </button>
              <button onClick={() => handleExport('value')} disabled={!!exporting} className="btn btn-ghost btn-sm">
                <Download size={13} /> {exporting === 'value' ? 'Exporting…' : 'Inventory CSV'}
              </button>
            </>
          ) : (
            <button onClick={() => handleExport('pl')} disabled={!!exporting} className="btn btn-ghost btn-sm">
              <Download size={13} /> {exporting === 'pl' ? 'Exporting…' : 'P&L CSV'}
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem' }}>
        <button style={tabBtnStyle(activeTab === 'sales')} onClick={() => setActiveTab('sales')}>Sales & Inventory</button>
        <button style={tabBtnStyle(activeTab === 'pl')} onClick={() => setActiveTab('pl')}>Profit & Loss</button>
      </div>

      {/* Date filter */}
      <div className="card" style={{ padding: '1.125rem 1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: '0.875rem' }}>
          <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', alignSelf: 'flex-end', paddingBottom: '0.55rem', marginRight: '0.25rem' }}>Filter</p>
          <div>
            <label className="label">From</label>
            <input type="date" className="input" style={{ width: 160 }} value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div>
            <label className="label">To</label>
            <input type="date" className="input" style={{ width: 160 }} value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
          {(dateFrom || dateTo) && (
            <button onClick={() => { setDateFrom(''); setDateTo('') }} className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-end' }}>
              Clear
            </button>
          )}
        </div>
      </div>

      {activeTab === 'sales' ? (
        <>
          {/* Summary metric cards */}
          {summaryLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', height: 80, alignItems: 'center' }}>
              <div className="spinner" />
            </div>
          ) : (
            <div className="grid grid-cols-2 xl:grid-cols-4" style={{ gap: '1rem', marginBottom: '1.5rem' }}>
              {salesMetricCards.map(({ label, value, color, Icon }) => (
                <div key={label} style={{ background: 'var(--bg-3)', borderRadius: 'var(--radius-xl)', border: `1px solid ${color}20`, padding: '1.375rem 1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
                    <p style={{ fontSize: '0.69rem', fontWeight: 700, color: color, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</p>
                    <div style={{ width: 30, height: 30, borderRadius: '7px', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={14} color={color} />
                    </div>
                  </div>
                  <p className="mono" style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: '1.25rem', marginBottom: '1.5rem' }}>

            {/* Revenue over time */}
            <div className="card" style={{ overflow: 'hidden' }}>
              <div className="card-header">
                <span className="card-header-title">Revenue Over Time</span>
              </div>
              <div style={{ padding: '1.5rem 1.25rem 1.25rem' }}>
                {summaryLoading ? (
                  <div style={{ height: 190, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="spinner" />
                  </div>
                ) : trendData.length === 0 ? (
                  <div style={{ height: 190, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)' }}>
                    <TrendingUp size={28} strokeWidth={1.3} />
                    <p style={{ fontSize: '0.845rem', marginTop: '0.75rem' }}>No data for this period</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={190}>
                    <AreaChart data={trendData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%"   stopColor="#00d4aa" stopOpacity={0.22} />
                          <stop offset="100%" stopColor="#00d4aa" stopOpacity={0}    />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
                      <YAxis
                        tick={{ fontSize: 10, fill: 'var(--text-3)' }}
                        axisLine={false} tickLine={false} width={60}
                        tickFormatter={v => `GHS${v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v}`}
                      />
                      <Tooltip content={<SummaryTip />} cursor={{ stroke: 'var(--border-2)', strokeWidth: 1.5 }} />
                      <Area
                        type="monotone" dataKey="revenue"
                        stroke="#00d4aa" strokeWidth={2}
                        fill="url(#revGrad)" dot={false}
                        activeDot={{ r: 4, fill: '#00d4aa', stroke: 'var(--bg-3)', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Top inventory value */}
            <div className="card" style={{ overflow: 'hidden' }}>
              <div className="card-header">
                <span className="card-header-title">Top Inventory Value</span>
                <span className="badge badge-blue mono" style={{ fontSize: '0.7rem' }}>
                  GHS {totalInventoryValue.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div style={{ padding: '1.5rem 1.25rem 1.25rem' }}>
                {valueLoading ? (
                  <div style={{ height: 190, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="spinner" />
                  </div>
                ) : topByValue.length === 0 ? (
                  <div style={{ height: 190, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)' }}>
                    <Package size={28} strokeWidth={1.3} />
                    <p style={{ fontSize: '0.845rem', marginTop: '0.75rem' }}>No inventory data</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={190}>
                    <BarChart data={topByValue} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="valGrad" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%"   stopColor="#3b8bff" />
                          <stop offset="100%" stopColor="#00d4aa" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                      <XAxis
                        type="number"
                        tick={{ fontSize: 10, fill: 'var(--text-3)' }}
                        axisLine={false} tickLine={false}
                        tickFormatter={v => `GHS${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`}
                      />
                      <YAxis
                        type="category" dataKey="name" width={90}
                        tick={{ fontSize: 10, fill: 'var(--text-2)' }}
                        axisLine={false} tickLine={false}
                        tickFormatter={v => v.length > 12 ? v.slice(0, 12) + '…' : v}
                      />
                      <Tooltip content={<ValueTip />} cursor={{ fill: 'var(--surface)' }} />
                      <Bar dataKey="total_value" fill="url(#valGrad)" radius={[0, 6, 6, 0]} maxBarSize={18} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Full inventory value table */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div className="card-header">
              <span className="card-header-title">Full Inventory Value</span>
              <span className="badge badge-teal mono">
                GHS {totalInventoryValue.toLocaleString('en', { minimumFractionDigits: 2 })}
              </span>
            </div>
            {valueLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 140 }}>
                <div className="spinner" />
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Product</th><th>SKU</th><th>Category</th>
                      <th>In Stock</th><th>Cost Price</th><th>Total Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockValue.map(p => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 600, color: 'var(--text)' }}>{p.name}</td>
                        <td>
                          <span className="mono" style={{ fontSize: '0.775rem', color: 'var(--text-3)' }}>{p.sku}</span>
                        </td>
                        <td>
                          {p.category_name
                            ? <span className="badge badge-blue">{p.category_name}</span>
                            : <span style={{ color: 'var(--text-3)', fontStyle: 'italic', fontSize: '0.78rem' }}>None</span>}
                        </td>
                        <td className="mono" style={{ color: p.stock_quantity === 0 ? 'var(--red)' : 'var(--text)' }}>
                          {p.stock_quantity}
                        </td>
                        <td className="mono" style={{ fontSize: '0.825rem' }}>
                          GHS {Number(p.cost_price).toFixed(2)}
                        </td>
                        <td className="mono" style={{ fontWeight: 700, color: 'var(--teal)' }}>
                          GHS {Number(p.total_value || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    {stockValue.length === 0 && (
                       <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-3)', fontSize: '0.875rem' }}>
                          No inventory data.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Profit & Loss Tab */}
          {plLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', height: 80, alignItems: 'center' }}>
              <div className="spinner" />
            </div>
          ) : (
            <>
              {/* P&L metric cards */}
              <div className="grid grid-cols-2 xl:grid-cols-4" style={{ gap: '1rem', marginBottom: '1.5rem' }}>
                {plMetricCards.map(({ label, value, color, Icon }) => (
                  <div key={label} style={{ background: 'var(--bg-3)', borderRadius: 'var(--radius-xl)', border: `1px solid ${color}20`, padding: '1.375rem 1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
                      <p style={{ fontSize: '0.69rem', fontWeight: 700, color: color, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</p>
                      <div style={{ width: 30, height: 30, borderRadius: '7px', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={14} color={color} />
                      </div>
                    </div>
                    <p className="mono" style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Profit Trend Chart */}
              <div className="card" style={{ overflow: 'hidden', marginBottom: '1.5rem' }}>
                <div className="card-header">
                  <span className="card-header-title">Profit Trend</span>
                </div>
                <div style={{ padding: '1.5rem 1.25rem 1.25rem' }}>
                  {plTrendData.length === 0 ? (
                    <div style={{ height: 250, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)' }}>
                      <TrendingUp size={28} strokeWidth={1.3} />
                      <p style={{ fontSize: '0.845rem', marginTop: '0.75rem' }}>No data for this period</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={250}>
                      <AreaChart data={plTrendData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%"   stopColor="var(--green)" stopOpacity={0.22} />
                            <stop offset="100%" stopColor="var(--green)" stopOpacity={0}    />
                          </linearGradient>
                          <linearGradient id="cogsGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%"   stopColor="var(--amber)" stopOpacity={0.22} />
                            <stop offset="100%" stopColor="var(--amber)" stopOpacity={0}    />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
                        <YAxis
                          tick={{ fontSize: 10, fill: 'var(--text-3)' }}
                          axisLine={false} tickLine={false} width={60}
                          tickFormatter={v => `GHS${v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v}`}
                        />
                        <Tooltip content={<SummaryTip />} cursor={{ stroke: 'var(--border-2)', strokeWidth: 1.5 }} />
                        <Area
                          type="monotone" dataKey="cogs" stackId="1"
                          stroke="var(--amber)" strokeWidth={2}
                          fill="url(#cogsGrad)" dot={false}
                          activeDot={{ r: 4, fill: 'var(--amber)', stroke: 'var(--bg-3)', strokeWidth: 2 }}
                        />
                        <Area
                          type="monotone" dataKey="profit" stackId="1"
                          stroke="var(--green)" strokeWidth={2}
                          fill="url(#profitGrad)" dot={false}
                          activeDot={{ r: 4, fill: 'var(--green)', stroke: 'var(--bg-3)', strokeWidth: 2 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Product Margin Table */}
              <div className="card" style={{ overflow: 'hidden' }}>
                <div className="card-header">
                  <span className="card-header-title">Product Margin Breakdown</span>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Product</th><th>Category</th>
                        <th>Units Sold</th><th>Revenue</th><th>COGS (Cost of Goods Sold)</th><th>Gross Profit</th><th>Margin %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {plData.by_product.map((p, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 600, color: 'var(--text)' }}>{p.product_name}</td>
                          <td>
                            {p.category !== '—'
                              ? <span className="badge badge-gray">{p.category}</span>
                              : <span style={{ color: 'var(--text-3)', fontStyle: 'italic', fontSize: '0.78rem' }}>None</span>}
                          </td>
                          <td className="mono">{p.units_sold}</td>
                          <td className="mono">GHS {Number(p.revenue).toFixed(2)}</td>
                          <td className="mono" style={{ color: 'var(--amber)' }}>GHS {Number(p.cogs).toFixed(2)}</td>
                          <td className="mono" style={{ fontWeight: 700, color: 'var(--green)' }}>GHS {Number(p.gross_profit).toFixed(2)}</td>
                          <td className="mono" style={{ color: p.margin_pct < 20 ? 'var(--red)' : p.margin_pct >= 40 ? 'var(--green)' : 'var(--text)' }}>
                            {Number(p.margin_pct).toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                      {plData.by_product.length === 0 && (
                        <tr>
                          <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-3)', fontSize: '0.875rem' }}>
                            No sales data for this period.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}