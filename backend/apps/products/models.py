from django.db import models
from decimal import Decimal

class Product(models.Model):
    sku = models.CharField(max_length=50, unique=True)
    barcode = models.CharField(max_length=100, unique=True, db_index=True)
    name = models.CharField(max_length=200)
    category = models.ForeignKey('categories.Category', on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
    supplier = models.ForeignKey('suppliers.Supplier', on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
    brand = models.CharField(max_length=100, blank=True, default='')
    description = models.TextField(blank=True, default='')
    cost_price = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    selling_price = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0.00'), help_text="Tax rate percentage e.g. 5.00 for 5%")
    discount = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0.00'), help_text="Default discount percentage")
    min_stock = models.IntegerField(default=5, help_text="Minimum stock alert threshold")
    image_url = models.CharField(max_length=500, blank=True, default='')
    status = models.CharField(max_length=20, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.sku})"

    @property
    def total_stock(self):
        return sum(inv.quantity for inv in self.inventory_levels.all())
