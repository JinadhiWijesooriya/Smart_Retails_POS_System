from django.contrib.auth.models import AbstractUser
from django.db import models

class Role(models.Model):
    SUPER_ADMIN = 'Super Admin'
    ADMIN = 'Admin'
    MANAGER = 'Manager'
    CASHIER = 'Cashier'
    INVENTORY_OFFICER = 'Inventory Officer'

    ROLE_CHOICES = (
        (SUPER_ADMIN, 'Super Admin'),
        (ADMIN, 'Admin'),
        (MANAGER, 'Manager'),
        (CASHIER, 'Cashier'),
        (INVENTORY_OFFICER, 'Inventory Officer'),
    )

    name = models.CharField(max_length=50, choices=ROLE_CHOICES, unique=True)
    description = models.TextField(blank=True, default='')

    def __str__(self):
        return self.name

class User(AbstractUser):
    role = models.ForeignKey(Role, on_delete=models.SET_NULL, null=True, blank=True, related_name='users')
    branch = models.ForeignKey('branches.Branch', on_delete=models.SET_NULL, null=True, blank=True, related_name='users')
    phone = models.CharField(max_length=50, blank=True, default='')

    def __str__(self):
        return f"{self.username} ({self.role.name if self.role else 'No Role'})"
