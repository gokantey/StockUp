from django.contrib import admin
from django.urls import path, include
from inventory.reports import (
    LowStockReportView,
    StockValueReportView,
    SalesSummaryReportView,
    DashboardStatsView,
    SalesTrendView,
    TopProductsView,
    SalesExportView,
    StockValueExportView,
    ProfitLossReportView,
    ProfitLossExportView,
    EndOfDaySummaryView,
)

from audit.views import AuditLogListView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('accounts.urls')),
    path('api/', include('inventory.urls')),
    path('api/', include('suppliers.urls')),
    path('api/', include('sales.urls')),
    path('api/audit/', AuditLogListView.as_view(), name='audit_logs'),
    path('api/reports/end-of-day/', EndOfDaySummaryView.as_view(), name='report_end_of_day'),
    path('api/reports/low-stock/', LowStockReportView.as_view(), name='report_low_stock'),
    path('api/reports/stock-value/', StockValueReportView.as_view(), name='report_stock_value'),
    path('api/reports/sales-summary/', SalesSummaryReportView.as_view(), name='report_sales_summary'),
    path('api/dashboard/', DashboardStatsView.as_view(), name='dashboard_stats'),
    path('api/dashboard/sales-trend/', SalesTrendView.as_view(), name='sales_trend'),
    path('api/dashboard/top-products/', TopProductsView.as_view(), name='top_products'),
    path('api/sales/export/', SalesExportView.as_view(), name='sales_export'),
    path('api/reports/stock-value/export/', StockValueExportView.as_view(), name='stock_value_export'),
    path('api/reports/profit-loss/', ProfitLossReportView.as_view(), name='report_profit_loss'),
    path('api/reports/profit-loss/export/', ProfitLossExportView.as_view(), name='profit_loss_export'),
]
