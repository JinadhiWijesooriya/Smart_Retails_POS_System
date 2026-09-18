from rest_framework import serializers
from apps.products.models import Product
from apps.categories.serializers import CategorySerializer
from apps.suppliers.serializers import SupplierSerializer
from apps.categories.models import Category
from apps.suppliers.models import Supplier
from apps.inventory.models import Inventory

class ProductSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source='category', write_only=True, required=False, allow_null=True
    )
    supplier = SupplierSerializer(read_only=True)
    supplier_id = serializers.PrimaryKeyRelatedField(
        queryset=Supplier.objects.all(), source='supplier', write_only=True, required=False, allow_null=True
    )
    stock = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'sku', 'barcode', 'name', 'brand', 'description',
            'cost_price', 'selling_price', 'tax_rate', 'discount',
            'min_stock', 'image_url', 'status', 'category', 'category_id',
            'supplier', 'supplier_id', 'stock', 'created_at', 'updated_at'
        ]

    def get_stock(self, obj):
        # If user has a branch or branch is specified in request context
        request = self.context.get('request')
        branch_id = None
        if request and hasattr(request, 'user') and request.user.is_authenticated and request.user.branch:
            branch_id = request.user.branch.id
        elif request and 'branch_id' in request.query_params:
            branch_id = request.query_params.get('branch_id')

        if branch_id:
            inv = obj.inventory_levels.filter(branch_id=branch_id).first()
            return inv.quantity if inv else 0
        return sum(inv.quantity for inv in obj.inventory_levels.all())
