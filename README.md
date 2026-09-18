# Smart Retail POS

A modern Point of Sale & Inventory Management Platform designed for retail businesses. Built with **React 19 + TypeScript + Tailwind CSS** on the frontend, and **Django 5 + Django REST Framework + SimpleJWT** on the backend.

---

## 🌟 Key Features

1. **POS Terminal Screen**:
   - Rapid barcode lookup and item name search
   - Category filtering pills
   - Dynamic cart with quantity increments and custom item discounts
   - Order hold & resume (park current cart to serve another customer)
   - Multi-payment modal: Cash with quick cash tender buttons & change calculation, Card, and Bank/UPI
   - Thermal-style receipt preview & print dialog (`window.print`)
2. **Authoritative Backend Processing**:
   - Atomic database transactions ensure Sale, SaleItem, and Payment succeed or roll back together
   - Authoritative calculation of taxes, subtotals, and discounts on server
   - Automatic inventory deduction on checkout and inventory replenishment on cancellations/returns
3. **Inventory & Stock Management**:
   - Branch stock levels with minimum stock alert badges
   - Stock adjustments (Add, Subtract, Set Exact)
   - Complete audit trail of all inventory transactions
4. **Sales & Returns**:
   - Itemized full and partial returns
   - Invoices history with receipt reprint
5. **Purchases & Suppliers**:
   - Purchase order creation and stock receiving workflow
6. **Customers & Loyalty**:
   - Customer loyalty points earned automatically on checkout
7. **Executive Dashboard & Analytics**:
   - Daily sales trend graphs (Recharts)
   - Top products leaderboard
   - Today's payment method breakdown

---

## 🚀 Getting Started

### 1. Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate      # On Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_data # Seeds demo catalog, categories, users and stock
python manage.py runserver
```

Backend will be running at `http://127.0.0.1:8000/`.

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend will be running at `http://127.0.0.1:5173/`.

### 3. Demo Credentials

| Role | Username | Password |
|---|---|---|
| **Super Admin** | `admin` | `password123` |
| **Store Manager** | `manager` | `password123` |
| **POS Cashier** | `cashier` | `password123` |
| **Inventory Officer** | `inventory` | `password123` |

---

## 🧪 Testing

Run backend tests:
```bash
cd backend
python manage.py test apps.sales
```

Test production frontend build:
```bash
cd frontend
npm run build
```
