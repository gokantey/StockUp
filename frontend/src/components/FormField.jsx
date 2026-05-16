import { AlertCircle } from 'lucide-react'

export default function FormField({ label, error, children, hint, required }) {
  const isInvalid = !!error

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {label && (
        <label className="label">
          {label} {required && <span style={{ color: 'var(--red)' }}>*</span>}
        </label>
      )}
      
      <div style={{ position: 'relative' }}>
        {/* We clone the child to inject the error class if needed */}
        {import.meta.env.DEV && !children && <p style={{color:'red'}}>FormField needs a child input</p>}
        {children && typeof children !== 'string' ? (
          <div className={isInvalid ? 'input-error-wrapper' : ''}>
            {/* Standard practice is to let the parent handle the className on the input, 
                but we can also use CSS to target .input-error */}
            {children}
          </div>
        ) : children}
      </div>

      {hint && !error && <p className="hint">{hint}</p>}
      
      {error && (
        <p className="error-message">
          <AlertCircle size={13} />
          {error}
        </p>
      )}
    </div>
  )
}

// Helper to translate backend errors
export function getErrorMessage(err) {
  if (!err) return null
  const data = err.response?.data
  if (!data) return 'Something went wrong. Please try again.'
  
  if (typeof data === 'string') return data
  
  // DRF often returns { "field": ["error"] } or { "detail": "error" }
  if (data.detail) return data.detail
  
  const entries = Object.entries(data)
  if (entries.length > 0) {
    const [field, messages] = entries[0]
    const msg = Array.isArray(messages) ? messages[0] : messages
    if (field === 'non_field_errors') return msg
    return `${field.replace(/_/g, ' ')}: ${msg}`
  }
  
  return 'Connection error. Check your network.'
}
