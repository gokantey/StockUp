import { useQuery } from '@tanstack/react-query'
import { History, Search, User, Activity, Clock, Shield } from 'lucide-react'
import api from '../api/axios'

export default function AuditLogs() {
  const { data: logsData, isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => api.get('/audit/').then(r => r.data)
  })

  // Handle DRF pagination if present, otherwise assume it's an array
  const logs = Array.isArray(logsData) ? logsData : (logsData?.results || [])

  const formatChanges = (changes) => {
    if (!changes) return <span style={{ color: 'var(--text-3)', fontStyle: 'italic', fontSize: '0.75rem' }}>No specific details</span>
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {Object.entries(changes).map(([field, vals]) => {
          // Identify technical "empty" values (null, undefined, or the string "None")
          const isEmpty = (v) => v === null || v === undefined || v === '' || v === 'None';
          
          const oldVal = vals?.old;
          const newVal = vals?.new;
          
          const hasOld = !isEmpty(oldVal);
          const hasNew = !isEmpty(newVal);
          
          // Hide rows where nothing actually changed (empty to empty)
          if (!hasOld && !hasNew) return null;

          const label = field
            .replace(/_/g, ' ')
            .replace('qty', 'quantity')
            .replace('repr', 'name')
            .replace('delta', 'change')

          return (
            <div key={field} style={{ fontSize: '0.75rem' }}>
              <span style={{ fontWeight: 700, color: 'var(--blue)', textTransform: 'capitalize', marginRight: '0.5rem' }}>{label}:</span>
              {hasOld && (
                <>
                  <span style={{ color: 'var(--red)', textDecoration: 'line-through', marginRight: '0.5rem', opacity: 0.7 }}>
                    {String(oldVal)}
                  </span>
                  <span style={{ marginRight: '0.5rem', color: 'var(--text-3)' }}>→</span>
                </>
              )}
              <span style={{ color: 'var(--green)', fontWeight: 700 }}>
                {hasNew ? String(newVal) : 'Blank'}
              </span>
            </div>
          )
        })}
      </div>
    )
  }

  const getActionBadge = (log) => {
    const action = log.action
    const label = log.action_label || action
    const map = {
      IN:     '#0d9488', // teal-600
      OUT:    '#2563eb', // blue-600
      CREATE: '#059669', // green-600
      UPDATE: '#2563eb', // blue-600
      VOID:   '#dc2626', // red-600
      ADJUST: '#7c3aed', // purple-600
      LOGIN:  '#475569'  // slate-600
    }
    return (
      <span style={{ 
        color: map[action] || 'var(--text-2)', 
        fontWeight: 700, 
        fontSize: '0.75rem', 
        letterSpacing: '0.01em'
      }}>
        {label}
      </span>
    )
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Audit Logs</h1>
          <p className="page-subtitle">Track system actions and administrative changes</p>
        </div>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: '5rem', display: 'flex', justifyContent: 'center' }}>
            <div className="spinner" />
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '180px' }}>Timestamp</th>
                  <th style={{ width: '220px' }}>User</th>
                  <th style={{ width: '120px' }}>Action</th>
                  <th style={{ width: '220px' }}>Target</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Clock size={13} style={{ color: 'var(--text-3)' }} />
                        <span className="mono" style={{ fontSize: '0.75rem' }}>
                          {new Date(log.timestamp).toLocaleString('en-GB', { 
                            day: '2-digit', 
                            month: 'short', 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div>
                        <p style={{ fontSize: '0.875rem', fontWeight: 600, lineHeight: 1.2 }}>{log.user_name || 'System'}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: '0.1rem' }}>{log.user_email || '-'}</p>
                      </div>
                    </td>
                    <td>{getActionBadge(log)}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ 
                          fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-3)', 
                          textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1 
                        }}>
                          {log.model_name}
                        </span>
                        <p style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: '0.25rem' }}>
                          {log.object_repr || `ID: ${log.object_id}`}
                        </p>
                      </div>
                    </td>
                    <td>
                      {formatChanges(log.changes)}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-3)', fontStyle: 'italic' }}>
                      No logs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
