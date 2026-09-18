from rest_framework import serializers
from apps.purchases.models import Purchase, PurchaseItem
from apps.suppliers.serializers import SupplierSerializer
from apps.suppliers.models import Supplier
from apps.branches.models import Branch
from apps.products.models import Product

class PurchaseItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)

    class Meta:
        model = PurchaseItem
        fields = ['id', 'product', 'product_name', 'product_sku', 'quantity', 'received_quantity', 'unit_cost', 'line_total']

class PurchaseSerializer(serializers.ModelSerializer):
    items = PurchaseItemSerializer(many=True, read_only=True)
    supplier = SupplierSerializer(read_only=True)
    supplier_id = serializers.PrimaryKeyRelatedField(
        queryset=Supplier.objects.all(), source='supplier', write_only=True
    )
    branch_id = serializers.PrimaryKeyRelatedField(
        queryset=Branch.objects.all(), source='branch', write_only=True, required=False
    )
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)

    class Meta:
        model = Purchase
        fields = [
            'id', 'purchase_no', 'supplier', 'supplier_id', 'branch', 'branch_id', 'branch_name',
            'subtotal', 'tax', 'total', 'status', 'received_at', 'notes',
            'created_by_name', 'items', 'created_at', 'updated_at'
        ]

class CreatePurchaseItemInputSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)
    unit_cost = serializers.DecimalField(max_digits=12, decimal_places=2)

class CreatePurchaseSerializer(serializers.Serializer):
    supplier_id = serializers.IntegerField()
    branch_id = serializers.IntegerField(required=False, allow_null=True)
    tax = serializers.DecimalField(max_digits=12, decimal_places=2, default=0)
    notes = serializers.CharField(required=False, allow_blank=True, default='')
    items = CreatePurchaseItemInputSerializer(many=True)
