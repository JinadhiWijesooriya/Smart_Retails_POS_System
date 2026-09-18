from django.db import models
from django.conf import settings

class Inventory(models.Model):
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE, related_name='inventory_levels')
    branch = models.ForeignKey('branches.Branch', on_delete=models.CASCADE, related_name='inventory_levels')
    quantity = models.IntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('product', 'branch')
        verbose_name_plural = 'Inventories'

    def __str__(self):
        return f"{self.product.name} @ {self.branch.name}: {self.quantity}"

class InventoryTransaction(models.Model):
    TYPE_SALE = 'sale'
    TYPE_PURCHASE = 'purchase'
    TYPE_ADJUSTMENT = 'adjustment'
    TYPE_RETURN = 'return'

    TYPE_CHOICES = (
        (TYPE_SALE, 'Sale Deduction'),
        (TYPE_PURCHASE, 'Purchase Receiving'),
        (TYPE_ADJUSTMENT, 'Manual Adjustment'),
        (TYPE_RETURN, 'Sales Return'),
    )

    product = models.ForeignKey('products.Product', on_delete=models.CASCADE, related_name='stock_transactions')
    branch = models.ForeignKey('branches.Branch', on_delete=models.CASCADE, related_name='stock_transactions')
    type = models.CharField(max_length=30, choices=TYPE_CHOICES)
    quantity = models.IntegerField(help_text="Positive for addition, negative for deduction")
    previous_quantity = models.IntegerField(default=0)
    new_quantity = models.IntegerField(default=0)
    reference_type = models.CharField(max_length=50, blank=True, default='') # e.g. 'sale', 'purchase', 'adjustment'
    reference_id = models.CharField(max_length=100, blank=True, default='')
    note = models.TextField(blank=True, default='')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"[{self.type}] {self.product.name} qty: {self.quantity} at {self.created_at}"
