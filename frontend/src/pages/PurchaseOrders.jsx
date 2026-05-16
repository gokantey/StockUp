import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, X, FileText, CheckCircle, PackageCheck, Ban, Trash2, Printer } from 'lucide-react'
import api from '../api/axios'
import FormField, { getErrorMessage } from '../components/FormField'

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
      rejected_qty: item.rejected_qty,
      received_qty_now: 0,
      rejected_qty_now: 0,
      rejection_note_now: ''
    })))
  }

  const handleReceive = (e) => {
    e.preventDefault()
    receivePO.mutate({
      id: receivingPO.id,
      data: { items: receiveForm }
    })
  }

  const [viewInvoice, setViewInvoice] = useState(null)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Purchase Orders</h1>
          <p className="page-subtitle">{pos.length} PO{pos.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => { setPoForm({ supplier: '', expected_date: '', notes: '', status: 'ordered', items: [] }); setShowCreate(true) }} className="btn btn-primary interactive-item">
          <Plus size={15} /> Create Purchase Order
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
                      {po.items.reduce((acc, i) => acc + i.received_qty, 0)} / {po.items.reduce((acc, i) => acc + i.ordered_qty, 0)} accepted
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button onClick={() => setViewInvoice(po)} className="btn btn-ghost btn-sm interactive-item"><FileText size={12} /> Invoice</button>
                      {['ordered', 'partially_received'].includes(po.status) && (
                        <>
                          <button onClick={() => openReceive(po)} className="btn btn-primary btn-sm interactive-item"><PackageCheck size={12} /> Receive</button>
                          {po.status === 'ordered' && (
                            <button onClick={() => cancelPO.mutate(po.id)} className="btn btn-ghost btn-sm interactive-item" style={{ color: 'var(--red)' }}><Ban size={12} /> Cancel</button>
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

      {/* View Invoice Modal */}
      {viewInvoice && (
        <div className="modal-overlay" onClick={() => setViewInvoice(null)}>
          <div className="modal" style={{ maxWidth: '46rem', padding: 0, overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-2)' }}>
              <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700 }}>Purchase Order Document</h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => window.print()} className="btn btn-ghost btn-sm interactive-item"><Printer size={14} /> Print</button>
                <button onClick={() => setViewInvoice(null)} className="btn btn-ghost btn-sm interactive-item"><X size={14} /></button>
              </div>
            </div>
            
            <div style={{ padding: '3.5rem 3rem', background: '#fff' }} id="po-invoice">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3.5rem' }}>
                <div>
                  <img src="/rj.svg" alt="R&J" style={{ width: 50, height: 50, marginBottom: '1rem' }} />
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--navy)', margin: 0, letterSpacing: '-0.03em' }}>R&J PROVISIONS</h2>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginTop: '0.25rem' }}>Inventory Procurement Division</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#f1f5f9', margin: 0, lineHeight: 1 }}>INVOICE</h1>
                  <p style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--navy)', marginTop: '0.5rem' }}>{viewInvoice.po_number}</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', marginBottom: '3rem' }}>
                <div>
                  <p style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Supplier Information</p>
                  <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.25rem' }}>{viewInvoice.supplier_name || 'Generic Supplier'}</p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-2)', lineHeight: 1.6 }}>
                    Official procurement partner<br />
                    Accra, Ghana
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Order Details</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-2)' }}><strong>Date:</strong> {new Date(viewInvoice.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-2)' }}><strong>Expected:</strong> {viewInvoice.expected_date ? new Date(viewInvoice.expected_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Asap'}</p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-2)' }}><strong>Status:</strong> <span style={{ textTransform: 'uppercase', fontWeight: 700 }}>{viewInvoice.status.replace('_', ' ')}</span></p>
                  </div>
                </div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '3rem' }}>
                <thead>
                  <tr style={{ background: 'var(--navy)', color: '#fff' }}>
                    <th style={{ textAlign: 'left', padding: '0.875rem 1rem', fontSize: '0.75rem', textTransform: 'uppercase' }}>Product Description</th>
                    <th style={{ textAlign: 'center', padding: '0.875rem 1rem', fontSize: '0.75rem', textTransform: 'uppercase' }}>Ordered</th>
                    <th style={{ textAlign: 'center', padding: '0.875rem 1rem', fontSize: '0.75rem', textTransform: 'uppercase' }}>Accepted</th>
                    <th style={{ textAlign: 'right', padding: '0.875rem 1rem', fontSize: '0.75rem', textTransform: 'uppercase' }}>Unit Cost</th>
                    <th style={{ textAlign: 'right', padding: '0.875rem 1rem', fontSize: '0.75rem', textTransform: 'uppercase' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {viewInvoice.items.map((item, idx) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '1rem', fontSize: '0.9rem', fontWeight: 600 }}>{item.product_name}</td>
                      <td style={{ padding: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>{item.ordered_qty}</td>
                      <td style={{ padding: '1rem', textAlign: 'center', fontSize: '0.9rem', color: item.received_qty > 0 ? 'var(--green)' : 'var(--text-3)' }}>{item.received_qty}</td>
                      <td style={{ padding: '1rem', textAlign: 'right', fontSize: '0.9rem' }}>{Number(item.unit_cost).toFixed(2)}</td>
                      <td style={{ padding: '1rem', textAlign: 'right', fontSize: '0.9rem', fontWeight: 700 }}>{(item.ordered_qty * item.unit_cost).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ marginLeft: 'auto', maxWidth: '240px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-3)' }}>Subtotal</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>GHS {viewInvoice.items.reduce((sum, i) => sum + (i.ordered_qty * i.unit_cost), 0).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 0', borderTop: '2px solid var(--navy)', marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--navy)' }}>GRAND TOTAL</span>
                  <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--navy)' }}>GHS {viewInvoice.items.reduce((sum, i) => sum + (i.ordered_qty * i.unit_cost), 0).toFixed(2)}</span>
                </div>
              </div>

              {viewInvoice.notes && (
                <div style={{ marginTop: '4rem', padding: '1.5rem', background: '#f8fafc', borderRadius: '10px', borderLeft: '4px solid var(--navy)' }}>
                  <p style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Order Notes</p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-2)', lineHeight: 1.6 }}>{viewInvoice.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}


      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" style={{ maxWidth: '42rem' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h3 className="modal-title" style={{ margin: 0 }}>Create Purchase Order</h3>
              <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            
            <form onSubmit={handleCreate} className="form-group">
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Supplier">
                  <select className="input" value={poForm.supplier} onChange={e => setPoForm({ ...poForm, supplier: e.target.value })}>
                    <option value="">No Supplier</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </FormField>
                <FormField label="Expected Date">
                  <input type="date" className="input" value={poForm.expected_date} onChange={e => setPoForm({ ...poForm, expected_date: e.target.value })} />
                </FormField>
              </div>

              <FormField label="Notes">
                <textarea className="input" rows={2} value={poForm.notes} onChange={e => setPoForm({ ...poForm, notes: e.target.value })} />
              </FormField>

              <div style={{ marginTop: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <label className="label" style={{ margin: 0 }}>Order Items</label>
                  <button type="button" onClick={addPoItem} className="btn btn-ghost btn-sm interactive-item" style={{ padding: '0.2rem 0.5rem' }}><Plus size={14} /> Add Item</button>
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
                    <button type="button" onClick={() => removePoItem(i)} className="interactive-item" style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', padding: '0.5rem' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '0.625rem', marginTop: '1rem' }}>
                <button type="submit" disabled={createPO.isPending || poForm.items.length === 0} className="btn btn-primary interactive-item" style={{ flex: 1 }}>
                  {createPO.isPending ? 'Creating…' : 'Create PO'}
                </button>
                <button type="button" onClick={() => setShowCreate(false)} className="btn btn-ghost interactive-item" style={{ flex: 1 }}>Cancel</button>
              </div>
              {createPO.error && (
                <div className="alert alert-red" style={{ marginTop: '1rem' }}>
                  {getErrorMessage(createPO.error)}
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {receivingPO && (
        <div className="modal-overlay" onClick={() => setReceivingPO(null)}>
          <div className="modal" style={{ maxWidth: '44rem' }} onClick={e => e.stopPropagation()}>
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
                      <th>Accepted</th>
                      <th style={{ width: 90 }}>Receive</th>
                      <th style={{ width: 90 }}>Reject</th>
                      <th>Rejection Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receiveForm.map((item, i) => (
                      <tr key={item.id}>
                        <td style={{ fontSize: '0.8rem' }}>{item.product_name}</td>
                        <td style={{ fontSize: '0.8rem' }}>{item.ordered_qty}</td>
                        <td style={{ fontSize: '0.8rem', color: item.received_qty === item.ordered_qty ? 'var(--green)' : 'inherit' }}>{item.received_qty}</td>
                        <td>
                          {item.received_qty < item.ordered_qty ? (
                            <input
                              type="number" min="0"
                              className="input"
                              style={{ padding: '0.3rem 0.5rem', height: 'auto', fontSize: '0.8rem' }}
                              value={item.received_qty_now}
                              onChange={e => {
                                const val = parseInt(e.target.value) || 0
                                const newForm = [...receiveForm]
                                newForm[i].received_qty_now = val
                                setReceiveForm(newForm)
                              }}
                            />
                          ) : <CheckCircle size={14} style={{ color: 'var(--green)' }} />}
                        </td>
                        <td>
                          {item.received_qty < item.ordered_qty && (
                            <input
                              type="number" min="0"
                              className="input"
                              style={{ padding: '0.3rem 0.5rem', height: 'auto', fontSize: '0.8rem', borderColor: item.rejected_qty_now > 0 ? 'var(--red)' : 'var(--border)' }}
                              value={item.rejected_qty_now}
                              onChange={e => {
                                const val = parseInt(e.target.value) || 0
                                const newForm = [...receiveForm]
                                newForm[i].rejected_qty_now = val
                                setReceiveForm(newForm)
                              }}
                            />
                          )}
                        </td>
                        <td>
                          {item.received_qty < item.ordered_qty && item.rejected_qty_now > 0 && (
                            <input 
                              className="input" 
                              style={{ padding: '0.3rem 0.5rem', height: 'auto', fontSize: '0.75rem' }} 
                              placeholder="Reason..." 
                              value={item.rejection_note_now}
                              onChange={e => {
                                const newForm = [...receiveForm]
                                newForm[i].rejection_note_now = e.target.value
                                setReceiveForm(newForm)
                              }}
                            />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', gap: '0.625rem', marginTop: '1.5rem' }}>
                <button type="submit" disabled={receivePO.isPending || receiveForm.every(i => i.received_qty_now === 0 && i.rejected_qty_now === 0)} className="btn btn-primary interactive-item" style={{ flex: 1 }}>
                  {receivePO.isPending ? 'Processing…' : 'Confirm Reception'}
                </button>
                <button type="button" onClick={() => setReceivingPO(null)} className="btn btn-ghost interactive-item" style={{ flex: 1 }}>Cancel</button>
              </div>
              {receivePO.error && (
                <div className="alert alert-red" style={{ marginTop: '1rem' }}>
                  {getErrorMessage(receivePO.error)}
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
