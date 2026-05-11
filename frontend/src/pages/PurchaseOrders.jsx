import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, X, FileText, CheckCircle, PackageCheck, Ban, Trash2 } from 'lucide-react'
import api from '../api/axios'

// Helper for status badge
const StatusBadge = ({ status }) => {
  const map = {
    draft: { color: 'var(--text-3)', bg: 'var(--surface-2)', label: 'Draft' },
    ordered: { color: 'var(--blue)', bg: 'var(--blue-light)', label: 'Ordered' },
    partially_received: { color: 'var(--teal)', bg: 'var(--teal-light)', label: 'Partial' },
    received: { color: 'var(--green)', bg: 'var(--green-light)', label: 'Received' },
    cancelled: { color: 'var(--red)', bg: 'var(--red-light)', label: 'Cancelled' },
  }
  const s = map[status] || map.draft
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '0.2rem 0.6rem',
      borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: '0.04em',
      color: s.color, background: s.bg, border: `1px solid ${s.color}30`
    }}>
      {s.label}
    </span>
  )
}

export default function PurchaseOrders() {
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [receivingPO, setReceivingPO] = useState(null)

  const { data: pos = [], isLoading } = useQuery({
    queryKey: ['purchase-orders'],
    queryFn: () => api.get('/purchase-orders/').then(r => r.data?.results ?? r.data),
  })

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => api.get('/suppliers/').then(r => r.data?.results ?? r.data),
  })

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.get('/products/').then(r => r.data?.results ?? r.data),
  })

  const createPO = useMutation({
    mutationFn: (data) => api.post('/purchase-orders/', data),
    onSuccess: () => { qc.invalidateQueries(['purchase-orders']); setShowCreate(false) },
  })

  const cancelPO = useMutation({
    mutationFn: (id) => api.post(`/purchase-orders/${id}/cancel/`),
    onSuccess: () => qc.invalidateQueries(['purchase-orders']),
  })

  const receivePO = useMutation({
    mutationFn: ({ id, data }) => api.post(`/purchase-orders/${id}/receive/`, data),
    onSuccess: () => { qc.invalidateQueries(['purchase-orders']); qc.invalidateQueries(['products']); setReceivingPO(null) },
  })

  // Create PO Form State
  const [poForm, setPoForm] = useState({ supplier: '', expected_date: '', notes: '', status: 'ordered', items: [] })
  const addPoItem = () => setPoForm(f => ({ ...f, items: [...f.items, { product: '', ordered_qty: 1, unit_cost: '' }] }))
  const removePoItem = (index) => setPoForm(f => ({ ...f, items: f.items.filter((_, i) => i !== index) }))
  const updatePoItem = (index, key, value) => {
    const newItems = [...poForm.items]
    newItems[index][key] = value
    if (key === 'product') {
      const p = products.find(p => p.id.toString() === value)
      if (p) newItems[index].unit_cost = p.cost_price
    }
    setPoForm({ ...poForm, items: newItems })
  }

  const handleCreate = (e) => {
    e.preventDefault()
    createPO.mutate({
      ...poForm,
      supplier: poForm.supplier || null,
      items: poForm.items.filter(i => i.product && i.ordered_qty > 0)
    })
  }

  // Receive PO Form State
  const [receiveForm, setReceiveForm] = useState([])
  const openReceive = (po) => {
    setReceivingPO(po)
    setReceiveForm(po.items.map(item => ({
      id: item.id,
      product_name: item.product_name,
      ordered_qty: item.ordered_qty,
      received_qty: item.received_qty,
      received_qty_now: 0
    })))
  }

  const handleReceive = (e) => {
    e.preventDefault()
    receivePO.mutate({
      id: receivingPO.id,
      data: { items: receiveForm }
    })
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Purchase Orders</h1>
          <p className="page-subtitle">{pos.length} PO{pos.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => { setPoForm({ supplier: '', expected_date: '', notes: '', status: 'ordered', items: [] }); setShowCreate(true) }} className="btn btn-primary">
          <Plus size={15} /> Create PO
        </button>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 140 }}><div className="spinner" /></div>
        ) : (
          <table className="table">
            <thead>
              <tr><th>PO Number</th><th>Supplier</th><th>Date</th><th>Status</th><th>Items</th><th></th></tr>
            </thead>
            <tbody>
              {pos.map(po => (
                <tr key={po.id}>
                  <td><span style={{ fontWeight: 600, color: 'var(--text)' }}>{po.po_number}</span></td>
                  <td>{po.supplier_name || <span style={{ color: 'var(--text-3)', fontStyle: 'italic' }}>No Supplier</span>}</td>
                  <td>{new Date(po.created_at).toLocaleDateString()}</td>
                  <td><StatusBadge status={po.status} /></td>
                  <td>
                    {po.items.length} items
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: '0.2rem' }}>
                      {po.items.reduce((acc, i) => acc + i.received_qty, 0)} / {po.items.reduce((acc, i) => acc + i.ordered_qty, 0)} received
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {['ordered', 'partially_received'].includes(po.status) && (
                        <>
                          <button onClick={() => openReceive(po)} className="btn btn-primary btn-sm"><PackageCheck size={12} /> Receive</button>
                          {po.status === 'ordered' && (
                            <button onClick={() => cancelPO.mutate(po.id)} className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }}><Ban size={12} /> Cancel</button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {pos.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', color: 'var(--text-3)' }}>
                      <FileText size={32} strokeWidth={1.2} style={{ marginBottom: '0.875rem' }} />
                      <p style={{ fontSize: '0.875rem' }}>No purchase orders yet.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" style={{ maxWidth: '42rem' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h3 className="modal-title" style={{ margin: 0 }}>Create Purchase Order</h3>
              <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            
            <form onSubmit={handleCreate} className="form-group">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Supplier</label>
                  <select className="input" value={poForm.supplier} onChange={e => setPoForm({ ...poForm, supplier: e.target.value })}>
                    <option value="">No Supplier</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Expected Date</label>
                  <input type="date" className="input" value={poForm.expected_date} onChange={e => setPoForm({ ...poForm, expected_date: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="label">Notes</label>
                <textarea className="input" rows={2} value={poForm.notes} onChange={e => setPoForm({ ...poForm, notes: e.target.value })} />
              </div>

              <div style={{ marginTop: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <label className="label" style={{ margin: 0 }}>Order Items</label>
                  <button type="button" onClick={addPoItem} className="btn btn-ghost btn-sm" style={{ padding: '0.2rem 0.5rem' }}><Plus size={14} /> Add Item</button>
                </div>
                
                {poForm.items.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '1.5rem', background: 'var(--surface-2)', borderRadius: '8px', border: '1px dashed var(--border)', fontSize: '0.85rem', color: 'var(--text-3)' }}>
                    No items added yet.
                  </div>
                )}
                
                {poForm.items.map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                    <div style={{ flex: 2 }}>
                      <select required className="input" value={item.product} onChange={e => updatePoItem(i, 'product', e.target.value)}>
                        <option value="">Select Product...</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <input required type="number" min="1" className="input" placeholder="Qty" value={item.ordered_qty} onChange={e => updatePoItem(i, 'ordered_qty', e.target.value)} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <input required type="number" step="0.01" min="0" className="input" placeholder="Unit Cost" value={item.unit_cost} onChange={e => updatePoItem(i, 'unit_cost', e.target.value)} />
                    </div>
                    <button type="button" onClick={() => removePoItem(i)} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', padding: '0.5rem' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '0.625rem', marginTop: '1.5rem' }}>
                <button type="submit" disabled={createPO.isPending || poForm.items.length === 0} className="btn btn-primary" style={{ flex: 1 }}>
                  {createPO.isPending ? 'Creating…' : 'Create PO'}
                </button>
                <button type="button" onClick={() => setShowCreate(false)} className="btn btn-ghost" style={{ flex: 1 }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {receivingPO && (
        <div className="modal-overlay" onClick={() => setReceivingPO(null)}>
          <div className="modal" style={{ maxWidth: '32rem' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h3 className="modal-title" style={{ margin: 0 }}>Receive Delivery: {receivingPO.po_number}</h3>
              <button onClick={() => setReceivingPO(null)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            
            <form onSubmit={handleReceive} className="form-group">
              <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                <table className="table" style={{ margin: 0 }}>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Ordered</th>
                      <th>Received</th>
                      <th style={{ width: 100 }}>Receiving Now</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receiveForm.map((item, i) => (
                      <tr key={item.id}>
                        <td style={{ fontSize: '0.85rem' }}>{item.product_name}</td>
                        <td style={{ fontSize: '0.85rem' }}>{item.ordered_qty}</td>
                        <td style={{ fontSize: '0.85rem', color: item.received_qty === item.ordered_qty ? 'var(--green)' : 'inherit' }}>{item.received_qty}</td>
                        <td>
                          {item.received_qty < item.ordered_qty ? (
                            <input
                              type="number"
                              min="0"
                              max={item.ordered_qty - item.received_qty}
                              className="input"
                              style={{ padding: '0.3rem 0.5rem', height: 'auto', fontSize: '0.85rem' }}
                              value={item.received_qty_now}
                              onChange={e => {
                                const val = parseInt(e.target.value) || 0
                                const newForm = [...receiveForm]
                                newForm[i].received_qty_now = val
                                setReceiveForm(newForm)
                              }}
                            />
                          ) : (
                            <CheckCircle size={16} style={{ color: 'var(--green)' }} />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', gap: '0.625rem', marginTop: '1.5rem' }}>
                <button type="submit" disabled={receivePO.isPending || receiveForm.every(i => i.received_qty_now === 0)} className="btn btn-primary" style={{ flex: 1 }}>
                  {receivePO.isPending ? 'Processing…' : 'Confirm Receipt'}
                </button>
                <button type="button" onClick={() => setReceivingPO(null)} className="btn btn-ghost" style={{ flex: 1 }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
