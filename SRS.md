# Software Requirements Specification
## R&J — Provision Shop Inventory Management System

**Version:** 1.0  
**Date:** 2026-04-23  
**Stack:** Django · PostgreSQL · React + Vite  

---

## 1. Introduction

### 1.1 Purpose
R&J is a web-based inventory management system designed for small-to-medium provision shops. It enables shop owners and staff to track stock levels, record sales and purchases, manage suppliers, and receive alerts when items low — all from a single dashboard.

### 1.2 Scope
The MVP covers the core inventory loop: products in (via stock-in / purchase recording) and products out (via sales recording), with real-time stock level visibility and basic reporting.

### 1.3 Intended Users
| Role | Description |
|---|---|
| **Admin / Owner** | Full access — manages users, products, suppliers, and views all reports |
| **Staff / Cashier** | Records sales and views stock; cannot manage users or suppliers |

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Backend API | Django 5.x + Django REST Framework |
| Database | PostgreSQL 16 |
| Frontend | React 18 + Vite 5 |
| Auth | JWT (djangorestframework-simplejwt) |
| Styling | Tailwind CSS |
| State / Data fetching | TanStack Query (React Query) |

---

## 3. MVP Functional Requirements

### 3.1 Authentication & User Management
- **FR-01** Users can log in with email + password; receive a JWT access/refresh token pair.
- **FR-02** Tokens are stored in memory (access) and HttpOnly cookie (refresh) to reduce XSS exposure.
- **FR-03** Admin can create, deactivate, and assign roles to staff accounts.
- **FR-04** All API endpoints require authentication except `/api/auth/login/`.

### 3.2 Product / Item Management
- **FR-05** Admin can create, edit, and archive products.
- **FR-06** Each product stores: name, SKU (auto-generated), category, unit of measure, cost price, selling price, reorder level, and current stock quantity.
- **FR-07** Products can be organised into categories (e.g., Beverages, Grains, Toiletries).
- **FR-08** Staff can search/filter products by name, SKU, or category.
- **FR-09** Archived products are hidden from active lists but retained in transaction history.

### 3.3 Stock-In (Purchase / Receiving)
- **FR-10** Staff/Admin can record a stock-in event: select product, quantity received, cost price at time of purchase, supplier (optional), and date.
- **FR-11** Recording a stock-in event automatically increments the product's stock quantity.
- **FR-12** Each stock-in is saved as an immutable ledger entry (cannot be deleted, only voided with a reason).

### 3.4 Sales / Stock-Out
- **FR-13** Staff can record a sale: select one or more products, specify quantity sold per item, and confirm.
- **FR-14** Recording a sale automatically decrements stock quantities.
- **FR-15** The system prevents recording a sale quantity that exceeds current stock (hard block with a clear error message).
- **FR-16** Each sale is saved as an immutable ledger entry.
- **FR-17** A sale generates a simple receipt summary (on-screen; printable via browser print).

### 3.5 Supplier Management
- **FR-18** Admin can create, edit, and archive supplier records: name, contact person, phone, email, address.
- **FR-19** Suppliers are optionally linked to stock-in records.

### 3.6 Low-Stock Alerts
- **FR-20** Any product whose current stock quantity is at or below its reorder level is flagged.
- **FR-21** The dashboard displays a low-stock alert badge with the count of affected products.
- **FR-22** A dedicated "Low Stock" view lists all flagged products with their current quantity and reorder level.

### 3.7 Dashboard & Reporting
- **FR-23** The dashboard shows: total products, total stock value (cost), today's sales count, and low-stock item count.
- **FR-24** An inventory report lists all products with current stock quantity and stock value.
- **FR-25** A sales report shows transactions filtered by date range, with total revenue.
- **FR-26** A stock movement report shows all stock-in and stock-out events for a given product or date range.

---

## 4. Non-Functional Requirements

| ID | Requirement |
|---|---|
| NFR-01 | API response time under 500 ms for all list/detail endpoints under normal load |
| NFR-02 | Frontend bundle served via Vite dev server in development; production build output as static files |
| NFR-03 | All forms validate on the client before submission; server-side validation is the source of truth |
| NFR-04 | Role-based access is enforced at the API layer, not just the UI |
| NFR-05 | Database uses transactions for any operation that modifies stock quantity to prevent race conditions |
| NFR-06 | Passwords are hashed with Django's default PBKDF2-SHA256 |

