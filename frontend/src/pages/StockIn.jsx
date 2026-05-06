import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle, SlidersHorizontal, ArrowUpCircle } from 'lucide-react'
import api from '../api/axios'

const emptyStockIn = { product: '', quantity: '', unit_cost: '', supplier: '', note: '' }
const emptyAdjust  = { product: '', new_quantity: '', reason: '' }

export default function StockIn() {
  const qc = useQueryClient()
  const [tab, setTab]             = useState('stock-in')
  const [form, setForm]           = useState(emptyStockIn)
  const [adjForm, setAdjForm]     = useState(emptyAdjust)
  const [success, setSuccess]     = useState(false)
  const [adjSuccess, setAdjSuccess] = useState(false)

 const { data: products = [] } = useQuery({ queryKey: ['products', ''], queryFn: () => api.get('/products/?page_size=1000').then(r => r.data?.results ?? r.data) })
  const { data: suppliers = [] } = useQuery({ queryKey: ['suppliers'],queryFn: () => api.get('/suppliers/').then(r => r.data?.results ?? r.data) })
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
          <button style={tabStyle(tab === 'stock-in')} onClick={() => setTab('stock-in')}>
            <ArrowUpCircle size={15} /> Stock In
          </button>
          <button style={tabStyle(tab === 'adjust')} onClick={() => setTab('adjust')}>
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
                <div>
                  <label className="label">Product *</label>
                  <select required className="input" value={form.product} onChange={(e) => set('product', e.target.value)}>
                    <option value="">Select a product…</option>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.name} — current stock: {p.stock_quantity}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Quantity Received *</label>
                    <input required type="number" min="1" className="input" placeholder="0" value={form.quantity} onChange={(e) => set('quantity', e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Cost Price / Unit (GH₵)</label>
                    <input type="number" step="0.01" min="0" className="input" placeholder="Optional" value={form.unit_cost} onChange={(e) => set('unit_cost', e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="label">Supplier</label>
                  <select className="input" value={form.supplier} onChange={(e) => set('supplier', e.target.value)}>
                    <option value="">No supplier</option>
                    {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Note</label>
                  <input className="input" placeholder="Optional — e.g. delivery reference" value={form.note} onChange={(e) => set('note', e.target.value)} />
                </div>
                {record.error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">{JSON.stringify(record.error.response?.data)}</p>}
                {success && (
                  <div className="flex items-center gap-2.5 text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm">
                    <CheckCircle size={16} /> Stock recorded successfully.
                  </div>
                )}
                <button type="submit" disabled={record.isPending} className="btn btn-primary w-full" style={{ marginTop: '0.5rem' }}>
                  {record.isPending ? 'Saving…' : 'Record Stock In'}
                </button>
              </form>
            </div>
          </div>

          <div className="card overflow-hidden flex flex-col">
            <div className="card-header"><span className="card-header-title">Recent Stock-In History</span></div>
            {historyLoading ? (
              <div className="flex items-center justify-center" style={{ height: 200 }}>
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="overflow-y-auto flex-1" style={{ maxHeight: 480 }}>
                <table className="table">
                  <thead><tr><th>Product</th><th>Qty</th><th>Cost / Unit</th><th>Supplier</th><th>Date</th></tr></thead>
                  <tbody>
                    {history.map((m) => (
                      <tr key={m.id}>
                        <td className="font-medium text-slate-800">{m.product_name}</td>
                        <td><span className="badge badge-teal">+{m.quantity}</span></td>
                        <td className="text-slate-500">{m.unit_cost ? `GH₵ ${m.unit_cost}` : '—'}</td>
                        <td className="text-slate-500">{m.supplier_name ?? '—'}</td>
                        <td className="text-slate-400 text-xs">{new Date(m.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                    {history.length === 0 && <tr><td colSpan={5} className="text-center text-slate-400 text-sm" style={{ padding: '3rem' }}>No history yet.</td></tr>}
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
                Use this to correct a product's stock to its actual count — e.g. after a physical count, damaged goods, or theft.
              </p>
              <form onSubmit={(e) => { e.preventDefault(); adjust.mutate(adjForm) }} className="form-group">
                <div>
                  <label className="label">Product *</label>
                  <select required className="input" value={adjForm.product} onChange={(e) => setAdj('product', e.target.value)}>
                    <option value="">Select a product…</option>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.name} — current stock: {p.stock_quantity}</option>)}
                  </select>
                </div>

                {selectedProduct && (
                  <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '0.75rem', padding: '0.875rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Current stock</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>{selectedProduct.stock_quantity}</span>
                  </div>
                )}

                <div>
                  <label className="label">Correct Stock Count *</label>
                  <input
                    required type="number" min="0" className="input"
                    placeholder="Enter the actual quantity on hand"
                    value={adjForm.new_quantity}
                    onChange={(e) => setAdj('new_quantity', e.target.value)}
                  />
                  {adjDelta !== null && adjDelta !== 0 && (
                    <p style={{ fontSize: '0.8rem', marginTop: '0.4rem', fontWeight: 600, color: adjDelta > 0 ? '#059669' : '#dc2626' }}>
                      {adjDelta > 0 ? `+${adjDelta}` : adjDelta} units will be {adjDelta > 0 ? 'added' : 'removed'}
                    </p>
                  )}
                  {adjDelta === 0 && adjForm.new_quantity !== '' && (
                    <p style={{ fontSize: '0.8rem', marginTop: '0.4rem', color: '#94a3b8' }}>No change — quantity is already {adjForm.new_quantity}</p>
                  )}
                </div>

                <div>
                  <label className="label">Reason *</label>
                  <input
                    required className="input"
                    placeholder="e.g. Physical count correction, damaged goods, theft…"
                    value={adjForm.reason}
                    onChange={(e) => setAdj('reason', e.target.value)}
                  />
                </div>

                {adjust.error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">{adjust.error.response?.data?.detail || 'Something went wrong.'}</p>}
                {adjSuccess && (
                  <div className="flex items-center gap-2.5 text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm">
                    <CheckCircle size={16} /> Stock adjusted successfully.
                  </div>
                )}
                <button type="submit" disabled={adjust.isPending || adjDelta === 0} className="btn btn-primary w-full" style={{ marginTop: '0.5rem' }}>
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
