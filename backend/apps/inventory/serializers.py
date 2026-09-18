from rest_framework import serializers
from apps.inventory.models import Inventory, InventoryTransaction
from apps.products.serializers import ProductSerializer
from apps.branches.models import Branch
from apps.products.models import Product

class InventorySerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)

    class Meta:
        model = Inventory
        fields = ['id', 'product', 'branch', 'branch_name', 'quantity', 'updated_at']

class InventoryTransactionSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)

    class Meta:
        model = InventoryTransaction
        fields = [
            'id', 'product', 'product_name', 'product_sku', 'branch', 'branch_name',
            'type', 'quantity', 'previous_quantity', 'new_quantity',
            'reference_type', 'reference_id', 'note', 'created_by_name', 'created_at'
        ]

class StockAdjustmentSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    branch_id = serializers.IntegerField(required=False)
    type = serializers.ChoiceField(choices=['add', 'subtract', 'set'])
    quantity = serializers.IntegerField(min_value=0)
    note = serializers.CharField(required=False, allow_blank=True, default='')
