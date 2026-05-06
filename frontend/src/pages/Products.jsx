import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Pencil, X, Tag, Archive, ArchiveRestore } from 'lucide-react'
import api from '../api/axios'
import useAuthStore from '../store/authStore'
import Pagination from '../components/Pagination'

const PAGE_SIZE = 25
const emptyForm = { name: '', category: '', unit: '', cost_price: '', selling_price: '', reorder_level: 10 }

export default function Products() {
  const { user } = useAuthStore()
  const qc = useQueryClient()

  const [search,         setSearch]         = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [tab,            setTab]            = useState('all')
  const [page,           setPage]           = useState(1)
  const [showForm,       setShowForm]       = useState(false)
  const [editing,        setEditing]        = useState(null)
  const [form,           setForm]           = useState(emptyForm)
  const [newCat,         setNewCat]         = useState('')
  const [showCatInput,   setShowCatInput]   = useState(false)

  const showArchived = tab === 'archived'
  const showLow      = tab === 'low'
  const resetPage    = useCallback(() => setPage(1), [])

  const buildParams = () => {
    const p = new URLSearchParams()
    p.set('page',      page)
    p.set('page_size', PAGE_SIZE)
    if (search)         p.set('search',   search)
    if (categoryFilter) p.set('category', categoryFilter)
    if (showArchived)   p.set('archived', 'true')
    if (showLow)        p.set('low_stock','true')
    return p.toString()
  }

  const { data, isLoading } = useQuery({
    queryKey: ['products', search, categoryFilter, tab, page],
    queryFn:  () => api.get(`/products/?${buildParams()}`).then(r => r.data),
    keepPreviousData: true,
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn:  () => api.get('/categories/').then(r => r.data?.results ?? r.data),
  })

  const products   = data?.results    ?? []
  const totalPages = data?.total_pages ?? 1
  const totalCount = data?.count       ?? 0

  const save = useMutation({
    mutationFn: (d) => editing ? api.patch(`/products/${editing.id}/`, d) : api.post('/products/', d),
    onSuccess:  () => { qc.invalidateQueries(['products']); closeForm() },
  })
  const toggleArchive = useMutation({
    mutationFn: ({ id, is_active }) => api.patch(`/products/${id}/`, { is_active }),
    onSuccess:  () => qc.invalidateQueries(['products']),
  })
  const addCategory = useMutation({
    mutationFn: (name) => api.post('/categories/', { name }),
    onSuccess:  (res) => {
      qc.invalidateQueries(['categories'])
      setForm(f => ({ ...f, category: res.data.id }))
      setNewCat(''); setShowCatInput(false)
    },
  })

  const closeForm = () => { setShowForm(false); setEditing(null); setForm(emptyForm); setNewCat(''); setShowCatInput(false) }
  const openEdit  = (p) => {
    setEditing(p)
    setForm({ name: p.name, category: p.category ?? '', unit: p.unit, cost_price: p.cost_price, selling_price: p.selling_price, reorder_level: p.reorder_level })
    setShowForm(true)
  }
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleTabChange = (key) => { setTab(key); resetPage() }
  const handleSearch    = (val)  => { setSearch(val); resetPage() }
  const handleCategory  = (val)  => { setCategoryFilter(val); resetPage() }

  const tabs = [
    { key: 'all',      label: 'All',       color: 'var(--blue)'   },
    { key: 'low',      label: 'Low Stock', color: 'var(--amber)'  },
    { key: 'archived', label: 'Archived',  color: 'var(--text-3)' },
  ]

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-subtitle">
            {totalCount} {showArchived ? 'archived' : showLow ? 'low stock' : 'active'} product{totalCount !== 1 ? 's' : ''}
          </p>
        </div>
        {user?.role === 'admin' && (
          <button onClick={() => setShowForm(true)} className="btn btn-primary">
            <Plus size={15} /> Add Product
          </button>
        )}
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.875rem', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flex: 1, minWidth: 200, background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: '8px', padding: '0.6rem 0.875rem' }}>
            <Search size={14} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
            <input
              type="text" placeholder="Search by name, SKU or category…"
              style={{ flex: 1, fontSize: '0.845rem', outline: 'none', background: 'transparent', color: 'var(--text)', border: 'none', fontFamily: 'DM Sans, sans-serif' }}
              value={search} onChange={e => handleSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => handleSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex' }}>
                <X size={13} />
              </button>
            )}
          </div>

          {!showArchived && !showLow && (
            <select
              className="input"
              style={{ width: 'auto', minWidth: 150 }}
              value={categoryFilter}
              onChange={e => handleCategory(e.target.value)}
            >
              <option value="">All categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}

          <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--bg-2)', padding: '0.25rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
            {tabs.map(({ key, label, color }) => (
              <button key={key} onClick={() => handleTabChange(key)} style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.42rem 0.875rem', borderRadius: '8px',
                fontSize: '0.8rem', fontWeight: 600, border: 'none', cursor: 'pointer',
                transition: 'all 0.14s',
                background: tab === key ? 'var(--surface-3)' : 'transparent',
                color:      tab === key ? color : 'var(--text-3)',
              }}>
                {key === 'archived' && <Archive size={12} />}
                {label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 160 }}>
            <div className="spinner" />
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th><th>SKU</th><th>Category</th><th>Unit</th>
                  <th>In Stock</th><th>Cost</th><th>Selling Price</th><th>Status</th>
                  {user?.role === 'admin' && <th></th>}
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text)' }}>{p.name}</td>
                    <td><span className="mono" style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>{p.sku}</span></td>
                    <td>
                      {p.category_name
                        ? <span className="badge badge-blue">{p.category_name}</span>
                        : <span style={{ color: 'var(--text-3)', fontSize: '0.78rem', fontStyle: 'italic' }}>None</span>}
                    </td>
                    <td style={{ fontSize: '0.845rem' }}>{p.unit || <span style={{ color: 'var(--text-3)' }}>—</span>}</td>
                    <td>
                      <span className="mono" style={{ fontWeight: 700, color: p.is_low_stock ? 'var(--red)' : 'var(--text)' }}>{p.stock_quantity}</span>
                      {p.is_low_stock && <span className="badge badge-red" style={{ marginLeft: '0.5rem' }}>Low</span>}
                    </td>
                    <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.845rem' }}>GH₵ {Number(p.cost_price).toFixed(2)}</td>
                    <td style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: 'var(--text)' }}>GH₵ {Number(p.selling_price).toFixed(2)}</td>
                    <td><span className={`badge ${p.is_active ? 'badge-teal' : 'badge-gray'}`}>{p.is_active ? 'Active' : 'Archived'}</span></td>
                    {user?.role === 'admin' && (
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {!showArchived && (
                            <button onClick={() => openEdit(p)} className="btn btn-ghost btn-sm"><Pencil size={11} /> Edit</button>
                          )}
                          <button
                            onClick={() => toggleArchive.mutate({ id: p.id, is_active: showArchived })}
                            className="btn btn-ghost btn-sm"
                            style={{ color: showArchived ? 'var(--green)' : 'var(--text-3)' }}
                          >
                            {showArchived ? <><ArchiveRestore size={11} /> Restore</> : <Archive size={11} />}
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-3)', fontSize: '0.875rem' }}>
                    {showArchived ? 'No archived products.' : search ? `No products matching "${search}".` : 'No products found.'}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <Pagination page={page} totalPages={totalPages} count={totalCount} pageSize={PAGE_SIZE} onPage={setPage} />
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={closeForm}>
          <div className="modal" style={{ maxWidth: '32rem' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h3 className="modal-title" style={{ margin: 0 }}>{editing ? 'Edit Product' : 'Add Product'}</h3>
              <button onClick={closeForm} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <form onSubmit={e => { e.preventDefault(); save.mutate(form) }} className="form-group">
              <div>
                <label className="label">Product Name *</label>
                <input required className="input" placeholder="e.g. Milo 500g" value={form.name} onChange={e => set('name', e.target.value)} />
              </div>
              <div>
                <label className="label">Product Category</label>
                {!showCatInput ? (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <select className="input" style={{ flex: 1 }} value={form.category} onChange={e => set('category', e.target.value)}>
                      <option value="">— No category —</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <button type="button" onClick={() => setShowCatInput(true)} className="btn btn-ghost btn-sm" style={{ flexShrink: 0 }}>
                      <Tag size={12} /> New
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input autoFocus className="input" style={{ flex: 1 }} placeholder="Category name" value={newCat} onChange={e => setNewCat(e.target.value)} />
                    <button type="button" disabled={!newCat.trim() || addCategory.isPending} onClick={() => addCategory.mutate(newCat.trim())} className="btn btn-primary btn-sm" style={{ flexShrink: 0 }}>
                      {addCategory.isPending ? '…' : 'Add'}
                    </button>
                    <button type="button" onClick={() => { setShowCatInput(false); setNewCat('') }} className="btn btn-ghost btn-sm"><X size={13} /></button>
                  </div>
                )}
              </div>
              <div>
                <label className="label">Unit of Measurement</label>
                <input className="input" placeholder="e.g. bottle, kg, sachet, piece" value={form.unit} onChange={e => set('unit', e.target.value)} />
                <p className="hint">How you count this product when selling or restocking.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Cost Price (GH₵) *</label>
                  <input required type="number" step="0.01" min="0" className="input" placeholder="0.00" value={form.cost_price} onChange={e => set('cost_price', e.target.value)} />
                </div>
                <div>
                  <label className="label">Selling Price (GH₵) *</label>
                  <input required type="number" step="0.01" min="0" className="input" placeholder="0.00" value={form.selling_price} onChange={e => set('selling_price', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="label">Reorder Level</label>
                <input type="number" min="0" className="input" value={form.reorder_level} onChange={e => set('reorder_level', e.target.value)} />
                <p className="hint">Low-stock alert triggers when quantity drops to or below this number.</p>
              </div>
              {save.error && (
                <p style={{ color: 'var(--red)', fontSize: '0.845rem', background: 'var(--red-dim)', border: '1px solid rgba(255,82,82,0.2)', borderRadius: '8px', padding: '0.7rem 1rem' }}>
                  {JSON.stringify(save.error.response?.data)}
                </p>
              )}
              <div style={{ display: 'flex', gap: '0.625rem', paddingTop: '0.25rem' }}>
                <button type="submit" disabled={save.isPending} className="btn btn-primary" style={{ flex: 1 }}>
                  {save.isPending ? 'Saving…' : 'Save Product'}
                </button>
                <button type="button" onClick={closeForm} className="btn btn-ghost" style={{ flex: 1 }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}