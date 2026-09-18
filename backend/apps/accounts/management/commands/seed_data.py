import os
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.accounts.models import Role
from apps.branches.models import Branch
from apps.categories.models import Category
from apps.suppliers.models import Supplier
from apps.products.models import Product
from apps.inventory.models import Inventory, InventoryTransaction
from apps.customers.models import Customer
from apps.sales.models import Sale, SaleItem, Payment

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds initial roles, demo users, branch, categories, suppliers, and retail products'

    def handle(self, *args, **kwargs):
        self.stdout.write("Seeding Smart Retail POS database...")

        # 1. Roles
        roles_data = [
            (Role.SUPER_ADMIN, "Full system access"),
            (Role.ADMIN, "Catalog, users, reporting & sales administration"),
            (Role.MANAGER, "Store management, inventory, purchases and approvals"),
            (Role.CASHIER, "POS checkout, daily registers, payments"),
            (Role.INVENTORY_OFFICER, "Stock adjustments, warehouse and receiving")
        ]
        roles = {}
        for name, desc in roles_data:
            role, _ = Role.objects.get_or_create(name=name, defaults={'description': desc})
            roles[name] = role

        # 2. Branch
        branch, _ = Branch.objects.get_or_create(
            code="NYC-MAIN",
            defaults={
                'name': "Smart Retail Flagship Store",
                'address': "120 Broadway, Manhattan, NY",
                'phone': "+1 (555) 019-2834",
                'status': "active"
            }
        )

        # 3. Users
        users_to_seed = [
            ("admin", "admin@smartpos.io", "password123", roles[Role.SUPER_ADMIN], True, True),
            ("manager", "manager@smartpos.io", "password123", roles[Role.MANAGER], False, False),
            ("cashier", "cashier@smartpos.io", "password123", roles[Role.CASHIER], False, False),
            ("inventory", "inventory@smartpos.io", "password123", roles[Role.INVENTORY_OFFICER], False, False),
        ]

        for username, email, pwd, role, is_staff, is_superuser in users_to_seed:
            user = User.objects.filter(username=username).first()
            if not user:
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    password=pwd,
                    role=role,
                    branch=branch,
                    is_staff=is_staff,
                    is_superuser=is_superuser,
                    phone="+1 555-888-9999"
                )
                self.stdout.write(f"Created user: {username} ({role.name})")
            else:
                user.role = role
                user.branch = branch
                user.set_password(pwd)
                user.save()

        # 4. Categories
        cats = [
            ("Beverages", "Sodas, fresh juices, hot coffee & craft drinks"),
            ("Bakery & Snacks", "Pastries, artisan breads, chips and dry snacks"),
            ("Fresh Produce", "Organic fruits, garden vegetables and greens"),
            ("Dairy & Eggs", "Whole milk, farm cheeses, yogurts and butter"),
            ("Electronics", "Phone accessories, charging cables and audio gear"),
        ]
        cat_objs = {}
        for name, desc in cats:
            c, _ = Category.objects.get_or_create(name=name, defaults={'description': desc})
            cat_objs[name] = c

        # 5. Suppliers
        suppliers = [
            ("Metro Food Distributors", "John Davis", "+1 (555) 304-8822", "orders@metrofood.com"),
            ("Fresh Harvest Farms", "Elena Vance", "+1 (555) 441-9921", "elena@freshharvest.org"),
            ("Apex Electronics Hub", "Kenji Sato", "+1 (555) 777-1234", "b2b@apexelectronics.com"),
        ]
        sup_objs = {}
        for comp, contact, phone, email in suppliers:
            s, _ = Supplier.objects.get_or_create(company_name=comp, defaults={
                'contact_person': contact, 'phone': phone, 'email': email, 'address': 'Industrial Parkway, Dock 4'
            })
            sup_objs[comp] = s

        # 6. Customers
        customers_data = [
            ("Walk-in Customer", "000-000-0000", "walkin@store.local"),
            ("Sarah Jenkins", "+1 (555) 234-5678", "sarah.j@gmail.com"),
            ("Michael Chang", "+1 (555) 876-5432", "mchang@outlook.com"),
            ("Emily Rodriguez", "+1 (555) 345-6789", "emily.r@techcorp.com"),
        ]
        for name, phone, email in customers_data:
            Customer.objects.get_or_create(name=name, defaults={'phone': phone, 'email': email, 'credit_limit': Decimal('500.00')})

        # 7. Products
        products_data = [
            ("PRD-1001", "8901001", "Cold Brew Organic Coffee 330ml", "Beverages", "Metro Food Distributors", "BeanCo", "2.10", "4.50", "8.00", 65, "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=300"),
            ("PRD-1002", "8901002", "Matcha Green Tea Latte 250ml", "Beverages", "Metro Food Distributors", "ZenDrinks", "1.80", "3.99", "8.00", 40, "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=300"),
            ("PRD-1003", "8901003", "Fresh Sparkling Lemonade 500ml", "Beverages", "Metro Food Distributors", "SunCitrus", "1.20", "2.85", "5.00", 80, "https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=300"),
            ("PRD-2001", "8902001", "Artisan Butter Croissant", "Bakery & Snacks", "Metro Food Distributors", "ParisOven", "0.95", "2.75", "5.00", 25, "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=300"),
            ("PRD-2002", "8902002", "Gluten-Free Sea Salt Crackers", "Bakery & Snacks", "Metro Food Distributors", "CrispLife", "1.60", "3.40", "5.00", 45, "https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=300"),
            ("PRD-2003", "8902003", "Dark Chocolate Hazelnut Cookie", "Bakery & Snacks", "Metro Food Distributors", "SweetBake", "1.10", "2.50", "5.00", 30, "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=300"),
            ("PRD-3001", "8903001", "Organic Honeycrisp Apples (1kg)", "Fresh Produce", "Fresh Harvest Farms", "OrchardValley", "2.20", "4.20", "0.00", 35, "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=300"),
            ("PRD-3002", "8903002", "Fresh Hass Avocados (Pack of 3)", "Fresh Produce", "Fresh Harvest Farms", "TropicFarm", "2.50", "5.25", "0.00", 20, "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=300"),
            ("PRD-4001", "8904001", "Aged Cheddar Cheese Block 250g", "Dairy & Eggs", "Fresh Harvest Farms", "AlpineDairy", "3.10", "6.40", "5.00", 18, "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=300"),
            ("PRD-4002", "8904002", "Greek Whole Milk Yogurt 500g", "Dairy & Eggs", "Fresh Harvest Farms", "Olympos", "1.90", "4.15", "5.00", 22, "https://images.unsplash.com/photo-1571212515416-fef01fc43637?w=300"),
            ("PRD-5001", "8905001", "Braided Fast-Charging USB-C Cable (2m)", "Electronics", "Apex Electronics Hub", "VoltGear", "4.00", "14.99", "10.00", 15, "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=300"),
            ("PRD-5002", "8905002", "Wireless ANC In-Ear Earbuds", "Electronics", "Apex Electronics Hub", "SonicAir", "18.00", "49.99", "10.00", 8, "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=300"),
        ]

        for sku, barcode, name, cat_name, sup_name, brand, cost, sell, tax, stock_qty, img in products_data:
            p, created = Product.objects.get_or_create(
                sku=sku,
                defaults={
                    'barcode': barcode,
                    'name': name,
                    'category': cat_objs[cat_name],
                    'supplier': sup_objs[sup_name],
                    'brand': brand,
                    'cost_price': Decimal(cost),
                    'selling_price': Decimal(sell),
                    'tax_rate': Decimal(tax),
                    'min_stock': 10,
                    'image_url': img,
                    'status': 'active'
                }
            )
            # Seed stock in branch
            inv, _ = Inventory.objects.get_or_create(product=p, branch=branch, defaults={'quantity': stock_qty})
            if created:
                InventoryTransaction.objects.create(
                    product=p,
                    branch=branch,
                    type=InventoryTransaction.TYPE_ADJUSTMENT,
                    quantity=stock_qty,
                    previous_quantity=0,
                    new_quantity=stock_qty,
                    reference_type='initial_seed',
                    reference_id='SEED-01',
                    note='Initial system setup stock'
                )

        self.stdout.write(self.style.SUCCESS("Successfully seeded Smart Retail POS database!"))
