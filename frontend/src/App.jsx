import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import StockIn from './pages/StockIn'
import NewSale from './pages/NewSale'
import SalesHistory from './pages/SalesHistory'
import SaleReceipt from './pages/SaleReceipt'
import LowStock from './pages/LowStock'
import Reports from './pages/Reports'
import Suppliers from './pages/Suppliers'
import PurchaseOrders from './pages/PurchaseOrders'
import Users from './pages/Users'
import Account from './pages/Account'
import AuditLogs from './pages/AuditLogs'
import EndOfDay from './pages/EndOfDay'

const qc = new QueryClient()

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/products" element={<Products />} />
                <Route path="/stock-in" element={<StockIn />} />
                <Route path="/purchase-orders" element={<PurchaseOrders />} />
                <Route path="/sales/new" element={<NewSale />} />
                <Route path="/sales" element={<SalesHistory />} />
                <Route path="/sales/:id" element={<SaleReceipt />} />
                <Route path="/end-of-day" element={<EndOfDay />} />
                <Route path="/low-stock" element={<LowStock />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/suppliers" element={<ProtectedRoute adminOnly><Suppliers /></ProtectedRoute>} />
                <Route path="/users" element={<ProtectedRoute adminOnly><Users /></ProtectedRoute>} />
                <Route path="/audit-logs" element={<ProtectedRoute adminOnly><AuditLogs /></ProtectedRoute>} />
                <Route path="*" element={<Navigate to="/" replace />} />
                <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
