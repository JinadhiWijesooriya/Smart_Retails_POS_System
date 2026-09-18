from django.db import models
from django.conf import settings
from decimal import Decimal

class Sale(models.Model):
    STATUS_COMPLETED = 'completed'
    STATUS_HOLD = 'hold'
    STATUS_CANCELLED = 'cancelled'
    STATUS_RETURNED = 'returned'
    STATUS_PARTIAL_RETURN = 'partial_return'

    STATUS_CHOICES = (
        (STATUS_COMPLETED, 'Completed'),
        (STATUS_HOLD, 'Hold / Suspended'),
        (STATUS_CANCELLED, 'Cancelled'),
        (STATUS_RETURNED, 'Returned'),
        (STATUS_PARTIAL_RETURN, 'Partially Returned'),
    )

    invoice_no = models.CharField(max_length=100, unique=True, db_index=True)
    customer = models.ForeignKey('customers.Customer', on_delete=models.SET_NULL, null=True, blank=True, related_name='sales')
    cashier = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='sales')
    branch = models.ForeignKey('branches.Branch', on_delete=models.SET_NULL, null=True, blank=True, related_name='sales')
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    discount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    tax = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    total = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    paid_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    change_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default=STATUS_COMPLETED)
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.invoice_no} - {self.total} ({self.status})"

class SaleItem(models.Model):
    sale = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey('products.Product', on_delete=models.PROTECT, related_name='sale_items')
    quantity = models.IntegerField(default=1)
    returned_quantity = models.IntegerField(default=0)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    discount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    tax = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    line_total = models.DecimalField(max_digits=12, decimal_places=2)

    def __str__(self):
        return f"{self.product.name} x {self.quantity} for {self.sale.invoice_no}"

class Payment(models.Model):
    METHOD_CASH = 'cash'
    METHOD_CARD = 'card'
    METHOD_BANK = 'bank_transfer'
    METHOD_CREDIT = 'credit'

    METHOD_CHOICES = (
        (METHOD_CASH, 'Cash'),
        (METHOD_CARD, 'Card'),
        (METHOD_BANK, 'Bank Transfer / UPI'),
        (METHOD_CREDIT, 'Customer Credit'),
    )

    STATUS_PAID = 'paid'
    STATUS_REFUNDED = 'refunded'

    sale = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name='payments')
    method = models.CharField(max_length=30, choices=METHOD_CHOICES, default=METHOD_CASH)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    reference = models.CharField(max_length=150, blank=True, default='')
    status = models.CharField(max_length=30, default=STATUS_PAID)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.method.upper()}: {self.amount} for {self.sale.invoice_no}"

class SaleReturn(models.Model):
    sale = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name='returns')
    processed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    total_refund = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    reason = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

class SaleReturnItem(models.Model):
    sale_return = models.ForeignKey(SaleReturn, on_delete=models.CASCADE, related_name='return_items')
    sale_item = models.ForeignKey(SaleItem, on_delete=models.PROTECT)
    product = models.ForeignKey('products.Product', on_delete=models.PROTECT)
    quantity = models.IntegerField(default=1)
    refund_amount = models.DecimalField(max_digits=12, decimal_places=2)
