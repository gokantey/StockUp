import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowUpCircle, CheckCircle } from 'lucide-react'
import api from '../api/axios'

export default function LowStock() {
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['low-stock'],
    queryFn: () => api.get('/reports/low-stock/').then((r) => r.data),
  })

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Low Stock Alerts</h1>
        <Link to="/stock-in" className="btn btn-primary interactive-item">
          <ArrowUpCircle size={15} /> Record Stock In
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="card flex flex-col items-center justify-center text-center" style={{ padding: '4rem 2rem' }}>
          <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mb-4">
            <CheckCircle size={26} className="text-green-500" />
          </div>
          <p className="font-semibold text-slate-800">All items are sufficiently stocked</p>
          <p className="text-sm text-slate-400 mt-1">No products are currently below their reorder level.</p>
        </div>
      ) : (
        <>
          <div className="card border-l-4 border-l-amber-400 mb-5 flex items-center gap-4" style={{ padding: '1.25rem 2rem' }}>
            <AlertTriangle size={18} className="text-amber-500 flex-shrink-0" />
            <p className="text-sm text-slate-700">
              <span className="font-semibold">{items.length} product{items.length > 1 ? 's are' : ' is'}</span> below reorder level and need{items.length === 1 ? 's' : ''} restocking.
            </p>
          </div>

          <div className="card overflow-hidden">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Current Stock</th>
                  <th>Reorder Level</th>
                  <th>Shortage</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="font-medium text-slate-900">{item.name}</td>
                    <td className="font-mono text-xs text-slate-400">{item.sku}</td>
                    <td className="text-slate-500">{item.category__name ?? '—'}</td>
                    <td><span className="badge badge-red">{item.stock_quantity}</span></td>
                    <td className="text-slate-600">{item.reorder_level}</td>
                    <td>
                      <span className="font-semibold text-red-600">
                        {item.reorder_level - item.stock_quantity} units needed
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
