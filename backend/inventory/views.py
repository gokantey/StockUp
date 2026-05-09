import logging
from django.db import transaction
from rest_framework import generics, permissions, filters, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Category, Product, StockMovement
from .serializers import CategorySerializer, ProductSerializer, StockMovementSerializer
from .filters import ProductFilter, StockMovementFilter
from accounts.views import IsAdmin

logger = logging.getLogger('stockup')


class CategoryListCreateView(generics.ListCreateAPIView):
    queryset         = Category.objects.all().order_by('name')
    serializer_class = CategorySerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdmin()]
        return [permissions.IsAuthenticated()]


class CategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset           = Category.objects.all()
    serializer_class   = CategorySerializer
    permission_classes = [IsAdmin]


class ProductListCreateView(generics.ListCreateAPIView):
    serializer_class = ProductSerializer
    filterset_class  = ProductFilter
    # Do NOT override filter_backends — let it inherit the global setting
    # which includes DjangoFilterBackend + SearchFilter + OrderingFilter
    search_fields   = ['name', 'sku', 'category__name']
    ordering_fields = ['name', 'stock_quantity', 'selling_price', 'created_at']
    ordering        = ['name']

    def get_queryset(self):
        # Return ALL products — ProductFilter.qs property handles is_active default
        return Product.objects.select_related('category')

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdmin()]
        return [permissions.IsAuthenticated()]


class ProductDetailView(generics.RetrieveUpdateAPIView):
    queryset           = Product.objects.all()
    serializer_class   = ProductSerializer
    permission_classes = [IsAdmin]


class StockInView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        serializer = StockMovementSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        product  = serializer.validated_data['product']
        quantity = serializer.validated_data['quantity']

        movement = serializer.save(
            movement_type=StockMovement.IN,
            created_by=request.user,
        )
        product.stock_quantity += quantity
        product.save(update_fields=['stock_quantity'])

        logger.info(
            'Stock IN: product="%s" qty=%d by user pk=%s',
            product.name, quantity, request.user.pk,
        )
        return Response(StockMovementSerializer(movement).data, status=status.HTTP_201_CREATED)


class StockAdjustmentView(APIView):
    permission_classes = [IsAdmin]

    @transaction.atomic
    def post(self, request):
        product_id   = request.data.get('product')
        new_quantity = request.data.get('new_quantity')
        reason       = str(request.data.get('reason', '')).strip()[:500]

        if not product_id or new_quantity is None:
            return Response(
                {'detail': 'product and new_quantity are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not reason:
            return Response(
                {'detail': 'A reason is required for stock adjustments.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            new_quantity = int(new_quantity)
            if new_quantity < 0:
                raise ValueError
        except (ValueError, TypeError):
            return Response(
                {'detail': 'new_quantity must be a non-negative integer.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            product = Product.objects.get(pk=product_id, is_active=True)
        except Product.DoesNotExist:
            return Response({'detail': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)

        old_quantity = product.stock_quantity
        delta        = new_quantity - old_quantity

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

        logger.info(
            'Stock ADJUSTMENT: product="%s" %d→%d by admin pk=%s. Reason: %s',
            product.name, old_quantity, new_quantity, request.user.pk, reason,
        )
        return Response(StockMovementSerializer(movement).data, status=status.HTTP_201_CREATED)


class StockMovementListView(generics.ListAPIView):
    serializer_class   = StockMovementSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_class    = StockMovementFilter
    ordering           = ['-created_at']

    def get_queryset(self):
        return StockMovement.objects.select_related(
            'product', 'supplier', 'created_by'
        ).order_by('-created_at')