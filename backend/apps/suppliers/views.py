from rest_framework import viewsets, permissions
from apps.suppliers.models import Supplier
from apps.suppliers.serializers import SupplierSerializer
from apps.accounts.permissions import IsManagerOrAbove

class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all().order_by('company_name')
    serializer_class = SupplierSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [IsManagerOrAbove()]
