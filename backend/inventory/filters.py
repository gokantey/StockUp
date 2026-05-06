import django_filters
from .models import Product, StockMovement


class ProductFilter(django_filters.FilterSet):
    low_stock = django_filters.BooleanFilter(method='filter_low_stock')
    category  = django_filters.NumberFilter(field_name='category_id')
    archived  = django_filters.BooleanFilter(method='filter_archived')

    class Meta:
        model  = Product
        fields = ['category', 'low_stock', 'archived']

    def filter_low_stock(self, queryset, name, value):
        if value:
            from django.db.models import F
            return queryset.filter(stock_quantity__lte=F('reorder_level'))
        return queryset

    def filter_archived(self, queryset, name, value):
        return queryset.filter(is_active=not value)


class StockMovementFilter(django_filters.FilterSet):
    type      = django_filters.CharFilter(field_name='movement_type')
    product   = django_filters.NumberFilter(field_name='product_id')
    date_from = django_filters.DateFilter(field_name='created_at__date', lookup_expr='gte')
    date_to   = django_filters.DateFilter(field_name='created_at__date', lookup_expr='lte')

    class Meta:
        model  = StockMovement
        fields = ['type', 'product', 'date_from', 'date_to']