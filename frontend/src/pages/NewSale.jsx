import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, ShoppingCart } from 'lucide-react'
import api from '../api/axios'
import FormField, { getErrorMessage } from '../components/FormField'

export default function NewSale() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [cart, setCart] = useState([])
  const [note, setNote] = useState('')
  const [productId, setProductId] = useState('')
  const [qty, setQty] = useState(1)
  const [submitError, setSubmitError] = useState(null)

  const { data: products = [] } = useQuery({
    queryKey: ['products', ''],
    queryFn: () => api.get('/products/?page_size=1000').then(r => r.data?.results ?? r.data),
  })

  const selectedProduct = products.find((p) => p.id === Number(productId))

  const addToCart = () => {
    if (!selectedProduct) return
    const existing = cart.find((c) => c.product.id === selectedProduct.id)
    if (existing) {
      setCart(cart.map((c) => c.product.id === selectedProduct.id ? { ...c, quantity: c.quantity + Number(qty) } : c))
    } else {
      setCart([...cart, { product: selectedProduct, quantity: Number(qty) }])
    }
    setProductId(''); setQty(1); setSubmitError(null)
  }

  const removeItem = (id) => setCart(cart.filter((c) => c.product.id !== id))
  const total = cart.reduce((sum, c) => sum + c.quantity * Number(c.product.selling_price), 0)

  const submit = useMutation({
    mutationFn: () => api.post('/sales/new/', { items: cart.map((c) => ({ product: c.product.id, quantity: c.quantity })), note }),
    onSuccess: (res) => { qc.invalidateQueries(['products']); qc.invalidateQueries(['dashboard']); navigate(`/sales/${res.data.id}`) },
    onError: (err) => {
      setSubmitError(err)
    },
  })

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">New Sale</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Add items */}
        <div className="card">
          <div className="card-header">
            <span className="card-header-title">Add Items to Cart</span>
          </div>
          <div className="card-body form-group">
            <FormField label="Product">
              <select className="input" value={productId} onChange={(e) => setProductId(e.target.value)}>
                <option value="">Select a product…</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id} disabled={p.stock_quantity === 0}>
                    {p.name} — GHS {p.selling_price} (stock: {p.stock_quantity})
                  </option>
                ))}
              </select>
            </FormField>

            {selectedProduct && (
              <div style={{ background: 'var(--blue-light)', border: '1px solid var(--blue)', borderRadius: '10px', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span style={{ fontWeight: 600, color: 'var(--blue)' }}>{selectedProduct.name}</span>
                <span style={{ color: 'var(--blue)' }}>GHS {selectedProduct.selling_price} / {selectedProduct.unit}</span>
              </div>
            )}

            <FormField label="Quantity">
              <input
                type="number" min="1"
                max={selectedProduct?.stock_quantity || undefined}
                className="input"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
              />
            </FormField>

            <button type="button" disabled={!productId} onClick={addToCart} className="btn btn-primary w-full interactive-item">
              <Plus size={15} /> Add to Cart
            </button>

            <div style={{ paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
              <FormField label="Note (optional)">
                <input className="input" placeholder="e.g. customer name" maxLength={100} value={note} onChange={(e) => setNote(e.target.value)} />
              </FormField>
            </div>
          </div>
        </div>

        {/* Cart */}
        <div className="card overflow-hidden flex flex-col">
          <div className="card-header">
            <div className="flex items-center gap-3">
              <ShoppingCart size={17} style={{ color: 'var(--text-3)' }} />
              <span className="card-header-title">Cart</span>
            </div>
            {cart.length > 0 && <span className="badge badge-blue">{cart.length} item{cart.length > 1 ? 's' : ''}</span>}
          </div>

          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 text-slate-300" style={{ padding: '4rem 2rem' }}>
              <ShoppingCart size={40} strokeWidth={1.2} />
              <p className="text-sm mt-3">Cart is empty — add products above</p>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto">
                <table className="table">
                  <thead>
                    <tr><th>Product</th><th>Qty</th><th>Unit Price</th><th>Total</th><th></th></tr>
                  </thead>
                  <tbody>
                    {cart.map((c) => (
                      <tr key={c.product.id}>
                        <td className="font-medium text-slate-800">{c.product.name}</td>
                        <td className="mono">{c.quantity}</td>
                        <td className="mono" style={{ color: 'var(--text-3)' }}>GHS {c.product.selling_price}</td>
                        <td className="mono" style={{ fontWeight: 700 }}>GHS {(c.quantity * Number(c.product.selling_price)).toFixed(2)}</td>
                        <td>
                          <button onClick={() => removeItem(c.product.id)} className="interactive-item" style={{ color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer' }}>
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ padding: '1.5rem 2rem', borderTop: '1px solid var(--border)', background: 'var(--surface-2)' }}>
                <div className="flex justify-between items-center" style={{ marginBottom: '1.25rem' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-3)' }}>Total Amount</span>
                  <span className="mono" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)' }}>GHS {total.toFixed(2)}</span>
                </div>
                {submitError && (
                  <div className="alert alert-red" style={{ marginBottom: '1rem' }}>
                    {getErrorMessage(submitError)}
                  </div>
                )}
                <button onClick={() => submit.mutate()} disabled={submit.isPending || cart.length === 0} className="btn btn-success w-full interactive-item">
                  {submit.isPending ? 'Processing…' : 'Confirm Sale'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
