import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { TrendingUp, BarChart2, Download } from 'lucide-react'
import api from '../api/axios'
import { downloadCsv } from '../utils/exportCsv'

export default function Reports() {
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try {
      await downloadCsv('/api/reports/stock-value/export/', 'inventory_value.csv')
    } finally {
      setExporting(false)
    }
  }

  const { data: stockValue, isLoading: svLoading } = useQuery({
    queryKey: ['report-stock-value'],
    queryFn: () => api.get('/reports/stock-value/').then((r) => r.data),
  })

  const { data: salesSummary, isLoading: ssLoading } = useQuery({
    queryKey: ['report-sales', dateFrom, dateTo],
    queryFn: () => {
      const p = new URLSearchParams()
      if (dateFrom) p.append('date_from', dateFrom)
      if (dateTo) p.append('date_to', dateTo)
      return api.get(`/reports/sales-summary/?${p}`).then((r) => r.data)
    },
  })

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Reports</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Inventory Value */}
        <div className="card overflow-hidden flex flex-col">
          <div className="card-header">
            <div className="flex items-center gap-2.5">
              <TrendingUp size={16} className="text-emerald-500" />
              <span className="card-header-title">Inventory Value</span>
            </div>
            <div className="flex items-center gap-3">
              {stockValue && (
                <span className="font-bold text-emerald-700 text-base">
                  GH₵ {Number(stockValue.total_stock_value).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              )}
              <button onClick={handleExport} disabled={exporting || !stockValue} className="btn btn-ghost btn-sm">
                <Download size={13} /> {exporting ? 'Exporting…' : 'CSV'}
              </button>
            </div>
          </div>
          {svLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="overflow-y-auto flex-1" style={{ maxHeight: 380 }}>
              <table className="table">
                <thead>
                  <tr><th>Product</th><th>Stock</th><th>Cost Price</th><th>Total Value</th></tr>
                </thead>
                <tbody>
                  {stockValue?.products.map((p) => (
                    <tr key={p.id}>
                      <td className="font-medium text-slate-800">{p.name}</td>
                      <td className="text-slate-600">{p.stock_quantity}</td>
                      <td className="text-slate-500">GH₵ {p.cost_price}</td>
                      <td className="font-semibold text-slate-900">GH₵ {Number(p.stock_value).toFixed(2)}</td>
                    </tr>
                  ))}
                  {stockValue?.products.length === 0 && (
                    <tr><td colSpan={4} className="text-center py-8 text-slate-400 text-sm">No products.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Sales Summary */}
        <div className="card overflow-hidden flex flex-col">
          <div className="card-header">
            <div className="flex items-center gap-2.5">
              <BarChart2 size={16} className="text-blue-500" />
              <span className="card-header-title">Sales Summary</span>
            </div>
          </div>
          <div className="card-body flex flex-col flex-1" style={{ gap: '1.25rem' }}>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="label">From</label>
              <input type="date" className="input" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div className="flex-1">
              <label className="label">To</label>
              <input type="date" className="input" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
          </div>

          {ssLoading ? (
            <div className="flex items-center justify-center h-24">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : salesSummary ? (
            <div className="space-y-3 flex-1">
              <div className="rounded-xl p-4 flex items-center justify-between bg-slate-50 border border-slate-100">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Transactions</p>
                <p className="text-2xl font-bold text-slate-900">{salesSummary.total_transactions}</p>
              </div>
              <div className="rounded-xl p-4 flex items-center justify-between bg-emerald-50 border border-emerald-100">
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">Total Revenue</p>
                <p className="text-2xl font-bold text-emerald-700">
                  GH₵ {Number(salesSummary.total_revenue).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              {!dateFrom && !dateTo && (
                <p className="text-xs text-slate-400 text-center pt-1">Showing all-time totals. Use filters above to narrow by date range.</p>
              )}
            </div>
          ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
