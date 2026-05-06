import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, X, Pencil, Shield, User, AlertTriangle, Eye, EyeOff, KeyRound } from 'lucide-react'
import api from '../api/axios'
import useAuthStore from '../store/authStore'

const emptyForm = { full_name: '', email: '', password: '', role: 'staff' }

function Avatar({ name, role }) {
  const initials = name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?'
  const color    = role === 'admin' ? 'var(--teal)' : 'var(--blue)'
  return (
    <div style={{ width: 34, height: 34, borderRadius: '9px', flexShrink: 0, background: `${color}18`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800, color }}>
      {initials}
    </div>
  )
}

export default function Users() {
  const { user: me } = useAuthStore()
  const qc = useQueryClient()
  const [showForm,      setShowForm]      = useState(false)
  const [editing,       setEditing]       = useState(null)
  const [form,          setForm]          = useState(emptyForm)
  const [showPw,        setShowPw]        = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn:  () => api.get('/users/').then(r => r.data?.results ?? r.data),
  })

  const save = useMutation({
    mutationFn: (data) => {
      const payload = { ...data }
      if (!payload.password) delete payload.password
      return editing ? api.patch(`/users/${editing.id}/`, payload) : api.post('/users/', payload)
    },
    onSuccess: () => { qc.invalidateQueries(['users']); closeForm() },
  })

  const remove = useMutation({
    mutationFn: (id) => api.delete(`/users/${id}/`),
    onSuccess:  () => { qc.invalidateQueries(['users']); setConfirmDelete(null) },
  })

  const set       = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const openEdit  = (u) => { setEditing(u); setForm({ full_name: u.full_name, email: u.email, password: '', role: u.role }); setShowPw(false); setShowForm(true) }
  const closeForm = () => { setShowForm(false); setEditing(null); setForm(emptyForm); setShowPw(false) }

  const admins = users.filter(u => u.role === 'admin')
  const staff  = users.filter(u => u.role === 'staff')

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Users</h1>
          <p className="page-subtitle">{users.length} team member{users.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn btn-primary">
          <Plus size={15} /> Add User
        </button>
      </div>

      <div className="grid grid-cols-2" style={{ gap: '1rem', marginBottom: '1.5rem', maxWidth: 480 }}>
        <div style={{ background: 'var(--bg-3)', border: '1px solid rgba(0,212,170,0.18)', borderRadius: 'var(--radius-xl)', padding: '1.125rem 1.375rem', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div style={{ width: 34, height: 34, borderRadius: '9px', background: 'var(--teal-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Shield size={16} style={{ color: 'var(--teal)' }} />
          </div>
          <div>
            <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)', fontFamily: 'JetBrains Mono, monospace', lineHeight: 1 }}>{admins.length}</p>
            <p style={{ fontSize: '0.745rem', color: 'var(--text-3)', marginTop: '0.2rem' }}>Admin{admins.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div style={{ background: 'var(--bg-3)', border: '1px solid rgba(59,139,255,0.18)', borderRadius: 'var(--radius-xl)', padding: '1.125rem 1.375rem', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div style={{ width: 34, height: 34, borderRadius: '9px', background: 'var(--blue-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <User size={16} style={{ color: 'var(--blue)' }} />
          </div>
          <div>
            <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)', fontFamily: 'JetBrains Mono, monospace', lineHeight: 1 }}>{staff.length}</p>
            <p style={{ fontSize: '0.745rem', color: 'var(--text-3)', marginTop: '0.2rem' }}>Staff member{staff.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 140 }}><div className="spinner" /></div>
        ) : (
          <table className="table">
            <thead>
              <tr><th>User</th><th>Email</th><th>Role</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <Avatar name={u.full_name} role={u.role} />
                      <div>
                        <p style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.875rem' }}>
                          {u.full_name}
                          {u.id === me?.id && (
                            <span style={{ marginLeft: '0.4rem', fontSize: '0.65rem', fontWeight: 700, color: 'var(--teal)', background: 'var(--teal-dim)', borderRadius: '999px', padding: '0.08rem 0.45rem' }}>You</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: '0.845rem', color: 'var(--text-2)' }}>{u.email}</td>
                  <td>
                    <span className={`badge ${u.role === 'admin' ? 'badge-teal' : 'badge-blue'}`}>
                      {u.role === 'admin' ? <><Shield size={10} /> Admin</> : <><User size={10} /> Staff</>}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${u.is_active ? 'badge-green' : 'badge-gray'}`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button onClick={() => openEdit(u)} className="btn btn-ghost btn-sm"><Pencil size={12} /> Edit</button>
                      {u.id !== me?.id && (
                        <button onClick={() => setConfirmDelete(u)} className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }}>
                          <AlertTriangle size={12} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-3)', fontSize: '0.875rem' }}>No users found.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={closeForm}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h3 className="modal-title" style={{ margin: 0 }}>{editing ? 'Edit User' : 'Add User'}</h3>
              <button onClick={closeForm} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <form onSubmit={e => { e.preventDefault(); save.mutate(form) }} className="form-group">
              <div>
                <label className="label">Full Name *</label>
                <input required className="input" placeholder="John Mensah" value={form.full_name} onChange={e => set('full_name', e.target.value)} />
              </div>
              <div>
                <label className="label">Email *</label>
                <input required type="email" className="input" placeholder="user@example.com" value={form.email} onChange={e => set('email', e.target.value)} />
              </div>
              <div>
                <label className="label">{editing ? 'New Password' : 'Password *'}</label>
                <div style={{ position: 'relative' }}>
                  <KeyRound size={14} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }} />
                  <input
                    type={showPw ? 'text' : 'password'}
                    required={!editing}
                    className="input"
                    style={{ paddingLeft: '2.5rem', paddingRight: '2.75rem' }}
                    placeholder={editing ? 'Leave blank to keep current' : 'Min 8 characters'}
                    value={form.password}
                    onChange={e => set('password', e.target.value)}
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)} style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex' }}>
                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {editing && <p className="hint">Leave blank to keep the current password unchanged.</p>}
              </div>
              <div>
                <label className="label">Role *</label>
                <select required className="input" value={form.role} onChange={e => set('role', e.target.value)}>
                  <option value="staff">Staff — can record sales and stock-in</option>
                  <option value="admin">Admin — full access including users and adjustments</option>
                </select>
              </div>
              {save.error && (
                <p style={{ color: 'var(--red)', fontSize: '0.845rem', background: 'var(--red-dim)', borderRadius: '8px', padding: '0.7rem 1rem' }}>
                  {JSON.stringify(save.error.response?.data)}
                </p>
              )}
              <div style={{ display: 'flex', gap: '0.625rem', paddingTop: '0.25rem' }}>
                <button type="submit" disabled={save.isPending} className="btn btn-primary" style={{ flex: 1 }}>
                  {save.isPending ? 'Saving…' : editing ? 'Save Changes' : 'Create User'}
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
              <h3 className="modal-title" style={{ margin: 0 }}>Deactivate User?</h3>
            </div>
            <p style={{ fontSize: '0.845rem', color: 'var(--text-3)', marginBottom: '1.5rem', lineHeight: 1.65 }}>
              <strong style={{ color: 'var(--text)' }}>{confirmDelete.full_name}</strong> will no longer be able to log in. Their records are preserved.
            </p>
            <div style={{ display: 'flex', gap: '0.625rem' }}>
              <button onClick={() => remove.mutate(confirmDelete.id)} disabled={remove.isPending} className="btn btn-danger" style={{ flex: 1 }}>
                {remove.isPending ? 'Deactivating…' : 'Yes, Deactivate'}
              </button>
              <button onClick={() => setConfirmDelete(null)} className="btn btn-ghost" style={{ flex: 1 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}