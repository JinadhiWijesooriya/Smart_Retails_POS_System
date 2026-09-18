from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from apps.accounts.views import UserViewSet, RoleViewSet
from apps.branches.views import BranchViewSet
from apps.categories.views import CategoryViewSet
from apps.suppliers.views import SupplierViewSet
from apps.products.views import ProductViewSet
from apps.inventory.views import InventoryViewSet
from apps.customers.views import CustomerViewSet
from apps.sales.views import SaleViewSet, PaymentViewSet
from apps.purchases.views import PurchaseViewSet
from apps.audit.views import AuditLogViewSet
from apps.reports.views import (
    DashboardSummaryView, DashboardSalesChartView, DashboardTopProductsView,
    ReportsSalesView, ReportsProfitView, ReportsInventoryView
)

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'roles', RoleViewSet, basename='role')
router.register(r'branches', BranchViewSet, basename='branch')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'suppliers', SupplierViewSet, basename='supplier')
router.register(r'products', ProductViewSet, basename='product')
router.register(r'inventory', InventoryViewSet, basename='inventory')
router.register(r'customers', CustomerViewSet, basename='customer')
router.register(r'sales', SaleViewSet, basename='sale')
router.register(r'payments', PaymentViewSet, basename='payment')
router.register(r'purchases', PurchaseViewSet, basename='purchase')
router.register(r'audit', AuditLogViewSet, basename='audit')

urlpatterns = [
    path('admin/', admin.site.urls),

    # Auth
    path('api/v1/auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/v1/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Dashboard & Reports
    path('api/v1/dashboard/summary/', DashboardSummaryView.as_view(), name='dashboard-summary'),
    path('api/v1/dashboard/sales-chart/', DashboardSalesChartView.as_view(), name='dashboard-sales-chart'),
    path('api/v1/dashboard/top-products/', DashboardTopProductsView.as_view(), name='dashboard-top-products'),
    path('api/v1/reports/sales/', ReportsSalesView.as_view(), name='reports-sales'),
    path('api/v1/reports/profit/', ReportsProfitView.as_view(), name='reports-profit'),
    path('api/v1/reports/inventory/', ReportsInventoryView.as_view(), name='reports-inventory'),

    # Core Router APIs
    path('api/v1/', include(router.urls)),
]
