import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { Printer, ShoppingCart, Package, Ban, X, AlertTriangle } from 'lucide-react'
import api from '../api/axios'
import useAuthStore from '../store/authStore'

export default function SaleReceipt() {
  const { id } = useParams()
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [showVoidModal, setShowVoidModal] = useState(false)
  const [voidReason, setVoidReason] = useState('')

  const { data: sale, isLoading } = useQuery({
    queryKey: ['sale', id],
    queryFn: () => api.get(`/sales/${id}/`).then((r) => r.data),
  })

  const voidSale = useMutation({
    mutationFn: () => api.post(`/sales/${id}/void/`, { void_reason: voidReason }),
    onSuccess: () => {
      qc.invalidateQueries(['sale', id])
      qc.invalidateQueries(['sales'])
      qc.invalidateQueries(['dashboard'])
      setShowVoidModal(false)
      setVoidReason('')
    },
  })

  if (isLoading) return (
    <div className="flex items-center justify-center h-40">
      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-md mx-auto">
      <div className="page-header">
        <h1 className="page-title">Sale Receipt</h1>
        <div className="flex gap-2">
          {user?.role === 'admin' && !sale.is_voided && (
            <button onClick={() => setShowVoidModal(true)} className="btn btn-danger btn-sm">
              <Ban size={14} /> Void Sale
            </button>
          )}
          <button onClick={() => window.print()} className="btn btn-ghost btn-sm">
            <Printer size={14} /> Print
          </button>
          <Link to="/sales/new" className="btn btn-primary btn-sm">
            <ShoppingCart size={14} /> New Sale
          </Link>
        </div>
      </div>

      <div className="card" style={{ padding: '2.25rem 2rem' }} id="receipt">

        {/* Voided banner */}
        {sale.is_voided && (
          <div style={{
            background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: '0.875rem',
            padding: '1rem 1.25rem', marginBottom: '1.5rem',
            display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
          }}>
            <Ban size={16} style={{ color: '#dc2626', flexShrink: 0, marginTop: 2 }} />
            <div>
              <p style={{ fontWeight: 700, color: '#dc2626', fontSize: '0.875rem' }}>This sale has been voided</p>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.2rem' }}>Reason: {sale.void_reason}</p>
              {sale.voided_by_name && (
                <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                  By {sale.voided_by_name} · {new Date(sale.voided_at).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-6 pb-5 border-b border-dashed border-slate-200">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-xl mb-3">
            <Package size={20} color="white" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">StockUp</h2>
          <p className="text-slate-400 text-sm mt-0.5">Provision Shop</p>
        </div>

        {/* Meta */}
        <div className="flex justify-between text-xs text-slate-500 mb-5">
          <span>Receipt <span className="font-mono font-semibold">#{String(sale.id).padStart(4, '0')}</span></span>
          <span>{new Date(sale.created_at).toLocaleString()}</span>
        </div>

        {/* Items */}
        <table className="w-full text-sm mb-5" style={{ opacity: sale.is_voided ? 0.5 : 1 }}>
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left py-2 text-xs font-semibold text-slate-500 uppercase">Item</th>
              <th className="text-center py-2 text-xs font-semibold text-slate-500 uppercase">Qty</th>
              <th className="text-right py-2 text-xs font-semibold text-slate-500 uppercase">Price</th>
              <th className="text-right py-2 text-xs font-semibold text-slate-500 uppercase">Total</th>
            </tr>
          </thead>
          <tbody>
            {sale.items.map((item) => (
              <tr key={item.id} className="border-b border-slate-50">
                <td className="py-2.5 text-slate-800">{item.product_name}</td>
                <td className="py-2.5 text-center text-slate-600">{item.quantity}</td>
                <td className="py-2.5 text-right text-slate-600">GH₵ {item.unit_price_at_sale}</td>
                <td className="py-2.5 text-right font-semibold text-slate-800">GH₵ {Number(item.line_total).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Total */}
        <div style={{
          background: sale.is_voided ? '#f1f5f9' : '#f8fafc',
          borderRadius: '0.875rem', padding: '1rem 1.25rem',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          opacity: sale.is_voided ? 0.5 : 1,
        }}>
          <span className="font-semibold text-slate-700">Total</span>
          <span style={{ fontSize: '1.5rem', fontWeight: 800, color: sale.is_voided ? '#94a3b8' : '#0f172a', textDecoration: sale.is_voided ? 'line-through' : 'none' }}>
            GH₵ {Number(sale.total).toFixed(2)}
          </span>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-dashed border-slate-200 text-xs text-slate-400 text-center space-y-1">
          {sale.note && <p>Note: {sale.note}</p>}
          <p>Served by: {sale.created_by_name}</p>
          <p className="mt-2">Thank you for your purchase!</p>
        </div>
      </div>

      {/* Void confirmation modal */}
      {showVoidModal && (
        <div className="modal-overlay" onClick={() => setShowVoidModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between" style={{ marginBottom: '1.5rem' }}>
              <div className="flex items-center gap-3">
                <div style={{ width: 38, height: 38, borderRadius: '0.75rem', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <AlertTriangle size={18} style={{ color: '#dc2626' }} />
                </div>
                <h3 className="modal-title" style={{ margin: 0 }}>Void Sale #{String(sale.id).padStart(4, '0')}?</h3>
              </div>
              <button onClick={() => setShowVoidModal(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>

            <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              This will reverse all stock quantities and mark the sale as void. <strong>This cannot be undone.</strong>
            </p>

            <div className="form-group">
              <div>
                <label className="label">Reason for voiding *</label>
                <input
                  autoFocus
                  className="input"
                  placeholder="e.g. Customer returned goods, wrong items entered…"
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                />
              </div>

              {voidSale.error && (
                <p style={{ color: '#dc2626', fontSize: '0.875rem' }}>
                  {voidSale.error.response?.data?.detail || 'Something went wrong.'}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => voidSale.mutate()}
                  disabled={!voidReason.trim() || voidSale.isPending}
                  className="btn btn-danger flex-1"
                >
                  {voidSale.isPending ? 'Voiding…' : 'Yes, Void Sale'}
                </button>
                <button onClick={() => setShowVoidModal(false)} className="btn btn-ghost flex-1">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
