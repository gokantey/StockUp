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
            <button onClick={() => setShowVoidModal(true)} className="btn btn-danger btn-sm interactive-item">
              <Ban size={14} /> Void Sale
            </button>
          )}
          <button onClick={() => window.print()} className="btn btn-ghost btn-sm interactive-item">
            <Printer size={14} /> Print
          </button>
          <Link to="/sales/new" className="btn btn-primary btn-sm interactive-item">
            <ShoppingCart size={14} /> New Sale
          </Link>
        </div>
      </div>

      <div className="card" style={{ padding: '3rem 2.5rem', background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden' }} id="receipt">

        {/* Subtle decorative edge */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'var(--teal)' }} />

        {/* Voided banner - more professional */}
        {sale.is_voided && (
          <div style={{
            position: 'absolute', top: 40, right: -35, background: 'var(--red)', color: '#fff',
            padding: '0.5rem 3rem', transform: 'rotate(45deg)', fontWeight: 800, fontSize: '0.75rem',
            textTransform: 'uppercase', letterSpacing: '0.1em', boxShadow: '0 2px 8px rgba(220,38,38,0.3)',
            zIndex: 10
          }}>
            Voided
          </div>
        )}

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, borderRadius: '14px', background: 'var(--navy)', marginBottom: '1rem', color: '#fff' }}>
            <img src="/rj.svg" alt="R&J" style={{ width: 42, height: 42 }} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--navy)', marginBottom: '0.25rem', letterSpacing: '-0.02em' }}>R&J PROVISIONS</h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 500 }}>Official Sales Receipt</p>
          <div style={{ marginTop: '1.25rem', padding: '0.75rem', border: '1px solid #f1f5f9', borderRadius: '8px', display: 'inline-block' }}>

          </div>
        </div>

        {/* Meta Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem', padding: '1rem 0', borderTop: '1px dashed #e2e8f0', borderBottom: '1px dashed #e2e8f0' }}>
          <div>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Receipt Number</p>
            <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>#{String(sale.id).padStart(6, '0')}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Date & Time</p>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)' }}>{new Date(sale.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
          </div>
          <div>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Cashier</p>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)' }}>{sale.created_by_name}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Status</p>
            <span style={{
              fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '4px',
              background: sale.is_voided ? 'var(--red-light)' : 'var(--teal-light)',
              color: sale.is_voided ? 'var(--red)' : 'var(--teal)'
            }}>
              {sale.is_voided ? 'VOIDED' : 'PAID'}
            </span>
          </div>
        </div>

        {/* Items Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem', opacity: sale.is_voided ? 0.4 : 1 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--navy)' }}>
              <th style={{ textAlign: 'left', padding: '0.75rem 0', fontSize: '0.7rem', fontWeight: 800, color: 'var(--navy)', textTransform: 'uppercase' }}>Description</th>
              <th style={{ textAlign: 'center', padding: '0.75rem 0', fontSize: '0.7rem', fontWeight: 800, color: 'var(--navy)', textTransform: 'uppercase' }}>Qty</th>
              <th style={{ textAlign: 'right', padding: '0.75rem 0', fontSize: '0.7rem', fontWeight: 800, color: 'var(--navy)', textTransform: 'uppercase' }}>Price</th>
              <th style={{ textAlign: 'right', padding: '0.75rem 0', fontSize: '0.7rem', fontWeight: 800, color: 'var(--navy)', textTransform: 'uppercase' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {sale.items.map((item) => (
              <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '0.875rem 0', fontSize: '0.845rem', color: 'var(--text)', fontWeight: 500 }}>{item.product_name}</td>
                <td style={{ padding: '0.875rem 0', textAlign: 'center', fontSize: '0.845rem', color: 'var(--text-2)' }}>{item.quantity}</td>
                <td style={{ padding: '0.875rem 0', textAlign: 'right', fontSize: '0.845rem', color: 'var(--text-2)' }}>{Number(item.unit_price_at_sale).toFixed(2)}</td>
                <td style={{ padding: '0.875rem 0', textAlign: 'right', fontSize: '0.845rem', fontWeight: 700, color: 'var(--text)' }}>{Number(item.line_total).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Calculation Summary */}
        <div style={{ marginLeft: 'auto', maxWidth: '180px', marginBottom: '2.5rem', opacity: sale.is_voided ? 0.4 : 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>Subtotal</span>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>GHS {Number(sale.total).toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>Tax (0%)</span>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>0.00</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.75rem', borderTop: '2px solid var(--navy)' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--navy)' }}>TOTAL</span>
            <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--navy)', textDecoration: sale.is_voided ? 'line-through' : 'none' }}>
              GHS {Number(sale.total).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Footer & Barcode */}
        <div style={{ textAlign: 'center', paddingTop: '2rem', borderTop: '1px dashed #e2e8f0' }}>
          {sale.note && (
            <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '6px', marginBottom: '1.5rem', textAlign: 'left' }}>
              <p style={{ fontSize: '0.65rem', color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Note</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-2)' }}>{sale.note}</p>
            </div>
          )}

          <p style={{ fontSize: '0.845rem', fontWeight: 600, color: 'var(--navy)', marginBottom: '0.5rem' }}>Thank you for your business!</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>Please keep this receipt for your records.</p>

          {/* Simulated Barcode */}
          <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '2px', height: '32px', marginBottom: '0.5rem' }}>
              {[2, 4, 1, 3, 2, 1, 4, 2, 3, 1, 2, 4, 1, 3, 2, 1, 4].map((w, i) => (
                <div key={i} style={{ width: w, background: '#1e293b', height: '100%' }} />
              ))}
            </div>
            <p style={{ fontSize: '0.6rem', color: 'var(--text-3)', letterSpacing: '0.4em', fontFamily: 'var(--font-mono)' }}>* {String(sale.id).padStart(8, '0')} *</p>
          </div>
        </div>

        {sale.is_voided && sale.void_reason && (
          <div style={{ marginTop: '2rem', padding: '1rem', background: 'var(--red-light)', borderRadius: '8px', border: '1px solid #fecaca' }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--red)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Void Information</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--red)' }}><strong>Reason:</strong> {sale.void_reason}</p>
          </div>
        )}
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
                  className="btn btn-danger flex-1 interactive-item"
                >
                  {voidSale.isPending ? 'Voiding…' : 'Yes, Void Sale'}
                </button>
                <button onClick={() => setShowVoidModal(false)} className="btn btn-ghost flex-1 interactive-item">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
