import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Pencil, X, Tag, Archive, ArchiveRestore, Package } from 'lucide-react'
import { useForm } from 'react-hook-form'
import api from '../api/axios'
import useAuthStore from '../store/authStore'
import Pagination from '../components/Pagination'
import FormField, { getErrorMessage } from '../components/FormField'

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
  const [newCat,         setNewCat]         = useState('')
  const [showCatInput,   setShowCatInput]   = useState(false)

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: emptyForm
  })

  const showArchived = tab === 'archived'
  const showLow      = tab === 'low'
  const resetPage    = useCallback(() => setPage(1), [])

  const buildParams = () => {
    const p = new URLSearchParams()
    p.set('page', page); p.set('page_size', PAGE_SIZE)
    if (search)         p.set('search',    search)
    if (categoryFilter) p.set('category',  categoryFilter)
    if (showArchived)   p.set('archived',  'true')
    if (showLow)        p.set('low_stock', 'true')
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
    mutationFn: d => editing ? api.patch(`/products/${editing.id}/`, d) : api.post('/products/', d),
    onSuccess:  () => { qc.invalidateQueries(['products']); closeForm() },
  })
  const toggleArchive = useMutation({
    mutationFn: ({ id, is_active }) => api.patch(`/products/${id}/`, { is_active }),
    onSuccess:  () => qc.invalidateQueries(['products']),
  })
  const addCategory = useMutation({
    mutationFn: name => api.post('/categories/', { name }),
    onSuccess:  res => {
      qc.invalidateQueries(['categories'])
      setValue('category', res.data.id)
      setNewCat(''); setShowCatInput(false)
    },
  })

  const onSubmit = (data) => {
    save.mutate(data)
  }

  const closeForm = () => { setShowForm(false); setEditing(null); reset(emptyForm); setNewCat(''); setShowCatInput(false) }
  const openEdit  = p => { 
    setEditing(p)
    reset({ 
      name: p.name, 
      category: p.category ?? '', 
      unit: p.unit ?? '', 
      cost_price: p.cost_price, 
      selling_price: p.selling_price, 
      reorder_level: p.reorder_level 
    })
    setShowForm(true) 
  }

  const tabs = [
    { key: 'all',      label: 'All Products', color: 'var(--blue)'  },
    { key: 'low',      label: 'Low Stock',    color: 'var(--amber)' },
    { key: 'archived', label: 'Archived',     color: '#64748b'      },
  ]

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-subtitle">{totalCount} {showArchived ? 'archived' : showLow ? 'low stock' : 'active'} product{totalCount !== 1 ? 's' : ''}</p>
        </div>
        {user?.role === 'admin' && (
          <button onClick={() => setShowForm(true)} className="btn btn-primary interactive-item">
            <Plus size={15} /> Add Product
          </button>
        )}
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.875rem', padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 200, background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: '8px', padding: '0.55rem 0.875rem', boxShadow: 'var(--shadow-sm)' }}>
            <Search size={14} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
            <input type="text" placeholder="Search by name, SKU or category…"
              style={{ flex: 1, fontSize: '0.845rem', outline: 'none', background: 'transparent', color: 'var(--text)', border: 'none', fontFamily: 'Inter, sans-serif' }}
              value={search} onChange={e => { setSearch(e.target.value); resetPage() }} />
            {search && <button onClick={() => { setSearch(''); resetPage() }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex' }}><X size={13} /></button>}
          </div>

          {!showArchived && !showLow && (
            <select className="input" style={{ width: 'auto', minWidth: 155 }}
              value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); resetPage() }}>
              <option value="">All categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}

          <div style={{ display: 'flex', gap: '0.25rem', background: '#f1f5f9', borderRadius: '8px', padding: '3px' }}>
            {tabs.map(({ key, label, color }) => (
              <button key={key} onClick={() => { setTab(key); resetPage() }} className={`tab-button ${tab === key ? 'active' : ''}`} style={{
                color: tab === key ? color : 'var(--text-3)',
                display: 'flex', alignItems: 'center', gap: '0.35rem',
              }}>
                {key === 'archived' && <Archive size={12} />}
                {label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 160 }}><div className="spinner" /></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr><th>Product</th><th>SKU</th><th>Category</th><th>Unit</th><th>In Stock</th><th>Cost</th><th>Selling Price</th><th>Status</th>{user?.role === 'admin' && <th></th>}</tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                        <div style={{ width: 30, height: 30, borderRadius: '8px', background: 'var(--blue-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Package size={13} style={{ color: 'var(--blue)' }} />
                        </div>
                        <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.875rem' }}>{p.name}</span>
                      </div>
                    </td>
                    <td><span className="mono" style={{ fontSize: '0.775rem', color: 'var(--text-3)', background: '#f1f5f9', padding: '0.15rem 0.5rem', borderRadius: '5px' }}>{p.sku}</span></td>
                    <td>{p.category_name ? <span className="badge badge-blue">{p.category_name}</span> : <span style={{ color: 'var(--text-3)', fontSize: '0.8rem' }}>—</span>}</td>
                    <td style={{ fontSize: '0.845rem', color: 'var(--text-2)' }}>{p.unit || '—'}</td>
                    <td>
                      <span className="mono" style={{ fontWeight: 700, color: p.is_low_stock ? 'var(--red)' : 'var(--text)', fontSize: '0.875rem' }}>{p.stock_quantity}</span>
                      {p.is_low_stock && <span className="badge badge-red" style={{ marginLeft: '0.5rem' }}>Low</span>}
                    </td>
                    <td className="mono" style={{ fontSize: '0.845rem', color: 'var(--text-2)' }}>GHS {Number(p.cost_price).toFixed(2)}</td>
                    <td className="mono" style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.875rem' }}>GHS {Number(p.selling_price).toFixed(2)}</td>
                    <td><span className={`badge ${p.is_active ? 'badge-green' : 'badge-gray'}`}>{p.is_active ? 'Active' : 'Archived'}</span></td>
                    {user?.role === 'admin' && (
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          {!showArchived && <button onClick={() => openEdit(p)} className="btn btn-ghost btn-sm interactive-item"><Pencil size={11} /> Edit</button>}
                          <button onClick={() => toggleArchive.mutate({ id: p.id, is_active: showArchived })} className="btn btn-ghost btn-sm interactive-item" style={{ color: showArchived ? 'var(--green)' : 'var(--text-3)' }}>
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
          <div className="modal" style={{ maxWidth: '34rem' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.375rem' }}>
              <h3 className="modal-title" style={{ margin: 0 }}>{editing ? 'Edit Product' : 'Add Product'}</h3>
              <button onClick={closeForm} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="form-group" noValidate>
              <FormField label="Product Name" required error={errors.name?.message}>
                <input 
                  className={`input ${errors.name ? 'input-error' : ''}`}
                  placeholder="e.g. Milo 500g" 
                  {...register('name', { required: 'Name is required', maxLength: { value: 100, message: 'Max 100 characters' } })} 
                />
              </FormField>

              <FormField label="Category" error={errors.category?.message}>
                {!showCatInput ? (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <select className={`input ${errors.category ? 'input-error' : ''}`} style={{ flex: 1 }} {...register('category')}>
                      <option value="">— No category —</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <button type="button" onClick={() => setShowCatInput(true)} className="btn btn-ghost btn-sm interactive-item" style={{ flexShrink: 0 }}><Tag size={12} /> New</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input autoFocus className="input" style={{ flex: 1 }} placeholder="Category name" value={newCat} onChange={e => setNewCat(e.target.value)} />
                    <button type="button" disabled={!newCat.trim() || addCategory.isPending} onClick={() => addCategory.mutate(newCat.trim())} className="btn btn-primary btn-sm interactive-item">{addCategory.isPending ? '…' : 'Add'}</button>
                    <button type="button" onClick={() => { setShowCatInput(false); setNewCat('') }} className="btn btn-ghost btn-sm interactive-item"><X size={13} /></button>
                  </div>
                )}
              </FormField>

              <FormField label="Unit of Measurement" error={errors.unit?.message} hint="How you count this product when selling or restocking.">
                <input 
                  className={`input ${errors.unit ? 'input-error' : ''}`}
                  placeholder="e.g. bottle, kg, sachet, piece" 
                  {...register('unit', { maxLength: { value: 50, message: 'Max 50 characters' } })} 
                />
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Cost Price (GHS)" required error={errors.cost_price?.message}>
                  <input 
                    type="number" step="0.01" 
                    className={`input ${errors.cost_price ? 'input-error' : ''}`}
                    placeholder="0.00" 
                    {...register('cost_price', { 
                      required: 'Required', 
                      min: { value: 0, message: 'Min 0' },
                      valueAsNumber: true 
                    })} 
                  />
                </FormField>
                <FormField label="Selling Price (GHS)" required error={errors.selling_price?.message}>
                  <input 
                    type="number" step="0.01" 
                    className={`input ${errors.selling_price ? 'input-error' : ''}`}
                    placeholder="0.00" 
                    {...register('selling_price', { 
                      required: 'Required', 
                      min: { value: 0, message: 'Min 0' },
                      valueAsNumber: true 
                    })} 
                  />
                </FormField>
              </div>

              <FormField label="Reorder Level" error={errors.reorder_level?.message} hint="Alert triggers when stock drops to or below this number.">
                <input 
                  type="number" 
                  className={`input ${errors.reorder_level ? 'input-error' : ''}`}
                  {...register('reorder_level', { 
                    min: { value: 0, message: 'Min 0' },
                    valueAsNumber: true 
                  })} 
                />
              </FormField>

              {save.error && (
                <div className="alert alert-red" style={{ fontSize: '0.845rem', padding: '0.75rem 1rem' }}>
                  {getErrorMessage(save.error)}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.625rem', paddingTop: '0.25rem' }}>
                <button type="submit" disabled={save.isPending} className="btn btn-primary" style={{ flex: 1 }}>{save.isPending ? 'Saving…' : 'Save Product'}</button>
                <button type="button" onClick={closeForm} className="btn btn-ghost" style={{ flex: 1 }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}