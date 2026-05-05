import csv
from datetime import timedelta
from django.db.models import Sum, F, Count, ExpressionWrapper, DecimalField
from django.db.models.functions import TruncDate
from django.http import HttpResponse
from django.utils import timezone
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import permissions
from .models import Product
from sales.models import Sale, SaleItem


class LowStockReportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        products = Product.objects.filter(
            is_active=True,
            stock_quantity__lte=F('reorder_level'),
        ).select_related('category').values(
            'id', 'name', 'sku', 'stock_quantity', 'reorder_level', 'category__name'
        )
        return Response(list(products))


class StockValueReportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        products = Product.objects.filter(is_active=True).annotate(
            stock_value=ExpressionWrapper(
                F('stock_quantity') * F('cost_price'),
                output_field=DecimalField(max_digits=14, decimal_places=2),
            )
        ).values('id', 'name', 'sku', 'stock_quantity', 'cost_price', 'stock_value')

        total = sum(p['stock_value'] or 0 for p in products)
        return Response({'products': list(products), 'total_stock_value': total})


class SalesSummaryReportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        qs = Sale.objects.prefetch_related('items')
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        if date_from:
            qs = qs.filter(created_at__date__gte=date_from)
        if date_to:
            qs = qs.filter(created_at__date__lte=date_to)

        total_revenue = sum(sale.total for sale in qs)
        total_transactions = qs.count()

        return Response({
            'total_transactions': total_transactions,
            'total_revenue': total_revenue,
            'date_from': date_from,
            'date_to': date_to,
        })


class DashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from django.db.models import F
        today = timezone.now().date()

        total_products = Product.objects.filter(is_active=True).count()
        low_stock_count = Product.objects.filter(
            is_active=True, stock_quantity__lte=F('reorder_level')
        ).count()

        stock_value = Product.objects.filter(is_active=True).annotate(
            val=ExpressionWrapper(
                F('stock_quantity') * F('cost_price'),
                output_field=DecimalField(max_digits=14, decimal_places=2),
            )
        ).aggregate(total=Sum('val'))['total'] or 0

        today_sales = Sale.objects.filter(created_at__date=today)
        today_revenue = sum(s.total for s in today_sales)

        return Response({
            'total_products': total_products,
            'low_stock_count': low_stock_count,
            'total_stock_value': stock_value,
            'today_sales_count': today_sales.count(),
            'today_revenue': today_revenue,
        })


class SalesTrendView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        today = timezone.now().date()
        days = int(request.query_params.get('days', 7))
        start = today - timedelta(days=days - 1)

        sales_by_day = (
            Sale.objects.filter(created_at__date__gte=start)
            .annotate(date=TruncDate('created_at'))
            .values('date')
            .annotate(revenue=Sum('total'), transactions=Count('id'))
            .order_by('date')
        )
        by_date = {row['date']: row for row in sales_by_day}

        result = []
        for i in range(days):
            day = start + timedelta(days=i)
            row = by_date.get(day)
            result.append({
                'date': day.strftime('%b %d'),
                'revenue': float(row['revenue']) if row else 0,
                'transactions': row['transactions'] if row else 0,
            })
        return Response(result)


class TopProductsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        top = (
            SaleItem.objects.values('product__name')
            .annotate(
                units_sold=Sum('quantity'),
                revenue=Sum(ExpressionWrapper(
                    F('quantity') * F('unit_price_at_sale'),
                    output_field=DecimalField(max_digits=14, decimal_places=2),
                ))
            )
            .order_by('-units_sold')[:6]
        )
        return Response([{
            'name': item['product__name'],
            'units_sold': item['units_sold'],
            'revenue': float(item['revenue'] or 0),
        } for item in top])


class SalesExportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        qs = Sale.objects.prefetch_related('items__product').select_related('created_by')
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        if date_from:
            qs = qs.filter(created_at__date__gte=date_from)
        if date_to:
            qs = qs.filter(created_at__date__lte=date_to)

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="sales_export.csv"'

        writer = csv.writer(response)
        writer.writerow(['Receipt #', 'Date', 'Items', 'Total (GH₵)', 'Staff', 'Status', 'Void Reason'])
        for sale in qs:
            writer.writerow([
                f'#{str(sale.id).zfill(4)}',
                sale.created_at.strftime('%Y-%m-%d %H:%M'),
                sale.items.count(),
                f'{sale.total:.2f}',
                sale.created_by.full_name if sale.created_by else '—',
                'Voided' if sale.is_voided else 'Completed',
                sale.void_reason if sale.is_voided else '',
            ])
        return response


class StockValueExportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        products = Product.objects.filter(is_active=True).annotate(
            stock_value=ExpressionWrapper(
                F('stock_quantity') * F('cost_price'),
                output_field=DecimalField(max_digits=14, decimal_places=2),
            )
        ).select_related('category').order_by('name')

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="inventory_value.csv"'

        writer = csv.writer(response)
        writer.writerow(['Product', 'SKU', 'Category', 'Stock Qty', 'Cost Price (GH₵)', 'Stock Value (GH₵)'])
        for p in products:
            writer.writerow([
                p.name,
                p.sku,
                p.category.name if p.category else '—',
                p.stock_quantity,
                f'{p.cost_price:.2f}',
                f'{p.stock_value:.2f}' if p.stock_value else '0.00',
            ])
        return response
