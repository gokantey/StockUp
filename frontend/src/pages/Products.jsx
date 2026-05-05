import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Pencil, X, Tag, Archive, ArchiveRestore } from 'lucide-react'
import api from '../api/axios'
import useAuthStore from '../store/authStore'

const emptyForm = { name: '', category: '', unit: '', cost_price: '', selling_price: '', reorder_level: 10 }

export default function Products() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [newCat, setNewCat] = useState('')
  const [showCatInput, setShowCatInput] = useState(false)

  const showArchived = tab === 'archived'

  const { data: allProducts = [], isLoading } = useQuery({
    queryKey: ['products', search, showArchived],
    queryFn: () => api.get(`/products/?search=${search}${showArchived ? '&archived=true' : ''}`).then((r) => r.data),
  })
  const { data: categories = [], refetch: refetchCats } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories/').then((r) => r.data),
  })

  const products = tab === 'low' ? allProducts.filter((p) => p.is_low_stock) : allProducts
  const lowCount = allProducts.filter((p) => p.is_low_stock).length

  const save = useMutation({
    mutationFn: (data) => editing ? api.patch(`/products/${editing.id}/`, data) : api.post('/products/', data),
    onSuccess: () => { qc.invalidateQueries(['products']); closeForm() },
  })

  const toggleArchive = useMutation({
    mutationFn: ({ id, is_active }) => api.patch(`/products/${id}/`, { is_active }),
    onSuccess: () => qc.invalidateQueries(['products']),
  })

  const addCategory = useMutation({
    mutationFn: (name) => api.post('/categories/', { name }),
    onSuccess: (res) => {
      refetchCats()
      setForm((f) => ({ ...f, category: res.data.id }))
      setNewCat('')
      setShowCatInput(false)
    },
  })

  const closeForm = () => { setShowForm(false); setEditing(null); setForm(emptyForm); setNewCat(''); setShowCatInput(false) }

  const openEdit = (p) => {
    setEditing(p)
    setForm({ name: p.name, category: p.category ?? '', unit: p.unit, cost_price: p.cost_price, selling_price: p.selling_price, reorder_level: p.reorder_level })
    setShowForm(true)
  }

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Products</h1>
        {user?.role === 'admin' && (
          <button onClick={() => setShowForm(true)} className="btn btn-primary">
            <Plus size={15} /> Add Product
          </button>
        )}
      </div>

      <div className="card overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3" style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #f1f5f9' }}>
          <div className="flex items-center gap-2.5 flex-1 min-w-52 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
            <Search size={15} className="text-slate-400 flex-shrink-0" />
            <input
              type="text" placeholder="Search by name, SKU or group…"
              className="flex-1 text-sm outline-none bg-transparent text-slate-700 placeholder:text-slate-400"
              value={search} onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setTab('all')}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.5rem 1.125rem', borderRadius: '0.75rem',
                fontSize: '0.8125rem', fontWeight: 600, border: 'none', cursor: 'pointer',
                transition: 'all 0.15s',
                background: tab === 'all' ? 'linear-gradient(135deg,#3b82f6,#1d4ed8)' : '#f1f5f9',
                color: tab === 'all' ? '#fff' : '#64748b',
                boxShadow: tab === 'all' ? '0 2px 8px rgba(59,130,246,0.3)' : 'none',
              }}
            >
              All
              <span style={{
                background: tab === 'all' ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                color: tab === 'all' ? '#fff' : '#475569',
                borderRadius: '999px', padding: '0.1rem 0.5rem',
                fontSize: '0.72rem', fontWeight: 700,
              }}>{allProducts.length}</span>
            </button>

            <button
              onClick={() => setTab('low')}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.5rem 1.125rem', borderRadius: '0.75rem',
                fontSize: '0.8125rem', fontWeight: 600, border: 'none', cursor: 'pointer',
                transition: 'all 0.15s',
                background: tab === 'low' ? 'linear-gradient(135deg,#f59e0b,#d97706)' : '#f1f5f9',
                color: tab === 'low' ? '#fff' : '#64748b',
                boxShadow: tab === 'low' ? '0 2px 8px rgba(245,158,11,0.3)' : 'none',
              }}
            >
              Low Stock
              {lowCount > 0 && (
                <span style={{
                  background: tab === 'low' ? 'rgba(255,255,255,0.25)' : '#fef3c7',
                  color: tab === 'low' ? '#fff' : '#d97706',
                  borderRadius: '999px', padding: '0.1rem 0.5rem',
                  fontSize: '0.72rem', fontWeight: 700,
                }}>{lowCount}</span>
              )}
            </button>

            <button
              onClick={() => setTab('archived')}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.5rem 1.125rem', borderRadius: '0.75rem',
                fontSize: '0.8125rem', fontWeight: 600, border: 'none', cursor: 'pointer',
                transition: 'all 0.15s',
                background: tab === 'archived' ? 'linear-gradient(135deg,#64748b,#475569)' : '#f1f5f9',
                color: tab === 'archived' ? '#fff' : '#64748b',
                boxShadow: tab === 'archived' ? '0 2px 8px rgba(71,85,105,0.25)' : 'none',
              }}
            >
              <Archive size={13} /> Archived
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Group</th>
                  <th>Measured In</th>
                  <th>In Stock</th>
                  <th>Cost Price</th>
                  <th>Selling Price</th>
                  <th>Status</th>
                  {user?.role === 'admin' && <th></th>}
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td className="font-semibold text-slate-900">{p.name}</td>
                    <td className="font-mono text-xs text-slate-400">{p.sku}</td>
                    <td>
                      {p.category_name
                        ? <span className="badge badge-blue">{p.category_name}</span>
                        : <span className="text-slate-300 text-xs italic">Not grouped</span>}
                    </td>
                    <td className="text-slate-600 text-sm">{p.unit || <span className="text-slate-300 text-xs italic">—</span>}</td>
                    <td>
                      <span className={`font-bold ${p.is_low_stock ? 'text-red-600' : 'text-slate-800'}`}>{p.stock_quantity}</span>
                      {p.is_low_stock && <span className="badge badge-red ml-2">Low</span>}
                    </td>
                    <td className="text-slate-600">GH₵ {Number(p.cost_price).toFixed(2)}</td>
                    <td className="font-semibold text-slate-800">GH₵ {Number(p.selling_price).toFixed(2)}</td>
                    <td><span className={`badge ${p.is_active ? 'badge-teal' : 'badge-gray'}`}>{p.is_active ? 'Active' : 'Archived'}</span></td>
                    {user?.role === 'admin' && (
                      <td>
                        <div className="flex items-center gap-2">
                          {!showArchived && (
                            <button onClick={() => openEdit(p)} className="btn btn-ghost btn-sm">
                              <Pencil size={12} /> Edit
                            </button>
                          )}
                          <button
                            onClick={() => toggleArchive.mutate({ id: p.id, is_active: showArchived })}
                            className="btn btn-ghost btn-sm"
                            style={{ color: showArchived ? '#059669' : '#94a3b8' }}
                            title={showArchived ? 'Restore product' : 'Archive product'}
                          >
                            {showArchived ? <><ArchiveRestore size={12} /> Restore</> : <Archive size={12} />}
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr><td colSpan={9} className="text-center py-14 text-slate-400 text-sm">
                    {showArchived ? 'No archived products.' : 'No products found.'}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit modal */}
      {showForm && (
        <div className="modal-overlay" onClick={closeForm}>
          <div className="modal" style={{ maxWidth: '32rem' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="modal-title mb-0">{editing ? 'Edit Product' : 'Add New Product'}</h3>
              <button onClick={closeForm} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); save.mutate(form) }} className="form-group">

              <div>
                <label className="label">Product Name *</label>
                <input required className="input" placeholder="e.g. Milo 500g, Indomie Chicken" value={form.name} onChange={(e) => set('name', e.target.value)} />
              </div>

              {/* Category with inline creation */}
              <div>
                <label className="label">Product Group</label>
                <p className="hint mb-2">A group to organise similar products together, e.g. "Beverages", "Grains", "Toiletries".</p>
                {!showCatInput ? (
                  <div className="flex gap-2">
                    <select className="input flex-1" value={form.category} onChange={(e) => set('category', e.target.value)}>
                      <option value="">— No group —</option>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowCatInput(true)}
                      className="btn btn-ghost btn-sm flex-shrink-0"
                      title="Create a new group"
                    >
                      <Tag size={13} /> New
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      autoFocus
                      className="input flex-1"
                      placeholder="Group name, e.g. Beverages"
                      value={newCat}
                      onChange={(e) => setNewCat(e.target.value)}
                    />
                    <button
                      type="button"
                      disabled={!newCat.trim() || addCategory.isPending}
                      onClick={() => addCategory.mutate(newCat.trim())}
                      className="btn btn-primary btn-sm flex-shrink-0"
                    >
                      {addCategory.isPending ? '…' : 'Add'}
                    </button>
                    <button type="button" onClick={() => { setShowCatInput(false); setNewCat('') }} className="btn btn-ghost btn-sm flex-shrink-0">
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="label">Unit of Measurement</label>
                <input className="input" placeholder="e.g. bottle, kg, sachet, box, piece" value={form.unit} onChange={(e) => set('unit', e.target.value)} />
                <p className="hint">How you count this product when selling or restocking it.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Cost Price (GH₵) *</label>
                  <input required type="number" step="0.01" min="0" className="input" placeholder="0.00" value={form.cost_price} onChange={(e) => set('cost_price', e.target.value)} />
                  <p className="hint">What you paid the supplier</p>
                </div>
                <div>
                  <label className="label">Selling Price (GH₵) *</label>
                  <input required type="number" step="0.01" min="0" className="input" placeholder="0.00" value={form.selling_price} onChange={(e) => set('selling_price', e.target.value)} />
                  <p className="hint">What customers pay you</p>
                </div>
              </div>

              <div>
                <label className="label">Reorder Level</label>
                <input type="number" min="0" className="input" value={form.reorder_level} onChange={(e) => set('reorder_level', e.target.value)} />
                <p className="hint">You'll get a low-stock alert when quantity drops to or below this number.</p>
              </div>

              {save.error && <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{JSON.stringify(save.error.response?.data)}</p>}

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={save.isPending} className="btn btn-primary flex-1">
                  {save.isPending ? 'Saving…' : 'Save Product'}
                </button>
                <button type="button" onClick={closeForm} className="btn btn-ghost flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
