from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.customers.models import Customer
from apps.customers.serializers import CustomerSerializer
from apps.sales.models import Sale

class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all().order_by('-created_at')
    serializer_class = CustomerSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        query = self.request.query_params.get('search')
        if query:
            qs = qs.filter(name__icontains=query) | qs.filter(phone__icontains=query) | qs.filter(email__icontains=query)
        return qs

    @action(detail=True, methods=['get'])
    def sales(self, request, pk=None):
        customer = self.get_object()
        from apps.sales.serializers import SaleSerializer
        sales = customer.sales.all().order_by('-created_at')
        serializer = SaleSerializer(sales, many=True)
        return Response(serializer.data)
