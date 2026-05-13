from rest_framework import serializers
from .models import Sale, SaleItem
from inventory.models import Product, StockMovement


class SaleItemInputSerializer(serializers.Serializer):
    product = serializers.PrimaryKeyRelatedField(queryset=Product.objects.filter(is_active=True))
    quantity = serializers.IntegerField(min_value=1)


class SaleItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    line_total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    unit_cost_at_sale = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    line_cost = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = SaleItem
        fields = ['id', 'product', 'product_name', 'product_sku', 'quantity', 'unit_price_at_sale', 'unit_cost_at_sale', 'line_total', 'line_cost']


class SaleSerializer(serializers.ModelSerializer):
    items = SaleItemSerializer(many=True, read_only=True)
    total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)
    voided_by_name = serializers.CharField(source='voided_by.full_name', read_only=True, default=None)

    class Meta:
        model = Sale
        fields = [
            'id', 'items', 'total', 'note',
            'created_by', 'created_by_name', 'created_at',
            'is_voided', 'void_reason', 'voided_by_name', 'voided_at',
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'is_voided', 'voided_by_name', 'voided_at']


class CreateSaleSerializer(serializers.Serializer):
    items = SaleItemInputSerializer(many=True, min_length=1)
    note = serializers.CharField(required=False, allow_blank=True, default='')

    def validate_items(self, items):
        errors = []
        for item in items:
            product = item['product']
            if item['quantity'] > product.stock_quantity:
                errors.append(
                    f'"{product.name}": only {product.stock_quantity} in stock, '
                    f'cannot sell {item["quantity"]}.'
                )
        if errors:
            raise serializers.ValidationError(errors)
        return items
