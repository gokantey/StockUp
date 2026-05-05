import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, X, Truck, Pencil, Trash2, AlertTriangle } from 'lucide-react'
import api from '../api/axios'

const emptyForm = { name: '', contact_person: '', phone: '', email: '', address: '' }

export default function Suppliers() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => api.get('/suppliers/').then((r) => r.data),
  })

  const save = useMutation({
    mutationFn: (data) => editing
      ? api.patch(`/suppliers/${editing.id}/`, data)
      : api.post('/suppliers/', data),
    onSuccess: () => {
      qc.invalidateQueries(['suppliers'])
      closeForm()
    },
  })

  const remove = useMutation({
    mutationFn: (id) => api.delete(`/suppliers/${id}/`),
    onSuccess: () => {
      qc.invalidateQueries(['suppliers'])
      setConfirmDelete(null)
    },
  })

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const openEdit = (s) => {
    setEditing(s)
    setForm({ name: s.name, contact_person: s.contact_person, phone: s.phone, email: s.email, address: s.address })
    setShowForm(true)
  }

  const closeForm = () => { setShowForm(false); setEditing(null); setForm(emptyForm) }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Suppliers</h1>
        <button onClick={() => setShowForm(true)} className="btn btn-primary">
          <Plus size={15} /> Add Supplier
        </button>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Supplier Name</th>
                <th>Contact Person</th>
                <th>Phone</th>
                <th>Email</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Truck size={14} className="text-slate-400" />
                      </div>
                      <span className="font-medium text-slate-900">{s.name}</span>
                    </div>
                  </td>
                  <td className="text-slate-500">{s.contact_person || '—'}</td>
                  <td className="text-slate-500">{s.phone || '—'}</td>
                  <td className="text-slate-500">{s.email || '—'}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(s)} className="btn btn-ghost btn-sm">
                        <Pencil size={12} /> Edit
                      </button>
                      <button
                        onClick={() => setConfirmDelete(s)}
                        className="btn btn-ghost btn-sm"
                        style={{ color: '#ef4444', borderColor: 'transparent' }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {suppliers.length === 0 && (
                <tr><td colSpan={5} className="text-center text-slate-400 text-sm" style={{ padding: '3rem' }}>No suppliers yet.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Add / Edit modal */}
      {showForm && (
        <div className="modal-overlay" onClick={closeForm}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between" style={{ marginBottom: '1.75rem' }}>
              <h3 className="modal-title" style={{ margin: 0 }}>{editing ? 'Edit Supplier' : 'Add Supplier'}</h3>
              <button onClick={closeForm} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); save.mutate(form) }} className="form-group">
              <div>
                <label className="label">Supplier Name *</label>
                <input required className="input" placeholder="e.g. Accra Distributors Ltd" value={form.name} onChange={(e) => set('name', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Contact Person</label>
                  <input className="input" placeholder="Full name" value={form.contact_person} onChange={(e) => set('contact_person', e.target.value)} />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input className="input" placeholder="0XX XXX XXXX" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="label">Email</label>
                <input type="email" className="input" placeholder="supplier@example.com" value={form.email} onChange={(e) => set('email', e.target.value)} />
              </div>
              <div>
                <label className="label">Address</label>
                <textarea className="input" rows={2} placeholder="Optional" value={form.address} onChange={(e) => set('address', e.target.value)} />
              </div>
              {save.error && <p className="text-red-500 text-xs">{JSON.stringify(save.error.response?.data)}</p>}
              <div className="flex gap-2">
                <button type="submit" disabled={save.isPending} className="btn btn-primary flex-1">
                  {save.isPending ? 'Saving…' : editing ? 'Save Changes' : 'Add Supplier'}
                </button>
                <button type="button" onClick={closeForm} className="btn btn-ghost flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3" style={{ marginBottom: '1.25rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: '0.875rem', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <AlertTriangle size={18} style={{ color: '#dc2626' }} />
              </div>
              <h3 className="modal-title" style={{ margin: 0 }}>Remove Supplier?</h3>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1.75rem', lineHeight: 1.6 }}>
              Are you sure you want to remove <strong>{confirmDelete.name}</strong>? They won't appear in future stock-in records, but past records are preserved.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => remove.mutate(confirmDelete.id)}
                disabled={remove.isPending}
                className="btn btn-danger flex-1"
              >
                {remove.isPending ? 'Removing…' : 'Yes, Remove'}
              </button>
              <button onClick={() => setConfirmDelete(null)} className="btn btn-ghost flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
