from django.urls import path
from .views import SaleListView, SaleDetailView, CreateSaleView, VoidSaleView

urlpatterns = [
    path('sales/', SaleListView.as_view(), name='sale_list'),
    path('sales/new/', CreateSaleView.as_view(), name='sale_create'),
    path('sales/<int:pk>/', SaleDetailView.as_view(), name='sale_detail'),
    path('sales/<int:pk>/void/', VoidSaleView.as_view(), name='sale_void'),
]
