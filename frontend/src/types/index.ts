export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: { id: number; name: string; description: string } | null;
  branch: { id: number; name: string; code: string } | null;
  is_active: boolean;
}

export interface Category {
  id: number;
  name: string;
  description: string;
  status: string;
  products_count: number;
}

export interface Supplier {
  id: number;
  company_name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
}

export interface Product {
  id: number;
  sku: string;
  barcode: string;
  name: string;
  brand: string;
  description: string;
  cost_price: string;
  selling_price: string;
  tax_rate: string;
  discount: string;
  min_stock: number;
  image_url: string;
  status: string;
  category: Category | null;
  supplier: Supplier | null;
  stock: number;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string;
  address: string;
  credit_limit: string;
  current_credit: string;
  points: number;
  total_sales_count: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  discount: number; // item level discount
}

export interface SaleItem {
  id: number;
  product: number;
  product_name: string;
  product_sku: string;
  product_barcode: string;
  quantity: number;
  returned_quantity: number;
  unit_price: string;
  discount: string;
  tax: string;
  line_total: string;
}

export interface Payment {
  id: number;
  method: string;
  amount: string;
  reference: string;
  status: string;
  created_at: string;
}

export interface Sale {
  id: number;
  invoice_no: string;
  customer: Customer | null;
  cashier_name: string;
  branch_name: string;
  subtotal: string;
  discount: string;
  tax: string;
  total: string;
  paid_amount: string;
  change_amount: string;
  status: string;
  notes: string;
  items: SaleItem[];
  payments: Payment[];
  returns: any[];
  created_at: string;
}

export interface InventoryItem {
  id: number;
  product: Product;
  branch: number;
  branch_name: string;
  quantity: number;
  updated_at: string;
}

export interface InventoryTransaction {
  id: number;
  product: number;
  product_name: string;
  product_sku: string;
  branch: number;
  branch_name: string;
  type: string;
  quantity: number;
  previous_quantity: number;
  new_quantity: number;
  reference_type: string;
  reference_id: string;
  note: string;
  created_by_name: string;
  created_at: string;
}

export interface PurchaseItem {
  id: number;
  product: number;
  product_name: string;
  product_sku: string;
  quantity: number;
  received_quantity: number;
  unit_cost: string;
  line_total: string;
}

export interface Purchase {
  id: number;
  purchase_no: string;
  supplier: Supplier;
  branch_name: string;
  subtotal: string;
  tax: string;
  total: string;
  status: string;
  received_at: string | null;
  notes: string;
  created_by_name: string;
  items: PurchaseItem[];
  created_at: string;
}
