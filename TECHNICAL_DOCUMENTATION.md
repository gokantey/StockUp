# R&J Inventory Management System - Technical Documentation

## 1. Project Overview
The R&J Inventory Management System is a robust, full-stack web application designed to streamline retail operations for R&J Provisions. The system integrates point-of-sale (POS) functionality, inventory tracking, procurement management, and financial reporting into a unified, secure platform.

---

## 2. Requirement Analysis (SDLC Phase 1 & 2)

### 2.1 Business Objectives
*   **Inventory Accuracy**: Maintain real-time tracking of stock levels with automated alerts for low stock.
*   **Sales Efficiency**: Provide a fast, reliable POS interface for recording transactions.
*   **Financial Oversight**: Generate Profit & Loss (P&L) reports and End-of-Day (EOD) summaries for business performance analysis.
*   **Procurement Control**: Manage supplier relationships and track purchase orders from creation to delivery.

### 2.2 Functional Requirements
*   **User Management**: Role-Based Access Control (RBAC) for Admin and Staff.
*   **Product Management**: CRUD operations for products with SKU, category, and reorder level tracking.
*   **Transaction Management**: Recording sales, voiding transactions, and generating professional receipts.
*   **Procurement**: Purchase order lifecycle management with quality control (rejection of damaged goods).
*   **Auditability**: Comprehensive system logs for tracking administrative actions.

---

## 3. System Design (SDLC Phase 3)

### 3.1 Technology Stack
*   **Frontend**: React.js (Vite), React Query (State Management), React Hook Form (Validation).
*   **Backend**: Django REST Framework (Python).
*   **Database**: PostgreSQL (Production) / SQLite (Development).
*   **Styling**: Vanilla CSS with a custom-built design system (Premium Aesthetics).
*   **Authentication**: JWT (JSON Web Tokens) for secure API communication.

### 3.2 Database Schema (Conceptual)
*   **Users**: Email, Role, Full Name, Password (Hashed).
*   **Products**: Name, SKU, Category, Cost Price, Selling Price, Stock Quantity, Reorder Level.
*   **Suppliers**: Name, Contact, Address, Category.
*   **Sales & SaleItems**: Links products to transactions with snapshots of prices at the time of sale for P&L accuracy.
*   **PurchaseOrders & Items**: Tracks procurement from suppliers, including `received_qty` and `rejected_qty`.
*   **StockMovements**: Audit trail for every stock change (In/Out/Adjustment).
*   **AuditLogs**: Records who did what and when across all modules.

---

## 4. Implementation Details (SDLC Phase 4)

### 4.1 Frontend Architecture
The frontend is built with a component-based architecture focusing on reusability and performance.
*   **`FormField` Component**: A centralized input handler providing strict validation and visual error states (red glow, plain-language messaging).
*   **State Management**: Utilizes `@tanstack/react-query` for server state caching and synchronization, reducing unnecessary API calls.
*   **Interactive UI**: Global `interactive-item` classes provide smooth hover/active transitions for a premium user experience.

### 4.2 Security Hardening
*   **Form Logic**: Strict type checking (numbers only for quantities/prices) and character limits implemented on all user inputs.
*   **RBAC Enforcement**: Backend decorators and frontend routing prevent unauthorized access to administrative modules (e.g., Procurement, User Management).
*   **Data Integrity**: Snapshots of cost prices during sales ensure that historical profit reports remain accurate even if product prices change later.

---

## 5. Testing & Quality Assurance (SDLC Phase 5)

### 5.1 Validation Testing
*   **Input Sanitization**: All forms tested against SQL injection and cross-site scripting (XSS) via Django's built-in protection.
*   **Logic Constraints**: Verified that `rejected_qty` in Purchase Orders does not increment shop inventory.

### 5.2 Error Handling
*   **Plain Language Messaging**: Technical database errors (JSON) are caught and translated into actionable human-readable instructions for the user.
*   **Visual Indicators**: Form fields glow red upon validation failure to provide immediate feedback.

---

## 6. Deployment & Maintenance (SDLC Phase 6)

### 6.1 Deployment Strategy
*   **Frontend**: Built for production using Vite and served via Nginx.
*   **Backend**: Gunicorn/Uvicorn as the application server with Nginx as a reverse proxy.
*   **Environment**: Environment variables (`.env`) used for sensitive credentials (DB_HOST, SECRET_KEY).

### 6.2 Maintenance
*   **Audit Trails**: Administrators can review `Audit Logs` to troubleshoot user errors or investigate stock discrepancies.
*   **Backups**: Automated database backups recommended for disaster recovery.

---

## 7. Professional Documentation Summary
This application follows industry-standard SDLC practices to ensure a secure, scalable, and user-friendly experience. The integration of strict validation and professional reporting makes it a "fullproof" solution for R&J Provisions' inventory needs.
