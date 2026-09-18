from rest_framework import serializers
from apps.customers.models import Customer
from apps.sales.models import Sale

class CustomerSerializer(serializers.ModelSerializer):
    total_sales_count = serializers.IntegerField(source='sales.count', read_only=True)

    class Meta:
        model = Customer
        fields = [
            'id', 'name', 'phone', 'email', 'address',
            'credit_limit', 'current_credit', 'points', 'total_sales_count',
            'created_at', 'updated_at'
        ]
