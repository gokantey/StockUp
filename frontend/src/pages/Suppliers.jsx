import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, X, Truck, Pencil, Trash2, AlertTriangle, Phone, Mail, MapPin } from 'lucide-react'
import api from '../api/axios'

const emptyForm = { name: '', contact_person: '', phone: '', email: '', address: '' }

function Avatar({ name }) {
  const initials = name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?'
  return (
    <div style={{ width: 34, height: 34, borderRadius: '9px', background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.7rem', fontWeight: 800, color: 'var(--teal)', fontFamily: 'DM Sans, sans-serif' }}>
      {initials}
    </div>
  )
}

export default function Suppliers() {
  const qc = useQueryClient()
  const [showForm,       setShowForm]       = useState(false)
  const [editing,        setEditing]        = useState(null)
  const [form,           setForm]           = useState(emptyForm)
  const [confirmDelete,  setConfirmDelete]  = useState(null)

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn:  () => api.get('/suppliers/').then(r => r.data?.results ?? r.data),
  })

  const save = useMutation({
    mutationFn: (data) => editing ? api.patch(`/suppliers/${editing.id}/`, data) : api.post('/suppliers/', data),
    onSuccess:  () => { qc.invalidateQueries(['suppliers']); closeForm() },
  })
  const remove = useMutation({
    mutationFn: (id) => api.delete(`/suppliers/${id}/`),
    onSuccess:  () => { qc.invalidateQueries(['suppliers']); setConfirmDelete(null) },
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const openEdit  = (s) => { setEditing(s); setForm({ name: s.name, contact_person: s.contact_person, phone: s.phone, email: s.email, address: s.address }); setShowForm(true) }
  const closeForm = () => { setShowForm(false); setEditing(null); setForm(emptyForm) }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Suppliers</h1>
          <p className="page-subtitle">{suppliers.length} registered supplier{suppliers.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn btn-primary">
          <Plus size={15} /> Add Supplier
        </button>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 140 }}><div className="spinner" /></div>
        ) : (
          <table className="table">
            <thead>
              <tr><th>Supplier</th><th>Contact Person</th><th>Phone</th><th>Email</th><th>Address</th><th></th></tr>
            </thead>
            <tbody>
              {suppliers.map(s => (
                <tr key={s.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <Avatar name={s.name} />
                      <span style={{ fontWeight: 600, color: 'var(--text)' }}>{s.name}</span>
                    </div>
                  </td>
                  <td>{s.contact_person || <span style={{ color: 'var(--text-3)', fontStyle: 'italic' }}>—</span>}</td>
                  <td>
                    {s.phone
                      ? <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.835rem' }}><Phone size={12} style={{ color: 'var(--text-3)' }} />{s.phone}</span>
                      : <span style={{ color: 'var(--text-3)', fontStyle: 'italic' }}>—</span>}
                  </td>
                  <td>
                    {s.email
                      ? <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.835rem' }}><Mail size={12} style={{ color: 'var(--text-3)' }} />{s.email}</span>
                      : <span style={{ color: 'var(--text-3)', fontStyle: 'italic' }}>—</span>}
                  </td>
                  <td>
                    {s.address
                      ? <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.835rem', maxWidth: 180 }}><MapPin size={12} style={{ color: 'var(--text-3)', flexShrink: 0 }} /><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.address}</span></span>
                      : <span style={{ color: 'var(--text-3)', fontStyle: 'italic' }}>—</span>}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button onClick={() => openEdit(s)} className="btn btn-ghost btn-sm"><Pencil size={12} /> Edit</button>
                      <button onClick={() => setConfirmDelete(s)} className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }}><Trash2 size={12} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {suppliers.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', color: 'var(--text-3)' }}>
                      <Truck size={32} strokeWidth={1.2} style={{ marginBottom: '0.875rem' }} />
                      <p style={{ fontSize: '0.875rem' }}>No suppliers yet. Add your first one.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={closeForm}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h3 className="modal-title" style={{ margin: 0 }}>{editing ? 'Edit Supplier' : 'Add Supplier'}</h3>
              <button onClick={closeForm} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <form onSubmit={e => { e.preventDefault(); save.mutate(form) }} className="form-group">
              <div>
                <label className="label">Supplier Name *</label>
                <input required className="input" placeholder="e.g. Accra Distributors Ltd" value={form.name} onChange={e => set('name', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Contact Person</label>
                  <input className="input" placeholder="Full name" value={form.contact_person} onChange={e => set('contact_person', e.target.value)} />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input className="input" placeholder="0XX XXX XXXX" value={form.phone} onChange={e => set('phone', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="label">Email</label>
                <input type="email" className="input" placeholder="supplier@example.com" value={form.email} onChange={e => set('email', e.target.value)} />
              </div>
              <div>
                <label className="label">Address</label>
                <textarea className="input" rows={2} placeholder="Optional" value={form.address} onChange={e => set('address', e.target.value)} />
              </div>
              {save.error && (
                <p style={{ color: 'var(--red)', fontSize: '0.845rem', background: 'var(--red-dim)', borderRadius: '8px', padding: '0.7rem 1rem' }}>
                  {JSON.stringify(save.error.response?.data)}
                </p>
              )}
              <div style={{ display: 'flex', gap: '0.625rem' }}>
                <button type="submit" disabled={save.isPending} className="btn btn-primary" style={{ flex: 1 }}>
                  {save.isPending ? 'Saving…' : editing ? 'Save Changes' : 'Add Supplier'}
                </button>
                <button type="button" onClick={closeForm} className="btn btn-ghost" style={{ flex: 1 }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal" style={{ maxWidth: '26rem' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '1.125rem' }}>
              <div style={{ width: 38, height: 38, borderRadius: '9px', background: 'var(--red-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <AlertTriangle size={17} style={{ color: 'var(--red)' }} />
              </div>
              <h3 className="modal-title" style={{ margin: 0 }}>Remove Supplier?</h3>
            </div>
            <p style={{ fontSize: '0.845rem', color: 'var(--text-3)', marginBottom: '1.5rem', lineHeight: 1.65 }}>
              Remove <strong style={{ color: 'var(--text)' }}>{confirmDelete.name}</strong>? Past stock-in records are preserved.
            </p>
            <div style={{ display: 'flex', gap: '0.625rem' }}>
              <button onClick={() => remove.mutate(confirmDelete.id)} disabled={remove.isPending} className="btn btn-danger" style={{ flex: 1 }}>
                {remove.isPending ? 'Removing…' : 'Yes, Remove'}
              </button>
              <button onClick={() => setConfirmDelete(null)} className="btn btn-ghost" style={{ flex: 1 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}