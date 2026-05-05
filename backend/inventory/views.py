from django.db import transaction
from rest_framework import generics, permissions, filters, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Category, Product, StockMovement
from .serializers import CategorySerializer, ProductSerializer, StockMovementSerializer
from accounts.views import IsAdmin


class CategoryListCreateView(generics.ListCreateAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]


class CategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAdmin]


class ProductListCreateView(generics.ListCreateAPIView):
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'sku', 'category__name']

    def get_queryset(self):
        show_archived = self.request.query_params.get('archived') == 'true'
        qs = Product.objects.select_related('category').filter(is_active=not show_archived)
        category = self.request.query_params.get('category')
        if category:
            qs = qs.filter(category_id=category)
        return qs

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdmin()]
        return [permissions.IsAuthenticated()]


class ProductDetailView(generics.RetrieveUpdateAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAdmin]


class StockInView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        serializer = StockMovementSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        product = serializer.validated_data['product']
        quantity = serializer.validated_data['quantity']

        movement = serializer.save(
            movement_type=StockMovement.IN,
            created_by=request.user,
        )
        product.stock_quantity += quantity
        product.save(update_fields=['stock_quantity'])

        return Response(StockMovementSerializer(movement).data, status=status.HTTP_201_CREATED)


class StockAdjustmentView(APIView):
    permission_classes = [IsAdmin]

    @transaction.atomic
    def post(self, request):
        product_id = request.data.get('product')
        new_quantity = request.data.get('new_quantity')
        reason = request.data.get('reason', '').strip()

        if not product_id or new_quantity is None:
            return Response({'detail': 'product and new_quantity are required.'}, status=status.HTTP_400_BAD_REQUEST)
        if not reason:
            return Response({'detail': 'A reason is required for stock adjustments.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            new_quantity = int(new_quantity)
            if new_quantity < 0:
                raise ValueError
        except (ValueError, TypeError):
            return Response({'detail': 'new_quantity must be a non-negative integer.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            product = Product.objects.get(pk=product_id, is_active=True)
        except Product.DoesNotExist:
            return Response({'detail': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)

        old_quantity = product.stock_quantity
        delta = new_quantity - old_quantity

        movement = StockMovement.objects.create(
            product=product,
            movement_type=StockMovement.ADJUST,
            quantity=abs(delta) if delta != 0 else 0,
            adjustment_delta=delta,
            created_by=request.user,
            note=f'Adjustment: {old_quantity} → {new_quantity}. Reason: {reason}',
        )

        product.stock_quantity = new_quantity
        product.save(update_fields=['stock_quantity'])

        return Response(StockMovementSerializer(movement).data, status=status.HTTP_201_CREATED)


class StockMovementListView(generics.ListAPIView):
    serializer_class = StockMovementSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = StockMovement.objects.select_related('product', 'supplier', 'created_by')
        product_id = self.request.query_params.get('product')
        movement_type = self.request.query_params.get('type')
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if product_id:
            qs = qs.filter(product_id=product_id)
        if movement_type:
            qs = qs.filter(movement_type=movement_type)
        if date_from:
            qs = qs.filter(created_at__date__gte=date_from)
        if date_to:
            qs = qs.filter(created_at__date__lte=date_to)
        return qs
