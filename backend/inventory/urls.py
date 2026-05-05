from django.urls import path
from .views import (
    CategoryListCreateView, CategoryDetailView,
    ProductListCreateView, ProductDetailView,
    StockInView, StockAdjustmentView, StockMovementListView,
)

urlpatterns = [
    path('categories/', CategoryListCreateView.as_view(), name='category_list'),
    path('categories/<int:pk>/', CategoryDetailView.as_view(), name='category_detail'),
    path('products/', ProductListCreateView.as_view(), name='product_list'),
    path('products/<int:pk>/', ProductDetailView.as_view(), name='product_detail'),
    path('stock-in/', StockInView.as_view(), name='stock_in'),
    path('stock-adjustment/', StockAdjustmentView.as_view(), name='stock_adjustment'),
    path('stock-movements/', StockMovementListView.as_view(), name='stock_movements'),
]
