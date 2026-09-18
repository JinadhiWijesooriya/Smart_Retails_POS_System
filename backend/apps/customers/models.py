from django.db import models
from decimal import Decimal

class Customer(models.Model):
    name = models.CharField(max_length=150)
    phone = models.CharField(max_length=50, blank=True, default='')
    email = models.EmailField(blank=True, default='')
    address = models.TextField(blank=True, default='')
    credit_limit = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    current_credit = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    points = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.phone or 'No phone'})"
