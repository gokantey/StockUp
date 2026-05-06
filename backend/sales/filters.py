import django_filters
from .models import Sale


class SaleFilter(django_filters.FilterSet):
    date_from  = django_filters.DateFilter(field_name='created_at__date', lookup_expr='gte')
    date_to    = django_filters.DateFilter(field_name='created_at__date', lookup_expr='lte')
    is_voided  = django_filters.BooleanFilter(field_name='is_voided')
    created_by = django_filters.NumberFilter(field_name='created_by_id')

    class Meta:
        model  = Sale
        fields = ['date_from', 'date_to', 'is_voided', 'created_by']