import uuid
from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.purchases.models import Purchase, PurchaseItem
from apps.purchases.serializers import PurchaseSerializer, CreatePurchaseSerializer
from apps.products.models import Product
from apps.suppliers.models import Supplier
from apps.branches.models import Branch
from apps.inventory.models import Inventory, InventoryTransaction
from apps.audit.models import AuditLog
from apps.accounts.permissions import IsManagerOrAbove

class PurchaseViewSet(viewsets.ModelViewSet):
    queryset = Purchase.objects.all().select_related('supplier', 'branch', 'created_by').prefetch_related('items__product').order_by('-created_at')
    serializer_class = PurchaseSerializer

    def get_permissions(self):
        return [IsManagerOrAbove()]

    def create(self, request, *args, **kwargs):
        serializer = CreatePurchaseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        supplier = Supplier.objects.get(id=data['supplier_id'])
        branch = None
        if data.get('branch_id'):
            branch = Branch.objects.get(id=data['branch_id'])
        elif request.user.branch:
            branch = request.user.branch
        else:
            branch = Branch.objects.first()

        tax = Decimal(str(data.get('tax', '0.00')))
        purchase_no = f"PO-{timezone.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:4].upper()}"

        with transaction.atomic():
            subtotal = Decimal('0.00')
            items_to_save = []

            for it in data['items']:
                prod = Product.objects.get(id=it['product_id'])
                qty = it['quantity']
                cost = Decimal(str(it['unit_cost']))
                line_total = cost * qty
                subtotal += line_total
                items_to_save.append({
                    'product': prod,
                    'quantity': qty,
                    'unit_cost': cost,
                    'line_total': line_total
                })

            total = subtotal + tax

            purchase = Purchase.objects.create(
                purchase_no=purchase_no,
                supplier=supplier,
                branch=branch,
                subtotal=subtotal,
                tax=tax,
                total=total,
                status=Purchase.STATUS_ORDERED,
                notes=data.get('notes', ''),
                created_by=request.user
            )

            for item in items_to_save:
                PurchaseItem.objects.create(
                    purchase=purchase,
                    product=item['product'],
                    quantity=item['quantity'],
                    unit_cost=item['unit_cost'],
                    line_total=item['line_total']
                )

            AuditLog.objects.create(
                user=request.user,
                action='PURCHASE_ORDER_CREATED',
                entity='Purchase',
                entity_id=str(purchase.id),
                metadata={'purchase_no': purchase_no, 'total': str(total)}
            )

        return Response(PurchaseSerializer(purchase).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def receive(self, request, pk=None):
        """
        Receiving purchase order: increments stock and creates InventoryTransaction
        """
        purchase = self.get_object()
        if purchase.status in [Purchase.STATUS_RECEIVED, Purchase.STATUS_CANCELLED]:
            return Response({'error': f'Purchase is already {purchase.status}'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            purchase.status = Purchase.STATUS_RECEIVED
            purchase.received_at = timezone.now()
            purchase.save()

            for item in purchase.items.all():
                item.received_quantity = item.quantity
                item.save()

                inv, _ = Inventory.objects.select_for_update().get_or_create(
                    product=item.product, branch=purchase.branch, defaults={'quantity': 0}
                )
                prev_qty = inv.quantity
                inv.quantity += item.quantity
                inv.save()

                # Update product cost_price if desired
                if item.unit_cost > 0:
                    item.product.cost_price = item.unit_cost
                    item.product.save()

                InventoryTransaction.objects.create(
                    product=item.product,
                    branch=purchase.branch,
                    type=InventoryTransaction.TYPE_PURCHASE,
                    quantity=item.quantity,
                    previous_quantity=prev_qty,
                    new_quantity=inv.quantity,
                    reference_type='purchase',
                    reference_id=purchase.purchase_no,
                    note=f"Received PO {purchase.purchase_no}",
                    created_by=request.user
                )

            AuditLog.objects.create(
                user=request.user,
                action='PURCHASE_RECEIVED',
                entity='Purchase',
                entity_id=str(purchase.id),
                metadata={'purchase_no': purchase.purchase_no}
            )

        return Response({'message': f'Purchase {purchase.purchase_no} fully received and inventory updated'})
