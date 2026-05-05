from rest_framework import serializers
from .models import Category, Product, StockMovement


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model  = Category
        fields = ['id', 'name']

    def validate_name(self, value):
        return value.strip()


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    is_low_stock  = serializers.BooleanField(read_only=True)

    class Meta:
        model  = Product
        fields = [
            'id', 'name', 'sku', 'category', 'category_name', 'unit',
            'cost_price', 'selling_price', 'reorder_level',
            'stock_quantity', 'is_low_stock', 'is_active',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'sku', 'stock_quantity', 'created_at', 'updated_at']

    def validate_name(self, value):
        return value.strip()

    def validate_unit(self, value):
        return value.strip() if value else value

    def validate_cost_price(self, value):
        if value < 0:
            raise serializers.ValidationError('Cost price cannot be negative.')
        return value

    def validate_selling_price(self, value):
        if value < 0:
            raise serializers.ValidationError('Selling price cannot be negative.')
        return value

    def validate_reorder_level(self, value):
        if value < 0:
            raise serializers.ValidationError('Reorder level cannot be negative.')
        return value


class StockMovementSerializer(serializers.ModelSerializer):
    product_name    = serializers.CharField(source='product.name',         read_only=True)
    supplier_name   = serializers.CharField(source='supplier.name',        read_only=True)
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)

    class Meta:
        model  = StockMovement
        fields = [
            'id', 'product', 'product_name', 'movement_type', 'quantity',
            'adjustment_delta', 'unit_cost', 'supplier', 'supplier_name', 'note',
            'created_by', 'created_by_name', 'created_at',
            'is_voided', 'void_reason',
        ]
        read_only_fields = [
            'id', 'movement_type', 'created_by', 'created_at', 'is_voided', 'void_reason',
        ]

    def validate_quantity(self, value):
        if value < 1:
            raise serializers.ValidationError('Quantity must be at least 1.')
        return value

    def validate_unit_cost(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError('Unit cost cannot be negative.')
        return value

    def validate_note(self, value):
        return value.strip()[:500] if value else value