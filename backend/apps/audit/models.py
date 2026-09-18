from django.db import models
from django.conf import settings

class AuditLog(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='audit_logs')
    action = models.CharField(max_length=100) # e.g., 'SALE_CREATED', 'SALE_RETURNED', 'STOCK_ADJUSTMENT', 'PRICE_OVERRIDE'
    entity = models.CharField(max_length=100) # e.g., 'Sale', 'Product', 'Inventory'
    entity_id = models.CharField(max_length=100, blank=True, default='')
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.action}] on {self.entity} #{self.entity_id} by {self.user}"
