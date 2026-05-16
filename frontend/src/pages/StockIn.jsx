import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle, SlidersHorizontal, ArrowUpCircle } from 'lucide-react'
import api from '../api/axios'
import FormField, { getErrorMessage } from '../components/FormField'

const emptyStockIn = { product: '', quantity: '', note: '' }
const emptyAdjust  = { product: '', new_quantity: '', reason: '' }

export default function StockIn() {
  const qc = useQueryClient()
  const [tab, setTab]             = useState('stock-in')
  const [form, setForm]           = useState(emptyStockIn)
  const [adjForm, setAdjForm]     = useState(emptyAdjust)
  const [success, setSuccess]     = useState(false)
  const [adjSuccess, setAdjSuccess] = useState(false)

  const { data: products = [] } = useQuery({ queryKey: ['products', ''], queryFn: () => api.get('/products/?page_size=1000').then(r => r.data?.results ?? r.data) })
  
  const { data: history = [], isLoading: historyLoading } = useQuery({
    queryKey: ['stock-movements', 'IN'],
    queryFn: () => api.get('/stock-movements/?type=IN').then(r => r.data?.results ?? r.data),
  })
  const { data: adjHistory = [], isLoading: adjHistoryLoading } = useQuery({
    queryKey: ['stock-movements', 'ADJ'],
    queryFn: () => api.get('/stock-movements/?type=ADJ').then(r => r.data?.results ?? r.data),
  })

  const set    = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const setAdj = (k, v) => setAdjForm((f) => ({ ...f, [k]: v }))

  const selectedProduct = products.find((p) => p.id === Number(adjForm.product))
  const adjDelta = adjForm.new_quantity !== '' && selectedProduct
    ? Number(adjForm.new_quantity) - selectedProduct.stock_quantity
    : null

  const record = useMutation({
    mutationFn: (data) => api.post('/stock-in/', data),
    onSuccess: () => {
      qc.invalidateQueries(['products']); qc.invalidateQueries(['stock-movements']); qc.invalidateQueries(['dashboard'])
      setForm(emptyStockIn); setSuccess(true); setTimeout(() => setSuccess(false), 3000)
    },
  })

  const adjust = useMutation({
    mutationFn: (data) => api.post('/stock-adjustment/', data),
    onSuccess: () => {
      qc.invalidateQueries(['products']); qc.invalidateQueries(['stock-movements']); qc.invalidateQueries(['dashboard'])
      setAdjForm(emptyAdjust); setAdjSuccess(true); setTimeout(() => setAdjSuccess(false), 3000)
    },
  })

  const tabStyle = (active) => ({
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    padding: '0.6rem 1.25rem', borderRadius: '0.75rem',
    fontSize: '0.875rem', fontWeight: 600, border: 'none', cursor: 'pointer',
    transition: 'all 0.15s',
    background: active ? '#fff' : 'transparent',
    color: active ? '#0f172a' : '#94a3b8',
    boxShadow: active ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
  })

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Stock Management</h1>
        <div style={{ display: 'flex', gap: '0.25rem', background: '#f1f5f9', padding: '0.3rem', borderRadius: '0.875rem' }}>
          <button className="interactive-item" style={tabStyle(tab === 'stock-in')} onClick={() => setTab('stock-in')}>
            <ArrowUpCircle size={15} /> Stock In
          </button>
          <button className="interactive-item" style={tabStyle(tab === 'adjust')} onClick={() => setTab('adjust')}>
            <SlidersHorizontal size={15} /> Adjust Stock
          </button>
        </div>
      </div>

      {/* ── Stock In Tab ── */}
      {tab === 'stock-in' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <div className="card-header"><span className="card-header-title">Record Stock Received</span></div>
            <div className="card-body">
              <form onSubmit={(e) => { e.preventDefault(); record.mutate(form) }} className="form-group">
                <FormField label="Product" required>
                  <select required className="input" value={form.product} onChange={(e) => set('product', e.target.value)}>
                    <option value="">Select a product…</option>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.name} — current stock: {p.stock_quantity}</option>)}
                  </select>
                </FormField>
                
                <FormField label="Quantity Received" required>
                  <input required type="number" min="1" className="input" placeholder="0" value={form.quantity} onChange={(e) => set('quantity', e.target.value)} />
                </FormField>

                <FormField label="Note">
                  <input className="input" placeholder="Optional" maxLength={200} value={form.note} onChange={(e) => set('note', e.target.value)} />
                </FormField>
                {record.error && (
                  <div className="alert alert-red">
                    {getErrorMessage(record.error)}
                  </div>
                )}
                {success && (
                  <div className="alert alert-green">
                    <CheckCircle size={16} /> Stock recorded successfully.
                  </div>
                )}
                <button type="submit" disabled={record.isPending} className="btn btn-primary w-full interactive-item" style={{ marginTop: '0.5rem' }}>
                  {record.isPending ? 'Saving…' : 'Record Stock In'}
                </button>
              </form>
            </div>
          </div>

          <div className="card overflow-hidden flex flex-col">
            <div className="card-header"><span className="card-header-title">Recent Stock-In History</span></div>
            {historyLoading ? (
              <div className="flex items-center justify-center" style={{ height: 200 }}>
                <div className="spinner" />
              </div>
            ) : (
              <div className="overflow-y-auto flex-1" style={{ maxHeight: 480 }}>
                <table className="table">
                  <thead><tr><th>Product</th><th>Qty</th><th>Date</th></tr></thead>
                  <tbody>
                    {history.map((m) => (
                      <tr key={m.id}>
                        <td className="font-medium text-slate-800">{m.product_name}</td>
                        <td><span className="badge badge-teal">+{m.quantity}</span></td>
                        <td className="text-slate-400 text-xs">{new Date(m.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                    {history.length === 0 && <tr><td colSpan={3} className="text-center text-slate-400 text-sm" style={{ padding: '3rem' }}>No history yet.</td></tr>}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Adjust Stock Tab ── */}
      {tab === 'adjust' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <div className="card-header"><span className="card-header-title">Adjust Stock Level</span></div>
            <div className="card-body">
              <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1.25rem', lineHeight: 1.6 }}>
                Use this to correct a product's stock to its actual count.
              </p>
              <form onSubmit={(e) => { e.preventDefault(); adjust.mutate(adjForm) }} className="form-group">
                <FormField label="Product" required>
                  <select required className="input" value={adjForm.product} onChange={(e) => setAdj('product', e.target.value)}>
                    <option value="">Select a product…</option>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.name} — current stock: {p.stock_quantity}</option>)}
                  </select>
                </FormField>

                {selectedProduct && (
                  <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '0.875rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-3)' }}>Current stock</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)' }}>{selectedProduct.stock_quantity}</span>
                  </div>
                )}

                <FormField label="Correct Stock Count" required>
                  <input
                    required type="number" min="0" className="input"
                    placeholder="Enter the actual quantity on hand"
                    value={adjForm.new_quantity}
                    onChange={(e) => setAdj('new_quantity', e.target.value)}
                  />
                  {adjDelta !== null && adjDelta !== 0 && (
                    <p style={{ fontSize: '0.8rem', marginTop: '0.4rem', fontWeight: 600, color: adjDelta > 0 ? 'var(--green)' : 'var(--red)' }}>
                      {adjDelta > 0 ? `+${adjDelta}` : adjDelta} units will be {adjDelta > 0 ? 'added' : 'removed'}
                    </p>
                  )}
                </FormField>

                <FormField label="Reason" required>
                  <input
                    required className="input"
                    placeholder="Reason for adjustment"
                    maxLength={200}
                    value={adjForm.reason}
                    onChange={(e) => setAdj('reason', e.target.value)}
                  />
                </FormField>

                {adjust.error && (
                  <div className="alert alert-red">
                    {getErrorMessage(adjust.error)}
                  </div>
                )}
                {adjSuccess && (
                  <div className="alert alert-green">
                    <CheckCircle size={16} /> Stock adjusted successfully.
                  </div>
                )}
                <button type="submit" disabled={adjust.isPending || adjDelta === 0} className="btn btn-primary w-full interactive-item" style={{ marginTop: '0.5rem' }}>
                  {adjust.isPending ? 'Saving…' : 'Apply Adjustment'}
                </button>
              </form>
            </div>
          </div>

          <div className="card overflow-hidden flex flex-col">
            <div className="card-header"><span className="card-header-title">Adjustment History</span></div>
            {adjHistoryLoading ? (
              <div className="flex items-center justify-center" style={{ height: 200 }}>
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="overflow-y-auto flex-1" style={{ maxHeight: 480 }}>
                <table className="table">
                  <thead><tr><th>Product</th><th>Change</th><th>By</th><th>Note</th><th>Date</th></tr></thead>
                  <tbody>
                    {adjHistory.map((m) => (
                      <tr key={m.id}>
                        <td className="font-medium text-slate-800">{m.product_name}</td>
                        <td>
                          <span className={`badge ${(m.adjustment_delta ?? 0) >= 0 ? 'badge-teal' : 'badge-red'}`}>
                            {(m.adjustment_delta ?? 0) > 0 ? `+${m.adjustment_delta}` : m.adjustment_delta ?? 0}
                          </span>
                        </td>
                        <td className="text-slate-500">{m.created_by_name ?? '—'}</td>
                        <td className="text-slate-500 text-xs" style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.note}</td>
                        <td className="text-slate-400 text-xs">{new Date(m.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                    {adjHistory.length === 0 && <tr><td colSpan={5} className="text-center text-slate-400 text-sm" style={{ padding: '3rem' }}>No adjustments yet.</td></tr>}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
