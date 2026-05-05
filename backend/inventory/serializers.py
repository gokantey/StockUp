from rest_framework import serializers
from .models import Category, Product, StockMovement


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name']


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    is_low_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'sku', 'category', 'category_name', 'unit',
            'cost_price', 'selling_price', 'reorder_level',
            'stock_quantity', 'is_low_stock', 'is_active',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'sku', 'stock_quantity', 'created_at', 'updated_at']


class StockMovementSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)

    class Meta:
        model = StockMovement
        fields = [
            'id', 'product', 'product_name', 'movement_type', 'quantity',
            'adjustment_delta', 'unit_cost', 'supplier', 'supplier_name', 'note',
            'created_by', 'created_by_name', 'created_at',
            'is_voided', 'void_reason',
        ]
        read_only_fields = ['id', 'movement_type', 'created_by', 'created_at', 'is_voided', 'void_reason']