---

## 5. Data Models (Conceptual)

```
User            — id, email, full_name, role (admin | staff), is_active
Category        — id, name
Supplier        — id, name, contact_person, phone, email, address, is_active
Product         — id, name, sku, category_fk, unit, cost_price, selling_price,
                  reorder_level, stock_quantity, is_active
StockMovement   — id, product_fk, movement_type (IN | OUT), quantity, unit_cost,
                  supplier_fk (nullable), sale_fk (nullable), note, created_by_fk,
                  created_at, is_voided, void_reason
Sale            — id, created_by_fk, created_at, note
SaleItem        — id, sale_fk, product_fk, quantity, unit_price_at_sale
```

---

## 6. API Outline (REST)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login/` | Obtain JWT tokens |
| POST | `/api/auth/refresh/` | Refresh access token |
| GET/POST | `/api/products/` | List / create products |
| GET/PUT/PATCH | `/api/products/:id/` | Retrieve / update product |
| GET/POST | `/api/categories/` | List / create categories |
| GET/POST | `/api/suppliers/` | List / create suppliers |
| GET/PUT/PATCH | `/api/suppliers/:id/` | Retrieve / update supplier |
| POST | `/api/stock-in/` | Record a stock-in event |
| GET | `/api/stock-in/` | List stock-in history (filterable) |
| POST | `/api/sales/` | Record a sale (with line items) |
| GET | `/api/sales/` | List sales (filterable by date) |
| GET | `/api/sales/:id/` | Retrieve sale + line items |
| GET | `/api/reports/low-stock/` | Low-stock product list |
| GET | `/api/reports/stock-value/` | Inventory value summary |
| GET | `/api/reports/sales-summary/` | Sales totals by date range |
| GET/POST | `/api/users/` | Admin: list / create users |

---

## 7. Frontend Pages (React + Vite)

| Route | Page | Access |
|---|---|---|
| `/login` | Login | Public |
| `/` | Dashboard | All |
| `/products` | Product list + search | All |
| `/products/new` | Add product form | Admin |
| `/products/:id` | Edit product | Admin |
| `/stock-in` | Record stock-in | All |
| `/stock-in/history` | Stock-in history | All |
| `/sales/new` | New sale (POS-style form) | All |
| `/sales` | Sales history | All |
| `/sales/:id` | Sale receipt | All |
| `/suppliers` | Supplier list | Admin |
| `/low-stock` | Low-stock alerts | All |
| `/reports` | Reports hub | Admin |
| `/users` | User management | Admin |

---

## 8. MVP Scope vs. Post-MVP

### In MVP (deliver by tomorrow)
- Auth (login, role guard)
- Product + Category CRUD
- Stock-in recording
- Sales recording (single or multi-item)
- Low-stock alert on dashboard
- Basic dashboard stats
- Inventory value + sales summary reports

### Post-MVP (future sprints)
- Barcode / QR scanning for products
- Purchase order workflow (draft → send → receive)
- Supplier invoice upload
- Multi-branch / multi-location support
- Profit & loss report (cost vs. selling price)
- Export reports to CSV / PDF
- Email/SMS low-stock notifications
- Audit log for all admin actions
- Mobile-optimised PWA

---

## 9. Project Structure (Proposed)

```
rj/
├── backend/                  # Django project
│   ├── config/               # settings, urls, wsgi
│   ├── apps/
│   │   ├── accounts/         # User model, auth views
│   │   ├── inventory/        # Product, Category, StockMovement
│   │   ├── sales/            # Sale, SaleItem
│   │   └── suppliers/        # Supplier
│   └── requirements.txt
├── frontend/                 # React + Vite
│   ├── src/
│   │   ├── api/              # Axios instance + query hooks
│   │   ├── components/       # Shared UI components
│   │   ├── pages/            # Route-level page components
│   │   ├── stores/           # Auth state (Zustand or Context)
│   │   └── main.tsx
│   └── vite.config.ts
└── SRS.md
```

---

## 10. Assumptions & Constraints

1. Single shop / single location for the MVP.
2. Currency is a single fixed currency (no multi-currency).
3. No payment gateway integration in MVP — sales are cash-only by default.
4. The backend and frontend will run on the same machine during development (Vite proxy to Django on port 8000).
5. PostgreSQL instance is available locally or via a connection string provided at runtime via `.env`.
