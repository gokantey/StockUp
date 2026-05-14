import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Package, 
  Printer,
  ChevronLeft,
  ChevronRight,
  Download
} from 'lucide-react'
import api from '../api/axios'

export default function EndOfDay() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  const { data, isLoading } = useQuery({
    queryKey: ['end-of-day', date],
    queryFn: () => api.get(`/reports/end-of-day/?date=${date}`).then(r => r.data)
  })

  const handlePrint = () => window.print()

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
      <div className="spinner" />
    </div>
  )

  const { summary, top_products, inventory } = data || {}

  return (
    <div className="eod-container">
      {/* Header */}
      <div className="page-header no-print">
        <div>
          <h1 className="page-title">End of Day Summary</h1>
          <p className="page-subtitle">Daily performance snapshot and reconciliation</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.625rem', 
            background: 'var(--surface)', 
            border: '1px solid var(--border)', 
            borderRadius: '10px', 
            padding: '0.25rem 0.75rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <Calendar size={15} style={{ color: 'var(--text-3)' }} />
            <input 
              type="date" 
              style={{ 
                border: 'none', 
                outline: 'none', 
                fontSize: '0.845rem', 
                background: 'transparent',
                fontFamily: 'inherit',
                color: 'var(--text)',
                padding: '0.35rem 0'
              }} 
              value={date} 
              onChange={e => setDate(e.target.value)}
            />
          </div>
          <button className="btn btn-ghost" onClick={handlePrint}>
            <Printer size={16} /> Print Report
          </button>
        </div>
      </div>

      {/* Report Content */}
      <div id="printable-report">
        {/* Print Header (Only visible on print) */}
        <div className="print-only" style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <h1 style={{ margin: 0 }}>R&J Inventory</h1>
          <h2 style={{ margin: '0.5rem 0' }}>Daily Summary Report</h2>
          <p style={{ color: '#666' }}>Date: {new Date(date).toLocaleDateString('en-GB', { dateStyle: 'full' })}</p>
          <hr style={{ margin: '1.5rem 0', border: 'none', borderTop: '1px solid #eee' }} />
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6" style={{ marginBottom: '1.5rem' }}>
          <div className="card stat-card" style={{ borderLeft: '4px solid var(--blue)' }}>
            <div className="stat-label">Total Revenue</div>
            <div className="stat-value">GHS {summary?.revenue?.toFixed(2)}</div>
            <div className="stat-icon"><DollarSign size={24} /></div>
          </div>
          <div className="card stat-card" style={{ borderLeft: '4px solid var(--green)' }}>
            <div className="stat-label">Gross Profit</div>
            <div className="stat-value">GHS {summary?.profit?.toFixed(2)}</div>
            <div className="stat-sublabel">Margin: {summary?.margin_pct}%</div>
            <div className="stat-icon"><TrendingUp size={24} /></div>
          </div>
          <div className="card stat-card" style={{ borderLeft: '4px solid var(--purple)' }}>
            <div className="stat-label">Transactions</div>
            <div className="stat-value">{summary?.transaction_count}</div>
            <div className="stat-sublabel">{summary?.items_sold} items sold</div>
            <div className="stat-icon"><ShoppingCart size={24} /></div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top Sellers */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Top Selling Items</h3>
            </div>
            <div style={{ padding: '0.5rem' }}>
              {top_products?.length > 0 ? (
                <table className="table" style={{ border: 'none' }}>
                  <thead>
                    <tr>
                      <th style={{ background: 'none' }}>Product</th>
                      <th style={{ background: 'none', textAlign: 'right' }}>Qty</th>
                      <th style={{ background: 'none', textAlign: 'right' }}>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {top_products.map((p, idx) => (
                      <tr key={idx}>
                        <td>{p.name}</td>
                        <td style={{ textAlign: 'right' }}>{p.qty}</td>
                        <td style={{ textAlign: 'right' }} className="mono">GHS {p.rev.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-3)', fontSize: '0.875rem' }}>No sales recorded for this date.</p>
              )}
            </div>
          </div>

          {/* Inventory Snapshot */}
          <div className="card">
             <div className="card-header">
              <h3 className="card-title">Inventory Activity</h3>
            </div>
            <div style={{ padding: '1.5rem' }}>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'var(--teal-light)', color: 'var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Package size={22} />
                        </div>
                        <div>
                           <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>New Stock Received</div>
                           <div style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>{inventory?.stock_in_count} batch{inventory?.stock_in_count !== 1 ? 'es' : ''} recorded</div>
                        </div>
                    </div>
                    <div className="mono" style={{ fontWeight: 700, color: 'var(--teal)', fontSize: '1rem' }}>GHS {inventory?.stock_in_value.toFixed(2)}</div>
                  </div>
                  
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem', marginTop: '2rem' }}>
                     <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-3)', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Disclaimer</h4>
                     <p style={{ fontSize: '0.775rem', color: 'var(--text-3)', lineHeight: 1.5 }}>
                        This summary represents a snapshot of all confirmed (non-voided) sales and stock movements recorded between 12:00 AM and 11:59 PM on the selected date. 
                     </p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          .card { border: 1px solid #eee !important; box-shadow: none !important; margin-bottom: 1rem !important; }
          .stat-card { border-left: 4px solid #333 !important; }
          body { background: white !important; padding: 0 !important; }
          .eod-container { padding: 0 !important; }
        }
        .print-only { display: none; }
        .stat-card { position: relative; padding: 1.5rem; }
        .stat-label { font-size: 0.8rem; color: var(--text-3); font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
        .stat-value { font-size: 1.75rem; font-weight: 800; margin-top: 0.5rem; color: var(--text); }
        .stat-sublabel { font-size: 0.75rem; color: var(--text-3); margin-top: 0.25rem; font-weight: 500; }
        .stat-icon { position: absolute; right: 1.25rem; bottom: 1.25rem; opacity: 0.1; color: var(--text); }
      `}</style>
    </div>
  )
}
