import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Receipt, Download, Search, X, TrendingUp } from 'lucide-react'
import api from '../api/axios'
import { downloadCsv } from '../utils/exportCsv'
import Pagination from '../components/Pagination'

const PAGE_SIZE = 25

export default function SalesHistory() {
  const [dateFrom,  setDateFrom]  = useState('')
  const [dateTo,    setDateTo]    = useState('')
  const [search,    setSearch]    = useState('')
  const [voided,    setVoided]    = useState('')
  const [page,      setPage]      = useState(1)
  const [exporting, setExporting] = useState(false)

  const resetPage = useCallback(() => setPage(1), [])

  const buildParams = () => {
    const p = new URLSearchParams()
    p.set('page',      page)
    p.set('page_size', PAGE_SIZE)
    if (dateFrom) p.set('date_from', dateFrom)
    if (dateTo)   p.set('date_to',   dateTo)
    if (search)   p.set('search',    search)
    if (voided)   p.set('is_voided', voided)
    return p.toString()
  }

  const { data, isLoading } = useQuery({
    queryKey: ['sales', dateFrom, dateTo, search, voided, page],
    queryFn:  () => api.get(`/sales/?${buildParams()}`).then(r => r.data),
    keepPreviousData: true,
  })

  const sales      = data?.results    ?? []
  const totalPages = data?.total_pages ?? 1
  const totalCount = data?.count       ?? 0

  const handleExport = async () => {
    setExporting(true)
    try {
      const p = new URLSearchParams()
      if (dateFrom) p.append('date_from', dateFrom)
      if (dateTo)   p.append('date_to',   dateTo)
      await downloadCsv(`/api/sales/export/?${p}`, 'sales_export.csv')
    } finally { setExporting(false) }
  }

  const handleSearch   = (val) => { setSearch(val);   resetPage() }
  const handleDateFrom = (val) => { setDateFrom(val); resetPage() }
  const handleDateTo   = (val) => { setDateTo(val);   resetPage() }
  const handleVoided   = (val) => { setVoided(val);   resetPage() }
  const clearAll = () => { setDateFrom(''); setDateTo(''); setSearch(''); setVoided(''); resetPage() }
  const hasFilters = dateFrom || dateTo || search || voided

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Sales History</h1>
          <p className="page-subtitle">{totalCount} transaction{totalCount !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={handleExport} disabled={exporting || totalCount === 0} className="btn btn-ghost">
          <Download size={14} /> {exporting ? 'Exporting…' : 'Export CSV'}
        </button>
      </div>

      <div className="card" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: '0.875rem' }}>

          <div style={{ flex: '1 1 220px' }}>
            <label className="label">Search</label>
            <div style={{ position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }} />
              <input
                className="input"
                style={{ paddingLeft: '2.375rem', paddingRight: search ? '2.375rem' : '1rem' }}
                placeholder="Receipt #, product, staff…"
                value={search}
                onChange={e => handleSearch(e.target.value)}
              />
              {search && (
                <button onClick={() => handleSearch('')} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex' }}>
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="label">From</label>
            <input type="date" className="input" style={{ width: 158 }} value={dateFrom} onChange={e => handleDateFrom(e.target.value)} />
          </div>

          <div>
            <label className="label">To</label>
            <input type="date" className="input" style={{ width: 158 }} value={dateTo} onChange={e => handleDateTo(e.target.value)} />
          </div>

          <div>
            <label className="label">Status</label>
            <select className="input" style={{ width: 140 }} value={voided} onChange={e => handleVoided(e.target.value)}>
              <option value="">All</option>
              <option value="false">Completed</option>
              <option value="true">Voided</option>
            </select>
          </div>

          {hasFilters && (
            <button onClick={clearAll} className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-end' }}>
              Clear
            </button>
          )}

          {totalCount > 0 && (
            <div style={{ marginLeft: 'auto', textAlign: 'right', alignSelf: 'flex-end' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end', marginBottom: '0.15rem' }}>
                <TrendingUp size={12} style={{ color: 'var(--teal)' }} />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                  {totalCount} result{totalCount !== 1 ? 's' : ''}
                </span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>Page {page} of {totalPages}</p>
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 160 }}>
            <div className="spinner" />
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr><th>Receipt</th><th>Date & Time</th><th>Items</th><th>Total</th><th>Staff</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {sales.map(s => (
                <tr key={s.id} style={{ opacity: s.is_voided ? 0.5 : 1 }}>
                  <td><span className="mono" style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>#{String(s.id).padStart(4, '0')}</span></td>
                  <td style={{ fontSize: '0.845rem' }}>{new Date(s.created_at).toLocaleString()}</td>
                  <td>{s.items.length} item{s.items.length > 1 ? 's' : ''}</td>
                  <td className="mono" style={{ fontWeight: 700, color: s.is_voided ? 'var(--text-3)' : 'var(--text)', textDecoration: s.is_voided ? 'line-through' : 'none' }}>
                    GH₵ {Number(s.total).toFixed(2)}
                  </td>
                  <td>{s.created_by_name}</td>
                  <td>
                    {s.is_voided
                      ? <span className="badge badge-red">Voided</span>
                      : <span className="badge badge-teal">Complete</span>}
                  </td>
                  <td><Link to={`/sales/${s.id}`} className="btn btn-ghost btn-sm"><Receipt size={12} /> View</Link></td>
                </tr>
              ))}
              {sales.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-3)', fontSize: '0.875rem' }}>
                  {hasFilters ? 'No sales match your filters.' : 'No sales recorded yet.'}
                </td></tr>
              )}
            </tbody>
          </table>
        )}

        <Pagination page={page} totalPages={totalPages} count={totalCount} pageSize={PAGE_SIZE} onPage={setPage} />
      </div>
    </div>
  )
}