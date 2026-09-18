import uuid
from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.sales.models import Sale, SaleItem, Payment, SaleReturn, SaleReturnItem
from apps.sales.serializers import (
    SaleSerializer, CheckoutSerializer, ProcessReturnSerializer, PaymentSerializer
)
from apps.products.models import Product
from apps.customers.models import Customer
from apps.branches.models import Branch
from apps.inventory.models import Inventory, InventoryTransaction
from apps.audit.models import AuditLog

class SaleViewSet(viewsets.ModelViewSet):
    queryset = Sale.objects.all().select_related('customer', 'cashier', 'branch').prefetch_related('items__product', 'payments', 'returns__return_items__product').order_by('-created_at')
    serializer_class = SaleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        status_filter = self.request.query_params.get('status')
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        search = self.request.query_params.get('search')
        cashier_id = self.request.query_params.get('cashier_id')

        if status_filter:
            qs = qs.filter(status=status_filter)
        if date_from:
            qs = qs.filter(created_at__date__gte=date_from)
        if date_to:
            qs = qs.filter(created_at__date__lte=date_to)
        if search:
            qs = qs.filter(invoice_no__icontains=search)
        if cashier_id:
            qs = qs.filter(cashier_id=cashier_id)
        return qs

    def create(self, request, *args, **kwargs):
        """
        ATOMIC CHECKOUT TRANSACTION
        1. Validates authoritative product price & stock in DB
        2. Calculates authoritative subtotal, tax, discounts, final total
        3. Validates payment amount meets total
        4. Deducts inventory & creates InventoryTransactions
        5. Persists Sale, SaleItems, and Payments atomically
        """
        serializer = CheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        items_data = data['items']
        payments_data = data['payments']
        global_discount = Decimal(str(data.get('discount', '0.00')))
        customer_id = data.get('customer_id')
        branch_id = data.get('branch_id')

        # Determine Branch
        branch = None
        if branch_id:
            branch = Branch.objects.filter(id=branch_id).first()
        elif request.user.branch:
            branch = request.user.branch
        else:
            branch = Branch.objects.first()
            if not branch:
                branch = Branch.objects.create(name="Main Store", code="MAIN-01")

        customer = None
        if customer_id:
            customer = Customer.objects.filter(id=customer_id).first()

        with transaction.atomic():
            # Generate unique invoice number
            invoice_no = f"INV-{timezone.now().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:4].upper()}"

            subtotal = Decimal('0.00')
            total_tax = Decimal('0.00')
            sale_items_to_create = []
            inventory_updates = []

            for item_info in items_data:
                p_id = item_info['product_id']
                qty = item_info['quantity']
                item_discount = Decimal(str(item_info.get('discount', '0.00')))

                product = Product.objects.select_for_update().get(id=p_id)

                # Authoritative stock verification
                inv, _ = Inventory.objects.select_for_update().get_or_create(
                    product=product, branch=branch, defaults={'quantity': 0}
                )
                if inv.quantity < qty:
                    return Response({
                        'error': f"Insufficient stock for '{product.name}'. Available: {inv.quantity}, Requested: {qty}"
                    }, status=status.HTTP_400_BAD_REQUEST)

                # Authoritative calculation
                unit_price = product.selling_price
                line_subtotal = (unit_price * qty) - item_discount
                tax_amount = (line_subtotal * (product.tax_rate / Decimal('100.00'))).quantize(Decimal('0.01'))
                line_total = line_subtotal + tax_amount

                subtotal += line_subtotal
                total_tax += tax_amount

                sale_items_to_create.append({
                    'product': product,
                    'quantity': qty,
                    'unit_price': unit_price,
                    'discount': item_discount,
                    'tax': tax_amount,
                    'line_total': line_total,
                    'inv': inv
                })

            final_total = max(Decimal('0.00'), subtotal - global_discount + total_tax)

            # Check payments
            total_tendered = sum(Decimal(str(p['amount'])) for p in payments_data)
            if total_tendered < final_total:
                return Response({
                    'error': f"Insufficient payment. Total: {final_total}, Tendered: {total_tendered}"
                }, status=status.HTTP_400_BAD_REQUEST)

            change_amount = total_tendered - final_total

            # Create Sale
            sale = Sale.objects.create(
                invoice_no=invoice_no,
                customer=customer,
                cashier=request.user,
                branch=branch,
                subtotal=subtotal,
                discount=global_discount,
                tax=total_tax,
                total=final_total,
                paid_amount=total_tendered,
                change_amount=change_amount,
                status=Sale.STATUS_COMPLETED,
                notes=data.get('notes', '')
            )

            # Create SaleItems and Update Inventory
            for item in sale_items_to_create:
                SaleItem.objects.create(
                    sale=sale,
                    product=item['product'],
                    quantity=item['quantity'],
                    unit_price=item['unit_price'],
                    discount=item['discount'],
                    tax=item['tax'],
                    line_total=item['line_total']
                )

                # Reduce inventory
                inv = item['inv']
                prev_qty = inv.quantity
                inv.quantity -= item['quantity']
                inv.save()

                # Audit Inventory Transaction
                InventoryTransaction.objects.create(
                    product=item['product'],
                    branch=branch,
                    type=InventoryTransaction.TYPE_SALE,
                    quantity=-item['quantity'],
                    previous_quantity=prev_qty,
                    new_quantity=inv.quantity,
                    reference_type='sale',
                    reference_id=sale.invoice_no,
                    note=f"Sold in invoice {sale.invoice_no}",
                    created_by=request.user
                )

            # Create Payments
            for p in payments_data:
                Payment.objects.create(
                    sale=sale,
                    method=p['method'],
                    amount=Decimal(str(p['amount'])),
                    reference=p.get('reference', ''),
                    status=Payment.STATUS_PAID
                )

            # Customer points
            if customer:
                customer.points += int(final_total // 10)
                customer.save()

            # Audit Log
            AuditLog.objects.create(
                user=request.user,
                action='SALE_COMPLETED',
                entity='Sale',
                entity_id=str(sale.id),
                metadata={'invoice_no': sale.invoice_no, 'total': str(sale.total), 'cashier': request.user.username}
            )

        output_serializer = SaleSerializer(sale)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        sale = self.get_object()
        if sale.status == Sale.STATUS_CANCELLED:
            return Response({'error': 'Sale is already cancelled'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            sale.status = Sale.STATUS_CANCELLED
            sale.save()

            # Restore inventory
            for item in sale.items.all():
                inv, _ = Inventory.objects.select_for_update().get_or_create(product=item.product, branch=sale.branch)
                prev_qty = inv.quantity
                inv.quantity += (item.quantity - item.returned_quantity)
                inv.save()

                InventoryTransaction.objects.create(
                    product=item.product,
                    branch=sale.branch,
                    type=InventoryTransaction.TYPE_RETURN,
                    quantity=(item.quantity - item.returned_quantity),
                    previous_quantity=prev_qty,
                    new_quantity=inv.quantity,
                    reference_type='cancellation',
                    reference_id=sale.invoice_no,
                    note=f"Sale cancelled: {sale.invoice_no}",
                    created_by=request.user
                )

            AuditLog.objects.create(
                user=request.user,
                action='SALE_CANCELLED',
                entity='Sale',
                entity_id=str(sale.id),
                metadata={'invoice_no': sale.invoice_no}
            )

        return Response({'message': f'Sale {sale.invoice_no} cancelled successfully and stock restored'})

    @action(detail=True, methods=['post'])
    def return_sale(self, request, pk=None):
        sale = self.get_object()
        if sale.status == Sale.STATUS_CANCELLED:
            return Response({'error': 'Cannot return a cancelled sale'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = ProcessReturnSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        with transaction.atomic():
            total_refund = Decimal('0.00')
            sale_return = SaleReturn.objects.create(
                sale=sale,
                processed_by=request.user,
                reason=data.get('reason', '')
            )

            for ret_item in data['items']:
                item = SaleItem.objects.select_for_update().get(id=ret_item['sale_item_id'], sale=sale)
                ret_qty = ret_item['quantity']

                remaining_returnable = item.quantity - item.returned_quantity
                if ret_qty > remaining_returnable:
                    return Response({
                        'error': f"Cannot return {ret_qty} of '{item.product.name}'. Max returnable: {remaining_returnable}"
                    }, status=status.HTTP_400_BAD_REQUEST)

                # Compute refund proportional to unit_price and taxes
                unit_refund = item.line_total / Decimal(str(item.quantity))
                item_refund = (unit_refund * Decimal(str(ret_qty))).quantize(Decimal('0.01'))
                total_refund += item_refund

                item.returned_quantity += ret_qty
                item.save()

                SaleReturnItem.objects.create(
                    sale_return=sale_return,
                    sale_item=item,
                    product=item.product,
                    quantity=ret_qty,
                    refund_amount=item_refund
                )

                # Return stock to inventory
                inv, _ = Inventory.objects.select_for_update().get_or_create(product=item.product, branch=sale.branch)
                prev_qty = inv.quantity
                inv.quantity += ret_qty
                inv.save()

                InventoryTransaction.objects.create(
                    product=item.product,
                    branch=sale.branch,
                    type=InventoryTransaction.TYPE_RETURN,
                    quantity=ret_qty,
                    previous_quantity=prev_qty,
                    new_quantity=inv.quantity,
                    reference_type='return',
                    reference_id=sale.invoice_no,
                    note=f"Returned from invoice {sale.invoice_no}",
                    created_by=request.user
                )

            sale_return.total_refund = total_refund
            sale_return.save()

            # Update sale status
            all_returned = all(it.returned_quantity >= it.quantity for it in sale.items.all())
            sale.status = Sale.STATUS_RETURNED if all_returned else Sale.STATUS_PARTIAL_RETURN
            sale.save()

            AuditLog.objects.create(
                user=request.user,
                action='SALE_RETURN',
                entity='SaleReturn',
                entity_id=str(sale_return.id),
                metadata={'invoice_no': sale.invoice_no, 'refund': str(total_refund)}
            )

        return Response({
            'message': 'Return processed successfully',
            'total_refund': total_refund,
            'status': sale.status
        }, status=status.HTTP_200_OK)

class PaymentViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Payment.objects.all().select_related('sale').order_by('-created_at')
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
