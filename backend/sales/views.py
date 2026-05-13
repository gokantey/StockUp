import logging
from django.db import transaction
from django.utils import timezone
from rest_framework import generics, permissions, filters, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Sale, SaleItem
from .serializers import SaleSerializer, CreateSaleSerializer
from .filters import SaleFilter
from inventory.models import Product, StockMovement
from accounts.views import IsAdmin

logger = logging.getLogger('stockup')


class SaleListView(generics.ListAPIView):
    serializer_class   = SaleSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_class    = SaleFilter
    filter_backends    = [filters.SearchFilter]
    search_fields      = [
        'id',
        'note',
        'created_by__full_name',
        'items__product__name',
        'items__product__sku',
    ]

    def get_queryset(self):
        return Sale.objects.prefetch_related(
            'items__product'
        ).select_related('created_by').order_by('-created_at')


class SaleDetailView(generics.RetrieveAPIView):
    queryset           = Sale.objects.prefetch_related('items__product').select_related('created_by')
    serializer_class   = SaleSerializer
    permission_classes = [permissions.IsAuthenticated]


class CreateSaleView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        serializer = CreateSaleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        note = str(data.get('note', '')).strip()[:500]
        sale = Sale.objects.create(created_by=request.user, note=note)

        for item_data in data['items']:
            product  = item_data['product']
            quantity = item_data['quantity']

            SaleItem.objects.create(
                sale=sale,
                product=product,
                quantity=quantity,
                unit_price_at_sale=product.selling_price,
                unit_cost_at_sale=product.cost_price,
            )
            StockMovement.objects.create(
                product=product,
                movement_type=StockMovement.OUT,
                quantity=quantity,
                created_by=request.user,
                note=f'Sale #{sale.id}',
            )
            Product.objects.filter(pk=product.pk).update(
                stock_quantity=product.stock_quantity - quantity
            )

        sale.refresh_from_db()
        logger.info(
            'Sale #%s created by user pk=%s — %d items, total=%s',
            sale.id, request.user.pk, len(data['items']), sale.total,
        )
        return Response(SaleSerializer(sale).data, status=status.HTTP_201_CREATED)


class VoidSaleView(APIView):
    permission_classes = [IsAdmin]

    @transaction.atomic
    def post(self, request, pk):
        try:
            sale = Sale.objects.prefetch_related('items__product').get(pk=pk)
        except Sale.DoesNotExist:
            return Response({'detail': 'Sale not found.'}, status=status.HTTP_404_NOT_FOUND)

        if sale.is_voided:
            return Response(
                {'detail': 'This sale has already been voided.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        void_reason = str(request.data.get('void_reason', '')).strip()[:500]
        if not void_reason:
            return Response(
                {'detail': 'A reason is required to void a sale.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        for item in sale.items.all():
            Product.objects.filter(pk=item.product.pk).update(
                stock_quantity=item.product.stock_quantity + item.quantity
            )
            StockMovement.objects.create(
                product=item.product,
                movement_type=StockMovement.IN,
                quantity=item.quantity,
                created_by=request.user,
                note=f'Void of Sale #{sale.id}: {void_reason}',
            )

        sale.is_voided   = True
        sale.void_reason = void_reason
        sale.voided_by   = request.user
        sale.voided_at   = timezone.now()
        sale.save()

        logger.info(
            'Sale #%s voided by admin pk=%s. Reason: %s',
            sale.id, request.user.pk, void_reason,
        )
        return Response(SaleSerializer(sale).data)