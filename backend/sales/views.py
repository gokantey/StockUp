from django.db import transaction
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Sale, SaleItem
from .serializers import SaleSerializer, CreateSaleSerializer
from inventory.models import Product, StockMovement


class SaleListView(generics.ListAPIView):
    serializer_class = SaleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Sale.objects.prefetch_related('items__product').select_related('created_by')
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if date_from:
            qs = qs.filter(created_at__date__gte=date_from)
        if date_to:
            qs = qs.filter(created_at__date__lte=date_to)
        return qs


class SaleDetailView(generics.RetrieveAPIView):
    queryset = Sale.objects.prefetch_related('items__product').select_related('created_by')
    serializer_class = SaleSerializer
    permission_classes = [permissions.IsAuthenticated]


class CreateSaleView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        serializer = CreateSaleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        sale = Sale.objects.create(created_by=request.user, note=data.get('note', ''))

        for item_data in data['items']:
            product = item_data['product']
            quantity = item_data['quantity']

            SaleItem.objects.create(
                sale=sale,
                product=product,
                quantity=quantity,
                unit_price_at_sale=product.selling_price,
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
        return Response(SaleSerializer(sale).data, status=status.HTTP_201_CREATED)


class VoidSaleView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request, pk):
        if request.user.role != 'admin':
            return Response({'detail': 'Only admins can void sales.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            sale = Sale.objects.prefetch_related('items__product').get(pk=pk)
        except Sale.DoesNotExist:
            return Response({'detail': 'Sale not found.'}, status=status.HTTP_404_NOT_FOUND)

        if sale.is_voided:
            return Response({'detail': 'This sale has already been voided.'}, status=status.HTTP_400_BAD_REQUEST)

        void_reason = request.data.get('void_reason', '').strip()
        if not void_reason:
            return Response({'detail': 'A reason is required to void a sale.'}, status=status.HTTP_400_BAD_REQUEST)

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

        sale.is_voided = True
        sale.void_reason = void_reason
        sale.voided_by = request.user
        sale.voided_at = timezone.now()
        sale.save()

        return Response(SaleSerializer(sale).data)
