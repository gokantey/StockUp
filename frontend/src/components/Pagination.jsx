import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({ page, totalPages, count, pageSize = 25, onPage }) {
  if (!totalPages || totalPages <= 1) return null

  const from = (page - 1) * pageSize + 1
  const to   = Math.min(page * pageSize, count)

  const pages = []
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== '…') {
      pages.push('…')
    }
  }

  const btn = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: 32, height: 32, borderRadius: '7px',
    fontSize: '0.8rem', fontWeight: 600, border: 'none', cursor: 'pointer',
    transition: 'all 0.13s', fontFamily: 'DM Sans, sans-serif',
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', flexWrap: 'wrap', gap: '0.75rem' }}>
      <p style={{ fontSize: '0.775rem', color: 'var(--text-3)' }}>
        Showing <span style={{ color: 'var(--text)', fontWeight: 600 }}>{from}–{to}</span> of{' '}
        <span style={{ color: 'var(--text)', fontWeight: 600 }}>{count}</span> results
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
        <button
          onClick={() => onPage(page - 1)}
          disabled={page === 1}
          style={{ ...btn, background: 'var(--surface)', color: page === 1 ? 'var(--text-3)' : 'var(--text-2)', opacity: page === 1 ? 0.4 : 1 }}
        >
          <ChevronLeft size={15} />
        </button>

        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`ellipsis-${i}`} style={{ width: 32, textAlign: 'center', color: 'var(--text-3)', fontSize: '0.8rem' }}>…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPage(p)}
              style={{
                ...btn,
                background: p === page ? 'var(--teal)' : 'var(--surface)',
                color:      p === page ? '#061010'    : 'var(--text-2)',
                boxShadow:  p === page ? '0 2px 10px var(--teal-glow)' : 'none',
              }}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPage(page + 1)}
          disabled={page === totalPages}
          style={{ ...btn, background: 'var(--surface)', color: page === totalPages ? 'var(--text-3)' : 'var(--text-2)', opacity: page === totalPages ? 0.4 : 1 }}
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  )
}