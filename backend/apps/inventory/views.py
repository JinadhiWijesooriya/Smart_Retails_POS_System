from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from apps.inventory.models import Inventory, InventoryTransaction
from apps.inventory.serializers import InventorySerializer, InventoryTransactionSerializer, StockAdjustmentSerializer
from apps.products.models import Product
from apps.branches.models import Branch
from apps.audit.models import AuditLog

class InventoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Inventory.objects.all().select_related('product', 'branch')
    serializer_class = InventorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        branch_id = self.request.query_params.get('branch_id')
        search = self.request.query_params.get('search')
        low_stock = self.request.query_params.get('low_stock')

        if branch_id:
            qs = qs.filter(branch_id=branch_id)
        if search:
            qs = qs.filter(product__name__icontains=search) | qs.filter(product__sku__icontains=search)
        if low_stock == 'true':
            # products whose current stock is <= min_stock
            qs = [inv for inv in qs if inv.quantity <= inv.product.min_stock]
            return qs
        return qs

    @action(detail=False, methods=['get'])
    def transactions(self, request):
        qs = InventoryTransaction.objects.all().select_related('product', 'branch', 'created_by').order_by('-created_at')
        product_id = request.query_params.get('product_id')
        branch_id = request.query_params.get('branch_id')
        if product_id:
            qs = qs.filter(product_id=product_id)
        if branch_id:
            qs = qs.filter(branch_id=branch_id)
        serializer = InventoryTransactionSerializer(qs[:100], many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def adjust(self, request):
        serializer = StockAdjustmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        product = Product.objects.get(id=data['product_id'])
        branch = None
        if 'branch_id' in data and data['branch_id']:
            branch = Branch.objects.get(id=data['branch_id'])
        elif request.user.branch:
            branch = request.user.branch
        else:
            branch = Branch.objects.first()

        if not branch:
            branch = Branch.objects.create(name="Main Store", code="MAIN-01")

        with transaction.atomic():
            inv, _ = Inventory.objects.select_for_update().get_or_create(product=product, branch=branch)
            prev_qty = inv.quantity
            adj_type = data['type']
            qty = data['quantity']

            if adj_type == 'add':
                new_qty = prev_qty + qty
                diff = qty
            elif adj_type == 'subtract':
                new_qty = max(0, prev_qty - qty)
                diff = - (prev_qty - new_qty)
            else: # set
                new_qty = qty
                diff = new_qty - prev_qty

            inv.quantity = new_qty
            inv.save()

            txn = InventoryTransaction.objects.create(
                product=product,
                branch=branch,
                type=InventoryTransaction.TYPE_ADJUSTMENT,
                quantity=diff,
                previous_quantity=prev_qty,
                new_quantity=new_qty,
                reference_type='adjustment',
                reference_id=f"ADJ-{product.id}",
                note=data.get('note', 'Manual stock adjustment'),
                created_by=request.user
            )

            AuditLog.objects.create(
                user=request.user,
                action='STOCK_ADJUSTMENT',
                entity='Inventory',
                entity_id=str(inv.id),
                metadata={'product': product.name, 'previous': prev_qty, 'new': new_qty, 'reason': data.get('note')}
            )

        return Response({
            'message': 'Stock successfully adjusted',
            'previous_quantity': prev_qty,
            'new_quantity': new_qty,
            'product': product.name
        }, status=status.HTTP_200_OK)
