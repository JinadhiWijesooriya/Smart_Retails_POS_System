from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from decimal import Decimal
from apps.accounts.models import Role
from apps.branches.models import Branch
from apps.products.models import Product
from apps.inventory.models import Inventory
from apps.sales.models import Sale

User = get_user_model()

class PosCoreWorkflowTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.role = Role.objects.create(name=Role.CASHIER)
        self.branch = Branch.objects.create(name="Test Branch", code="BR-TEST")
        self.user = User.objects.create_user(
            username='cashier1', password='password123', role=self.role, branch=self.branch
        )
        self.client.force_authenticate(user=self.user)

        self.product = Product.objects.create(
            sku='TEST-01',
            barcode='12345678',
            name='Mineral Water',
            cost_price=Decimal('1.00'),
            selling_price=Decimal('2.50'),
            tax_rate=Decimal('10.00'),
            min_stock=5
        )
        self.inventory = Inventory.objects.create(
            product=self.product,
            branch=self.branch,
            quantity=20
        )

    def test_barcode_lookup(self):
        response = self.client.get(f'/api/v1/products/barcode/{self.product.barcode}/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['name'], 'Mineral Water')

    def test_atomic_checkout_and_inventory_deduction(self):
        # Checkout 3 items
        payload = {
            'branch_id': self.branch.id,
            'discount': '0.00',
            'items': [
                {'product_id': self.product.id, 'quantity': 3, 'discount': '0.00'}
            ],
            'payments': [
                {'method': 'cash', 'amount': '10.00'}
            ]
        }
        response = self.client.post('/api/v1/sales/', payload, format='json')
        self.assertEqual(response.status_code, 201)
        
        # Verify total: 3 * 2.50 = 7.50 + 10% tax (0.75) = 8.25
        self.assertEqual(Decimal(str(response.data['total'])), Decimal('8.25'))
        self.assertEqual(Decimal(str(response.data['change_amount'])), Decimal('1.75'))

        # Verify inventory was reduced by 3: 20 - 3 = 17
        self.inventory.refresh_from_db()
        self.assertEqual(self.inventory.quantity, 17)

    def test_insufficient_stock_rejection(self):
        payload = {
            'branch_id': self.branch.id,
            'items': [
                {'product_id': self.product.id, 'quantity': 25}
            ],
            'payments': [
                {'method': 'cash', 'amount': '100.00'}
            ]
        }
        response = self.client.post('/api/v1/sales/', payload, format='json')
        self.assertEqual(response.status_code, 400)
        self.assertIn('Insufficient stock', response.data['error'])
