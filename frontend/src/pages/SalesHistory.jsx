import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Receipt, Download, Search, X } from 'lucide-react'
import api from '../api/axios'
import { downloadCsv } from '../utils/exportCsv'

export default function SalesHistory() {
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [search, setSearch] = useState('')
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try {
      const p = new URLSearchParams()
      if (dateFrom) p.append('date_from', dateFrom)
      if (dateTo) p.append('date_to', dateTo)
      await downloadCsv(`/api/sales/export/?${p}`, 'sales_export.csv')
    } finally {
      setExporting(false)
    }
  }

  const { data: sales = [], isLoading } = useQuery({
    queryKey: ['sales', dateFrom, dateTo],
    queryFn: () => {
      const p = new URLSearchParams()
      if (dateFrom) p.append('date_from', dateFrom)
      if (dateTo) p.append('date_to', dateTo)
      return api.get(`/sales/?${p}`).then((r) => r.data)
    },
  })

  const filtered = sales.filter((s) => {
    if (!search.trim()) return true
    const q = search.trim().toLowerCase()
    return (
      String(s.id).padStart(4, '0').includes(q) ||
      (s.created_by_name ?? '').toLowerCase().includes(q) ||
      (s.note ?? '').toLowerCase().includes(q) ||
      s.items.some((item) =>
        (item.product_name ?? '').toLowerCase().includes(q) ||
        (item.product_sku ?? '').toLowerCase().includes(q)
      )
    )
  })

  const totalRevenue = filtered.filter((s) => !s.is_voided).reduce((sum, s) => sum + Number(s.total), 0)

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Sales History</h1>
        <button onClick={handleExport} disabled={exporting || sales.length === 0} className="btn btn-ghost">
          <Download size={15} /> {exporting ? 'Exporting…' : 'Export CSV'}
        </button>
      </div>

      {/* Filter card */}
      <div className="card" style={{ padding: '1.5rem 2rem', marginBottom: '1.5rem' }}>
        <div className="flex flex-wrap items-end gap-4">
          {/* Search */}
          <div style={{ flex: '1 1 220px' }}>
            <label className="label">Search</label>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
              <input
                className="input" style={{ paddingLeft: '2.5rem', paddingRight: search ? '2.5rem' : '1rem' }}
                placeholder="Receipt #, product, SKU, staff, note…"
                value={search} onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button onClick={() => setSearch('')} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex' }}>
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Date range */}
          <div>
            <label className="label">From</label>
            <input type="date" className="input" style={{ width: 160 }} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div>
            <label className="label">To</label>
            <input type="date" className="input" style={{ width: 160 }} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>

          {(dateFrom || dateTo || search) && (
            <button onClick={() => { setDateFrom(''); setDateTo(''); setSearch('') }} className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-end' }}>
              Clear all
            </button>
          )}

          {filtered.length > 0 && (
            <div className="ml-auto text-right" style={{ alignSelf: 'flex-end' }}>
              <p className="text-xs text-slate-400 mb-0.5">{filtered.length} transaction{filtered.length > 1 ? 's' : ''}</p>
              <p className="text-lg font-bold text-slate-900">GH₵ {totalRevenue.toFixed(2)}</p>
            </div>
          )}
        </div>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center" style={{ height: 160 }}>
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr><th>Receipt #</th><th>Date & Time</th><th>Items</th><th>Total</th><th>Staff</th><th></th></tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} style={{ opacity: s.is_voided ? 0.55 : 1 }}>
                  <td className="font-mono text-slate-400 text-xs">
                    #{String(s.id).padStart(4, '0')}
                    {s.is_voided && <span className="badge badge-red" style={{ marginLeft: '0.5rem' }}>Voided</span>}
                  </td>
                  <td className="text-slate-700">{new Date(s.created_at).toLocaleString()}</td>
                  <td className="text-slate-500">{s.items.length} item{s.items.length > 1 ? 's' : ''}</td>
                  <td className="font-semibold" style={{ textDecoration: s.is_voided ? 'line-through' : 'none', color: s.is_voided ? '#94a3b8' : '#0f172a' }}>
                    GH₵ {Number(s.total).toFixed(2)}
                  </td>
                  <td className="text-slate-500">{s.created_by_name}</td>
                  <td><Link to={`/sales/${s.id}`} className="btn btn-ghost btn-sm"><Receipt size={13} /> Receipt</Link></td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center text-slate-400 text-sm" style={{ padding: '3rem' }}>
                  {search ? `No sales matching "${search}".` : 'No sales found.'}
                </td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
