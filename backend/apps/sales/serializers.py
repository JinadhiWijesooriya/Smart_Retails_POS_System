from rest_framework import serializers
from decimal import Decimal
from apps.sales.models import Sale, SaleItem, Payment, SaleReturn, SaleReturnItem
from apps.products.models import Product
from apps.customers.models import Customer
from apps.customers.serializers import CustomerSerializer
from apps.products.serializers import ProductSerializer

class SaleItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    product_barcode = serializers.CharField(source='product.barcode', read_only=True)

    class Meta:
        model = SaleItem
        fields = [
            'id', 'product', 'product_name', 'product_sku', 'product_barcode',
            'quantity', 'returned_quantity', 'unit_price', 'discount', 'tax', 'line_total'
        ]

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ['id', 'method', 'amount', 'reference', 'status', 'created_at']

class SaleReturnItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = SaleReturnItem
        fields = ['id', 'sale_item', 'product', 'product_name', 'quantity', 'refund_amount']

class SaleReturnSerializer(serializers.ModelSerializer):
    return_items = SaleReturnItemSerializer(many=True, read_only=True)
    processed_by_name = serializers.CharField(source='processed_by.username', read_only=True)

    class Meta:
        model = SaleReturn
        fields = ['id', 'total_refund', 'reason', 'processed_by_name', 'return_items', 'created_at']

class SaleSerializer(serializers.ModelSerializer):
    items = SaleItemSerializer(many=True, read_only=True)
    payments = PaymentSerializer(many=True, read_only=True)
    returns = SaleReturnSerializer(many=True, read_only=True)
    customer = CustomerSerializer(read_only=True)
    cashier_name = serializers.CharField(source='cashier.username', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)

    class Meta:
        model = Sale
        fields = [
            'id', 'invoice_no', 'customer', 'cashier', 'cashier_name', 'branch', 'branch_name',
            'subtotal', 'discount', 'tax', 'total', 'paid_amount', 'change_amount',
            'status', 'notes', 'items', 'payments', 'returns', 'created_at', 'updated_at'
        ]

# Input payload serializers for atomic POS Checkout
class CartItemInputSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)
    discount = serializers.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'), required=False)

class PaymentInputSerializer(serializers.Serializer):
    method = serializers.ChoiceField(choices=Payment.METHOD_CHOICES)
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=Decimal('0.01'))
    reference = serializers.CharField(required=False, allow_blank=True, default='')

class CheckoutSerializer(serializers.Serializer):
    customer_id = serializers.IntegerField(required=False, allow_null=True)
    branch_id = serializers.IntegerField(required=False, allow_null=True)
    discount = serializers.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'), required=False)
    notes = serializers.CharField(required=False, allow_blank=True, default='')
    items = CartItemInputSerializer(many=True)
    payments = PaymentInputSerializer(many=True)

class ReturnItemInputSerializer(serializers.Serializer):
    sale_item_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)

class ProcessReturnSerializer(serializers.Serializer):
    items = ReturnItemInputSerializer(many=True)
    reason = serializers.CharField(required=False, allow_blank=True, default='')
