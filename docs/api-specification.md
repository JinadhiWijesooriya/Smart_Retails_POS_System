# Smart Retail POS — Complete REST API Specification

**Base Path:** `/api/v1/`  
**Authentication:** HTTP Authorization header: `Bearer <access_token>`

---

## 1. Authentication Endpoints

### `POST /api/v1/auth/login/`
Obtain JWT Access and Refresh tokens.
- **Request Body:**
  ```json
  {
    "username": "cashier",
    "password": "password123"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "access": "eyJhbGciOiJIUzI1Ni...",
    "refresh": "eyJhbGciOiJIUzI1Ni..."
  }
  ```

### `POST /api/v1/auth/refresh/`
Refresh an expired access token.
- **Request Body:** `{"refresh": "..."}`
- **Response (200 OK):** `{"access": "..."}`

### `GET /api/v1/users/me/`
Fetch current logged-in employee profile, role, and branch assignment.

---

## 2. Product Catalog Endpoints

### `GET /api/v1/products/`
Query products with pagination, search, and category filtering.
- **Query Parameters:**
  - `search`: Filter by name, SKU, or brand
  - `category_id`: Integer
  - `status`: `active` | `inactive`
  - `branch_id`: Optional, calculates stock for specified branch

### `GET /api/v1/products/barcode/{barcode}/`
Instant lookup by Barcode (or SKU) for barcode scanner integration.
- **Response (200 OK):**
  ```json
  {
    "id": 1,
    "sku": "PRD-1001",
    "barcode": "8901001",
    "name": "Cold Brew Organic Coffee 330ml",
    "selling_price": "4.50",
    "cost_price": "2.10",
    "tax_rate": "8.00",
    "stock": 65
  }
  ```

---

## 3. POS Sales & Checkout Endpoints

### `POST /api/v1/sales/`
**Authoritative Atomic POS Checkout**.
- Validates real-time inventory locking (`select_for_update()`).
- Recomputes line items, taxes, discounts, and order grand total on the server.
- Verifies tender amount satisfies total.
- Atomically decrements stock and logs `InventoryTransaction`.
- **Request Body:**
  ```json
  {
    "customer_id": 1,
    "branch_id": 1,
    "discount": "0.00",
    "items": [
      { "product_id": 1, "quantity": 2, "discount": "0.00" },
      { "product_id": 2, "quantity": 1, "discount": "0.00" }
    ],
    "payments": [
      { "method": "cash", "amount": "15.00" }
    ]
  }
  ```
- **Response (201 Created):** Full `Sale` object with generated `invoice_no` and change due.

### `POST /api/v1/sales/{id}/cancel/`
Cancels a completed sale and restores all inventory quantities.

### `POST /api/v1/sales/{id}/return_sale/`
Processes itemized returns, validates return quantities against original items, calculates refund, and restores stock.

---

## 4. Inventory Endpoints

### `GET /api/v1/inventory/`
Returns stock per branch with `low_stock=true` filtering.

### `POST /api/v1/inventory/adjust/`
Performs audited manual stock adjustments (`add`, `subtract`, `set`).

### `GET /api/v1/inventory/transactions/`
Returns immutable audit movement log.

---

## 5. Purchases & Suppliers

- `GET /api/v1/purchases/` → List purchase orders
- `POST /api/v1/purchases/` → Create purchase order
- `POST /api/v1/purchases/{id}/receive/` → Atomically receive goods and increase inventory stock

---

## 6. Executive Dashboard & Financial Reports

- `GET /api/v1/dashboard/summary/` → Today's KPIs
- `GET /api/v1/dashboard/sales-chart/?days=7` → 7-day revenue trend series
- `GET /api/v1/reports/sales/` → Aggregated sales & tax totals
- `GET /api/v1/reports/profit/` → Revenue, COGS, and gross margin %
- `GET /api/v1/reports/inventory/` → Stock valuation at cost and retail
