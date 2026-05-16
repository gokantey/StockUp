import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, X, Truck, Pencil, Trash2, AlertTriangle, Phone, Mail, MapPin } from 'lucide-react'
import { useForm } from 'react-hook-form'
import api from '../api/axios'
import FormField, { getErrorMessage } from '../components/FormField'

const emptyForm = { name: '', contact_person: '', phone: '', email: '', address: '' }

function Avatar({ name }) {
  const initials = name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?'
  return (
    <div style={{ width: 34, height: 34, borderRadius: '9px', background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.7rem', fontWeight: 800, color: 'var(--teal)', fontFamily: 'Outfit, sans-serif' }}>
      {initials}
    </div>
  )
}

export default function Suppliers() {
  const qc = useQueryClient()
  const [showForm,       setShowForm]       = useState(false)
  const [editing,        setEditing]        = useState(null)
  const [confirmDelete,  setConfirmDelete]  = useState(null)

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    defaultValues: emptyForm
  })

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

  const onSubmit = (data) => {
    save.mutate(data)
  }

  const openEdit  = (s) => {
    setEditing(s)
    reset({ name: s.name, contact_person: s.contact_person, phone: s.phone, email: s.email, address: s.address })
    setShowForm(true)
  }
  const closeForm = () => { setShowForm(false); setEditing(null); reset(emptyForm) }

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
                      <button onClick={() => openEdit(s)} className="btn btn-ghost btn-sm interactive-item"><Pencil size={12} /> Edit</button>
                      <button onClick={() => setConfirmDelete(s)} className="btn btn-ghost btn-sm interactive-item" style={{ color: 'var(--red)' }}><Trash2 size={12} /></button>
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
            <form onSubmit={handleSubmit(onSubmit)} className="form-group" noValidate>
              <FormField label="Supplier Name" required error={errors.name?.message}>
                <input 
                  className={`input ${errors.name ? 'input-error' : ''}`}
                  placeholder="e.g. Accra Distributors Ltd" 
                  {...register('name', { required: 'Name is required', maxLength: { value: 100, message: 'Max 100 characters' } })} 
                />
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Contact Person" error={errors.contact_person?.message}>
                  <input 
                    className={`input ${errors.contact_person ? 'input-error' : ''}`}
                    placeholder="Full name" 
                    {...register('contact_person', { maxLength: { value: 100, message: 'Max 100 characters' } })} 
                  />
                </FormField>
                <FormField label="Phone" error={errors.phone?.message}>
                  <input 
                    className={`input ${errors.phone ? 'input-error' : ''}`}
                    placeholder="0XX XXX XXXX" 
                    {...register('phone', { 
                      pattern: { value: /^[0-9+ ]+$/, message: 'Invalid phone number' },
                      maxLength: { value: 20, message: 'Max 20 characters' }
                    })} 
                  />
                </FormField>
              </div>

              <FormField label="Email" error={errors.email?.message}>
                <input 
                  type="email" 
                  className={`input ${errors.email ? 'input-error' : ''}`}
                  placeholder="supplier@example.com" 
                  {...register('email', { 
                    pattern: { value: /^\S+@\S+$/, message: 'Invalid email address' },
                    maxLength: { value: 100, message: 'Max 100 characters' }
                  })} 
                />
              </FormField>

              <FormField label="Address" error={errors.address?.message}>
                <textarea 
                  className={`input ${errors.address ? 'input-error' : ''}`}
                  rows={2} 
                  placeholder="Optional" 
                  {...register('address', { maxLength: { value: 255, message: 'Max 255 characters' } })} 
                />
              </FormField>

              {save.error && (
                <div className="alert alert-red" style={{ fontSize: '0.845rem', padding: '0.75rem 1rem' }}>
                  {getErrorMessage(save.error)}
                </div>
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