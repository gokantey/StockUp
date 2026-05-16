from rest_framework import serializers
from .models import Category, Product, StockMovement, PurchaseOrder, PurchaseOrderItem


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


class PurchaseOrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)

    class Meta:
        model = PurchaseOrderItem
        fields = ['id', 'product', 'product_name', 'product_sku', 'ordered_qty', 'received_qty', 'rejected_qty', 'rejection_note', 'unit_cost']
        read_only_fields = ['id', 'received_qty', 'rejected_qty', 'rejection_note']


class PurchaseOrderSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True, default='')
    items = PurchaseOrderItemSerializer(many=True)

    class Meta:
        model = PurchaseOrder
        fields = [
            'id', 'po_number', 'supplier', 'supplier_name', 'status',
            'expected_date', 'notes', 'created_by', 'created_by_name',
            'created_at', 'updated_at', 'items'
        ]
        read_only_fields = ['id', 'po_number', 'created_by', 'created_at', 'updated_at']

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        po = PurchaseOrder.objects.create(**validated_data)
        for item_data in items_data:
            PurchaseOrderItem.objects.create(purchase_order=po, **item_data)
        return po