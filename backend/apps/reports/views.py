from decimal import Decimal
from django.utils import timezone
from django.db.models import Sum, Count, F, Q
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions

from apps.sales.models import Sale, SaleItem, Payment
from apps.products.models import Product
from apps.customers.models import Customer
from apps.inventory.models import Inventory

class DashboardSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        today = timezone.now().date()
        today_sales = Sale.objects.filter(created_at__date=today, status=Sale.STATUS_COMPLETED)
        
        today_revenue = today_sales.aggregate(total=Sum('total'))['total'] or Decimal('0.00')
        today_orders_count = today_sales.count()

        total_products = Product.objects.filter(status='active').count()
        total_customers = Customer.objects.count()

        # Low stock count
        low_stock_count = 0
        for inv in Inventory.objects.select_for_update():
            if inv.quantity <= inv.product.min_stock:
                low_stock_count += 1

        # Payment methods breakdown for today
        payment_breakdown = Payment.objects.filter(sale__in=today_sales).values('method').annotate(
            total_amount=Sum('amount'),
            count=Count('id')
        )

        return Response({
            'today_revenue': today_revenue,
            'today_orders_count': today_orders_count,
            'total_products': total_products,
            'total_customers': total_customers,
            'low_stock_count': low_stock_count,
            'payment_breakdown': payment_breakdown,
        })

class DashboardSalesChartView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        days = int(request.query_params.get('days', 7))
        start_date = timezone.now().date() - timezone.timedelta(days=days-1)
        
        sales = Sale.objects.filter(created_at__date__gte=start_date, status=Sale.STATUS_COMPLETED)
        
        # Group by day
        chart_data = []
        for i in range(days):
            day = start_date + timezone.timedelta(days=i)
            day_sales = sales.filter(created_at__date=day)
            day_rev = day_sales.aggregate(total=Sum('total'))['total'] or Decimal('0.00')
            day_orders = day_sales.count()
            chart_data.append({
                'date': day.strftime('%Y-%m-%d'),
                'label': day.strftime('%b %d'),
                'revenue': float(day_rev),
                'orders': day_orders,
            })

        return Response(chart_data)

class DashboardTopProductsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        top_items = SaleItem.objects.filter(sale__status=Sale.STATUS_COMPLETED).values(
            'product_id', 'product__name', 'product__sku'
        ).annotate(
            total_qty_sold=Sum('quantity'),
            total_sales_amount=Sum('line_total')
        ).order_by('-total_qty_sold')[:8]

        return Response(list(top_items))

class ReportsSalesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        qs = Sale.objects.filter(status=Sale.STATUS_COMPLETED)
        if date_from:
            qs = qs.filter(created_at__date__gte=date_from)
        if date_to:
            qs = qs.filter(created_at__date__lte=date_to)

        total_sales = qs.aggregate(
            total_revenue=Sum('total'),
            total_subtotal=Sum('subtotal'),
            total_tax=Sum('tax'),
            total_discount=Sum('discount'),
            orders_count=Count('id')
        )

        return Response({
            'metrics': total_sales,
            'sales_count': qs.count()
        })

class ReportsProfitView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        items_qs = SaleItem.objects.filter(sale__status=Sale.STATUS_COMPLETED).select_related('product')
        if date_from:
            items_qs = items_qs.filter(sale__created_at__date__gte=date_from)
        if date_to:
            items_qs = items_qs.filter(sale__created_at__date__lte=date_to)

        total_revenue = Decimal('0.00')
        total_cost = Decimal('0.00')

        for item in items_qs:
            total_revenue += item.line_total
            total_cost += (item.product.cost_price * item.quantity)

        gross_profit = total_revenue - total_cost
        margin_percent = (gross_profit / total_revenue * 100) if total_revenue > 0 else Decimal('0.00')

        return Response({
            'total_revenue': total_revenue,
            'total_cost': total_cost,
            'gross_profit': gross_profit,
            'margin_percent': round(float(margin_percent), 2)
        })

class ReportsInventoryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        inventories = Inventory.objects.select_related('product', 'branch').all()
        total_items_in_stock = sum(inv.quantity for inv in inventories)
        total_valuation_cost = sum(inv.quantity * inv.product.cost_price for inv in inventories)
        total_valuation_retail = sum(inv.quantity * inv.product.selling_price for inv in inventories)

        return Response({
            'total_items_in_stock': total_items_in_stock,
            'total_valuation_cost': total_valuation_cost,
            'total_valuation_retail': total_valuation_retail,
            'potential_profit': total_valuation_retail - total_valuation_cost
        })
