import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, X, Pencil, Shield, User, AlertTriangle, Eye, EyeOff, KeyRound } from 'lucide-react'
import { useForm } from 'react-hook-form'
import api from '../api/axios'
import useAuthStore from '../store/authStore'
import FormField, { getErrorMessage } from '../components/FormField'

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
  const [showPw,        setShowPw]        = useState(false)

  const [resetTarget,   setResetTarget]   = useState(null)
  const [resetPw,       setResetPw]       = useState('')
  const [showResetPw,   setShowResetPw]   = useState(false)
  const [resetSuccess,  setResetSuccess]  = useState('')

  const [confirmDelete, setConfirmDelete] = useState(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: emptyForm
  })

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

  const adminResetPw = useMutation({
    mutationFn: ({ pk, new_password }) => api.post(`/users/${pk}/reset-password/`, { new_password }),
    onSuccess: () => {
      setResetSuccess(`Password updated for ${resetTarget?.full_name}.`)
      setResetPw('')
      setTimeout(() => { setResetTarget(null); setResetSuccess('') }, 2200)
    },
  })

  const remove = useMutation({
    mutationFn: (id) => api.delete(`/users/${id}/`),
    onSuccess:  () => { qc.invalidateQueries(['users']); setConfirmDelete(null) },
  })

  const onSubmit = (data) => {
    save.mutate(data)
  }

  const openEdit  = (u) => { 
    setEditing(u)
    reset({ full_name: u.full_name, email: u.email, password: '', role: u.role })
    setShowPw(false)
    setShowForm(true) 
  }
  const closeForm = () => { setShowForm(false); setEditing(null); reset(emptyForm); setShowPw(false) }
  const openReset  = (u) => { setResetTarget(u); setResetPw(''); setShowResetPw(false); setResetSuccess('') }
  const closeReset = () => { setResetTarget(null); setResetPw(''); setResetSuccess('') }

  const admins = users.filter(u => u.role === 'admin')
  const staff  = users.filter(u => u.role === 'staff')

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Users</h1>
          <p className="page-subtitle">{users.length} team member{users.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn btn-primary interactive-item">
          <Plus size={15} /> Add User
        </button>
      </div>

      {/* Role summary */}
      <div className="grid grid-cols-2" style={{ gap: '1rem', marginBottom: '1.5rem', maxWidth: 480 }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '1.125rem 1.375rem', display: 'flex', alignItems: 'center', gap: '0.875rem', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ width: 34, height: 34, borderRadius: '9px', background: 'var(--teal-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Shield size={16} style={{ color: 'var(--teal)' }} />
          </div>
          <div>
            <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)', fontFamily: 'JetBrains Mono, monospace', lineHeight: 1 }}>{admins.length}</p>
            <p style={{ fontSize: '0.745rem', color: 'var(--text-3)', marginTop: '0.2rem' }}>Admin{admins.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '1.125rem 1.375rem', display: 'flex', alignItems: 'center', gap: '0.875rem', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ width: 34, height: 34, borderRadius: '9px', background: 'var(--blue-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <User size={16} style={{ color: 'var(--blue)' }} />
          </div>
          <div>
            <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)', fontFamily: 'JetBrains Mono, monospace', lineHeight: 1 }}>{staff.length}</p>
            <p style={{ fontSize: '0.745rem', color: 'var(--text-3)', marginTop: '0.2rem' }}>Staff member{staff.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 140 }}>
            <div className="spinner" />
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
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
                        <p style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.875rem' }}>
                          {u.full_name}
                          {u.id === me?.id && (
                            <span style={{ marginLeft: '0.4rem', fontSize: '0.65rem', fontWeight: 700, color: 'var(--teal)', background: 'var(--teal-light)', borderRadius: '999px', padding: '0.08rem 0.45rem' }}>You</span>
                          )}
                        </p>
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
                        <button onClick={() => openEdit(u)} className="btn btn-ghost btn-sm interactive-item">
                          <Pencil size={12} /> Edit
                        </button>
                        <button onClick={() => openReset(u)} className="btn btn-ghost btn-sm interactive-item" style={{ color: 'var(--amber)' }}>
                          <KeyRound size={12} /> Reset PW
                        </button>
                        {u.id !== me?.id && (
                          <button onClick={() => setConfirmDelete(u)} className="btn btn-ghost btn-sm interactive-item" style={{ color: 'var(--red)' }}>
                            <AlertTriangle size={12} /> Deactivate
                        </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-3)', fontSize: '0.875rem' }}>
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Add / Edit Modal ── */}
      {showForm && (
        <div className="modal-overlay" onClick={closeForm}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h3 className="modal-title" style={{ margin: 0 }}>{editing ? 'Edit User' : 'Add User'}</h3>
              <button onClick={closeForm} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="form-group" noValidate>
              <FormField label="Full Name" required error={errors.full_name?.message}>
                <input 
                  className={`input ${errors.full_name ? 'input-error' : ''}`}
                  placeholder="John Mensah" 
                  {...register('full_name', { required: 'Full name is required', maxLength: { value: 100, message: 'Max 100 characters' } })} 
                />
              </FormField>

              <FormField label="Email" required error={errors.email?.message} hint="Can be a real email or a placeholder like staff1@shop.local">
                <input 
                  type="email" 
                  className={`input ${errors.email ? 'input-error' : ''}`}
                  placeholder="user@example.com" 
                  {...register('email', { 
                    required: 'Email is required',
                    pattern: { value: /^\S+@\S+$/, message: 'Invalid email address' },
                    maxLength: { value: 100, message: 'Max 100 characters' }
                  })} 
                />
              </FormField>

              {!editing && (
                <FormField label="Password" required error={errors.password?.message} hint="Share this with the staff member directly.">
                  <div style={{ position: 'relative' }}>
                    <KeyRound size={14} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }} />
                    <input
                      type={showPw ? 'text' : 'password'}
                      className={`input ${errors.password ? 'input-error' : ''}`}
                      style={{ paddingLeft: '2.5rem', paddingRight: '2.75rem' }}
                      placeholder="Min 8 characters"
                      {...register('password', { 
                        required: 'Password is required', 
                        minLength: { value: 8, message: 'Min 8 characters' },
                        maxLength: { value: 50, message: 'Max 50 characters' }
                      })}
                    />
                    <button type="button" onClick={() => setShowPw(v => !v)} style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex' }}>
                      {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </FormField>
              )}

              <FormField label="Role" required error={errors.role?.message}>
                <select className={`input ${errors.role ? 'input-error' : ''}`} {...register('role', { required: 'Role is required' })}>
                  <option value="staff">Staff — can record sales and stock-in</option>
                  <option value="admin">Admin — full access including users and adjustments</option>
                </select>
              </FormField>

              {save.error && (
                <div className="alert alert-red" style={{ fontSize: '0.845rem', padding: '0.75rem 1rem' }}>
                  {getErrorMessage(save.error)}
                </div>
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

      {/* ── Admin Reset Password Modal ── */}
      {resetTarget && (
        <div className="modal-overlay" onClick={closeReset}>
          <div className="modal" style={{ maxWidth: '28rem' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div>
                <h3 className="modal-title" style={{ margin: 0 }}>Reset Password</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginTop: '0.3rem' }}>
                  For <strong style={{ color: 'var(--text)' }}>{resetTarget.full_name}</strong>
                </p>
              </div>
              <button onClick={closeReset} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            {resetSuccess ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--green-dim)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '10px', padding: '1rem 1.25rem' }}>
                <KeyRound size={15} style={{ color: 'var(--green)', flexShrink: 0 }} />
                <p style={{ fontSize: '0.845rem', color: 'var(--green)', fontWeight: 600 }}>{resetSuccess}</p>
              </div>
            ) : (
              <div className="form-group">
                <div>
                  <label className="label">New Password *</label>
                  <div style={{ position: 'relative' }}>
                    <KeyRound size={14} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }} />
                    <input
                      autoFocus
                      type={showResetPw ? 'text' : 'password'}
                      className="input"
                      style={{ paddingLeft: '2.5rem', paddingRight: '2.75rem' }}
                      placeholder="Min 8 characters"
                      value={resetPw}
                      onChange={e => setResetPw(e.target.value)}
                    />
                    <button type="button" onClick={() => setShowResetPw(v => !v)} style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex' }}>
                      {showResetPw ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <p className="hint">Share the new password with the staff member after saving.</p>
                </div>

                {adminResetPw.error && (
                  <p style={{ color: 'var(--red)', fontSize: '0.845rem', background: 'var(--red-dim)', borderRadius: '8px', padding: '0.7rem 1rem' }}>
                    {adminResetPw.error.response?.data?.detail || 'Something went wrong.'}
                  </p>
                )}

                <div style={{ display: 'flex', gap: '0.625rem' }}>
                  <button
                    onClick={() => adminResetPw.mutate({ pk: resetTarget.id, new_password: resetPw })}
                    disabled={resetPw.length < 8 || adminResetPw.isPending}
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                  >
                    {adminResetPw.isPending ? 'Saving…' : 'Set Password'}
                  </button>
                  <button onClick={closeReset} className="btn btn-ghost" style={{ flex: 1 }}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Deactivate confirm ── */}
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