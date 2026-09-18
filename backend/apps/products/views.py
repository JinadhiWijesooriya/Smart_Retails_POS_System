from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from apps.products.models import Product
from apps.products.serializers import ProductSerializer
from apps.accounts.permissions import IsManagerOrAbove

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().select_related('category', 'supplier').prefetch_related('inventory_levels')
    serializer_class = ProductSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'by_barcode', 'search']:
            return [permissions.IsAuthenticated()]
        return [IsManagerOrAbove()]

    def get_queryset(self):
        qs = super().get_queryset()
        query = self.request.query_params.get('search', None)
        category_id = self.request.query_params.get('category_id', None)
        status = self.request.query_params.get('status', None)

        if query:
            qs = qs.filter(
                Q(name__icontains=query) |
                Q(sku__icontains=query) |
                Q(barcode__icontains=query) |
                Q(brand__icontains=query)
            )
        if category_id:
            qs = qs.filter(category_id=category_id)
        if status:
            qs = qs.filter(status=status)
        return qs.order_by('-id')

    @action(detail=False, methods=['get'], url_path='barcode/(?P<barcode>[^/.]+)')
    def by_barcode(self, request, barcode=None):
        product = self.get_queryset().filter(barcode=barcode).first()
        if not product:
            # Also try matching SKU if barcode fails
            product = self.get_queryset().filter(sku=barcode).first()
        if not product:
            return Response({'detail': f'No product found with barcode or SKU {barcode}'}, status=status.HTTP_404_NOT_FOUND)
        serializer = self.get_serializer(product)
        return Response(serializer.data)
