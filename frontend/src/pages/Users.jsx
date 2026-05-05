import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, X, UserCheck, UserX } from 'lucide-react'
import api from '../api/axios'

const emptyForm = { email: '', full_name: '', role: 'staff', password: '' }

export default function Users() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/users/').then((r) => r.data),
  })

  const create = useMutation({
    mutationFn: (data) => api.post('/users/', data),
    onSuccess: () => { qc.invalidateQueries(['users']); setShowForm(false); setForm(emptyForm) },
  })

  const toggle = useMutation({
    mutationFn: ({ id, is_active }) => api.patch(`/users/${id}/`, { is_active }),
    onSuccess: () => qc.invalidateQueries(['users']),
  })

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">User Management</h1>
        <button onClick={() => setShowForm(true)} className="btn btn-primary">
          <Plus size={15} /> Add User
        </button>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {u.full_name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
                      </div>
                      <span className="font-medium text-slate-900">{u.full_name}</span>
                    </div>
                  </td>
                  <td className="text-slate-500">{u.email}</td>
                  <td>
                    <span className={`badge ${u.role === 'admin' ? 'badge-purple' : 'badge-blue'}`}
                      style={u.role === 'admin' ? { background: '#ede9fe', color: '#6d28d9' } : {}}>
                      {u.role === 'admin' ? 'Admin' : 'Staff'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${u.is_active ? 'badge-teal' : 'badge-gray'}`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="text-slate-400 text-xs">{new Date(u.date_joined).toLocaleDateString()}</td>
                  <td>
                    <button
                      onClick={() => toggle.mutate({ id: u.id, is_active: !u.is_active })}
                      className={`btn btn-sm btn-ghost ${u.is_active ? 'text-red-500 hover:border-red-200' : 'text-emerald-600 hover:border-emerald-200'}`}
                    >
                      {u.is_active ? <><UserX size={13} /> Deactivate</> : <><UserCheck size={13} /> Activate</>}
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={6} className="text-center py-10 text-slate-400 text-sm">No users found.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="modal-title mb-0">Add New User</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); create.mutate(form) }} className="form-group">
              <div>
                <label className="label">Full Name *</label>
                <input required className="input" placeholder="e.g. Kofi Mensah" value={form.full_name} onChange={(e) => set('full_name', e.target.value)} />
              </div>
              <div>
                <label className="label">Email Address *</label>
                <input required type="email" className="input" placeholder="kofi@example.com" value={form.email} onChange={(e) => set('email', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Role *</label>
                  <select className="input" value={form.role} onChange={(e) => set('role', e.target.value)}>
                    <option value="staff">Staff / Cashier</option>
                    <option value="admin">Admin / Owner</option>
                  </select>
                </div>
                <div>
                  <label className="label">Password *</label>
                  <input required type="password" minLength={8} className="input" placeholder="Min. 8 characters" value={form.password} onChange={(e) => set('password', e.target.value)} />
                </div>
              </div>
              {create.error && <p className="text-red-500 text-xs">{JSON.stringify(create.error.response?.data)}</p>}
              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={create.isPending} className="btn btn-primary flex-1">
                  {create.isPending ? 'Creating…' : 'Create User'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-ghost flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
