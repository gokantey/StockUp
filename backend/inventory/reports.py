import csv
import logging
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

logger = logging.getLogger('stockup')


class LowStockReportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        products = Product.objects.filter(
            is_active=True,
            stock_quantity__lte=F('reorder_level'),
        ).select_related('category').values(
            'id', 'name', 'sku', 'stock_quantity', 'reorder_level', 'category__name'
        ).order_by('stock_quantity')
        return Response(list(products))


class StockValueReportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        products = list(
            Product.objects.filter(is_active=True)
            .select_related('category')
            .annotate(
                total_value=ExpressionWrapper(
                    F('stock_quantity') * F('cost_price'),
                    output_field=DecimalField(max_digits=14, decimal_places=2),
                )
            )
            .values('id', 'name', 'sku', 'category__name', 'stock_quantity', 'cost_price', 'total_value')
            .order_by('-total_value')
        )
        for p in products:
            p['category_name'] = p.pop('category__name', None)
        return Response(products)


class SalesSummaryReportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        qs = Sale.objects.filter(is_voided=False)
        date_from = request.query_params.get('date_from')
        date_to   = request.query_params.get('date_to')
        if date_from:
            qs = qs.filter(created_at__date__gte=date_from)
        if date_to:
            qs = qs.filter(created_at__date__lte=date_to)

        revenue_data = SaleItem.objects.filter(sale__in=qs).aggregate(
            total_revenue=Sum(
                ExpressionWrapper(
                    F('quantity') * F('unit_price_at_sale'),
                    output_field=DecimalField(max_digits=14, decimal_places=2),
                )
            ),
            total_items_sold=Sum('quantity'),
        )

        total_sales    = qs.count()
        total_revenue  = float(revenue_data['total_revenue'] or 0)
        avg_sale_value = round(total_revenue / total_sales, 2) if total_sales else 0

        trend_qs = (
            SaleItem.objects.filter(sale__in=qs)
            .annotate(date=TruncDate('sale__created_at'))
            .values('date')
            .annotate(
                revenue=Sum(
                    ExpressionWrapper(
                        F('quantity') * F('unit_price_at_sale'),
                        output_field=DecimalField(max_digits=14, decimal_places=2),
                    )
                )
            )
            .order_by('date')
        )

        return Response({
            'total_sales':      total_sales,
            'total_revenue':    total_revenue,
            'total_items_sold': revenue_data['total_items_sold'] or 0,
            'avg_sale_value':   avg_sale_value,
            'date_from':        date_from,
            'date_to':          date_to,
            'trend': [
                {'date': row['date'].strftime('%b %d'), 'revenue': float(row['revenue'] or 0)}
                for row in trend_qs
            ],
        })


class DashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        today = timezone.now().date()

        total_products  = Product.objects.filter(is_active=True).count()
        low_stock_count = Product.objects.filter(
            is_active=True, stock_quantity__lte=F('reorder_level')
        ).count()

        stock_value = Product.objects.filter(is_active=True).aggregate(
            total=Sum(
                ExpressionWrapper(
                    F('stock_quantity') * F('cost_price'),
                    output_field=DecimalField(max_digits=14, decimal_places=2),
                )
            )
        )['total'] or 0

        today_sales   = Sale.objects.filter(created_at__date=today, is_voided=False)
        today_revenue = SaleItem.objects.filter(sale__in=today_sales).aggregate(
            total=Sum(
                ExpressionWrapper(
                    F('quantity') * F('unit_price_at_sale'),
                    output_field=DecimalField(max_digits=14, decimal_places=2),
                )
            )
        )['total'] or 0

        return Response({
            'total_products':    total_products,
            'low_stock_count':   low_stock_count,
            'total_stock_value': float(stock_value),
            'today_sales_count': today_sales.count(),
            'today_revenue':     float(today_revenue),
        })


class SalesTrendView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        today = timezone.now().date()

        try:
            days = int(request.query_params.get('days', 7))
            days = max(1, min(days, 365))
        except (ValueError, TypeError):
            days = 7

        start    = today - timedelta(days=days - 1)
        sales_qs = Sale.objects.filter(created_at__date__gte=start, is_voided=False)

        by_day = (
            SaleItem.objects.filter(sale__in=sales_qs)
            .annotate(date=TruncDate('sale__created_at'))
            .values('date')
            .annotate(
                revenue=Sum(
                    ExpressionWrapper(
                        F('quantity') * F('unit_price_at_sale'),
                        output_field=DecimalField(max_digits=14, decimal_places=2),
                    )
                ),
                transactions=Count('sale', distinct=True),
            )
            .order_by('date')
        )

        by_date = {row['date']: row for row in by_day}
        result  = []
        for i in range(days):
            day = start + timedelta(days=i)
            row = by_date.get(day)
            result.append({
                'date':         day.strftime('%b %d'),
                'revenue':      float(row['revenue']) if row else 0,
                'transactions': row['transactions']   if row else 0,
            })
        return Response(result)


class TopProductsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        top = (
            SaleItem.objects.filter(sale__is_voided=False)
            .values('product__name')
            .annotate(
                units_sold=Sum('quantity'),
                revenue=Sum(
                    ExpressionWrapper(
                        F('quantity') * F('unit_price_at_sale'),
                        output_field=DecimalField(max_digits=14, decimal_places=2),
                    )
                )
            )
            .order_by('-units_sold')[:6]
        )
        return Response([{
            'name':       item['product__name'],
            'units_sold': item['units_sold'],
            'revenue':    float(item['revenue'] or 0),
        } for item in top])


class SalesExportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        qs = Sale.objects.prefetch_related('items__product').select_related('created_by')
        date_from = request.query_params.get('date_from')
        date_to   = request.query_params.get('date_to')
        if date_from:
            qs = qs.filter(created_at__date__gte=date_from)
        if date_to:
            qs = qs.filter(created_at__date__lte=date_to)

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="sales_export.csv"'
        writer = csv.writer(response)
        writer.writerow(['Receipt #', 'Date', 'Items', 'Total (GHS)', 'Staff', 'Status', 'Void Reason'])
        for sale in qs.order_by('-created_at'):
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
        products = (
            Product.objects.filter(is_active=True)
            .annotate(
                total_value=ExpressionWrapper(
                    F('stock_quantity') * F('cost_price'),
                    output_field=DecimalField(max_digits=14, decimal_places=2),
                )
            )
            .select_related('category')
            .order_by('name')
        )

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="inventory_value.csv"'
        writer = csv.writer(response)
        writer.writerow(['Product', 'SKU', 'Category', 'Stock Qty', 'Cost Price (GHS)', 'Stock Value (GHS)'])
        for p in products:
            writer.writerow([
                p.name,
                p.sku,
                p.category.name if p.category else '—',
                p.stock_quantity,
                f'{p.cost_price:.2f}',
                f'{p.total_value:.2f}' if p.total_value else '0.00',
            ])
        return response


class ProfitLossReportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        qs = SaleItem.objects.filter(sale__is_voided=False)
        date_from = request.query_params.get('date_from')
        date_to   = request.query_params.get('date_to')
        if date_from:
            qs = qs.filter(sale__created_at__date__gte=date_from)
        if date_to:
            qs = qs.filter(sale__created_at__date__lte=date_to)

        from django.db.models.functions import Coalesce
        qs = qs.annotate(
            actual_cost=Coalesce('unit_cost_at_sale', F('product__cost_price')),
            line_revenue=ExpressionWrapper(F('quantity') * F('unit_price_at_sale'), output_field=DecimalField(max_digits=14, decimal_places=2)),
            line_cogs=ExpressionWrapper(F('quantity') * F('actual_cost'), output_field=DecimalField(max_digits=14, decimal_places=2)),
            line_profit=ExpressionWrapper(
                (F('quantity') * F('unit_price_at_sale')) - (F('quantity') * F('actual_cost')),
                output_field=DecimalField(max_digits=14, decimal_places=2)
            )
        )

        totals = qs.aggregate(
            total_revenue=Sum('line_revenue'),
            total_cogs=Sum('line_cogs'),
            total_profit=Sum('line_profit'),
        )
        total_revenue = float(totals['total_revenue'] or 0)
        total_cogs = float(totals['total_cogs'] or 0)
        gross_profit = float(totals['total_profit'] or 0)
        gross_margin_pct = round((gross_profit / total_revenue * 100), 2) if total_revenue > 0 else 0

        # By product
        by_product_qs = qs.values(
            'product__name', 'product__category__name'
        ).annotate(
            units_sold=Sum('quantity'),
            revenue=Sum('line_revenue'),
            cogs=Sum('line_cogs'),
            gross_profit=Sum('line_profit')
        ).order_by('-gross_profit')

        by_product = []
        for p in by_product_qs:
            rev = float(p['revenue'] or 0)
            cogs = float(p['cogs'] or 0)
            profit = float(p['gross_profit'] or 0)
            margin = round((profit / rev * 100), 2) if rev > 0 else 0
            by_product.append({
                'product_name': p['product__name'],
                'category': p['product__category__name'] or '—',
                'units_sold': p['units_sold'],
                'revenue': rev,
                'cogs': cogs,
                'gross_profit': profit,
                'margin_pct': margin
            })

        # Trend (similar to SalesSummaryReportView)
        trend_qs = qs.annotate(date=TruncDate('sale__created_at')).values('date').annotate(
            revenue=Sum('line_revenue'),
            cogs=Sum('line_cogs'),
            profit=Sum('line_profit')
        ).order_by('date')

        trend = []
        for t in trend_qs:
            trend.append({
                'date': t['date'].strftime('%b %d'),
                'revenue': float(t['revenue'] or 0),
                'cogs': float(t['cogs'] or 0),
                'profit': float(t['profit'] or 0)
            })

        return Response({
            'total_revenue': total_revenue,
            'total_cogs': total_cogs,
            'gross_profit': gross_profit,
            'gross_margin_pct': gross_margin_pct,
            'by_product': by_product,
            'trend': trend
        })


class ProfitLossExportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        qs = SaleItem.objects.filter(sale__is_voided=False)
        date_from = request.query_params.get('date_from')
        date_to   = request.query_params.get('date_to')
        if date_from:
            qs = qs.filter(sale__created_at__date__gte=date_from)
        if date_to:
            qs = qs.filter(sale__created_at__date__lte=date_to)

        from django.db.models.functions import Coalesce
        qs = qs.annotate(
            actual_cost=Coalesce('unit_cost_at_sale', F('product__cost_price')),
            line_revenue=ExpressionWrapper(F('quantity') * F('unit_price_at_sale'), output_field=DecimalField(max_digits=14, decimal_places=2)),
            line_cogs=ExpressionWrapper(F('quantity') * F('actual_cost'), output_field=DecimalField(max_digits=14, decimal_places=2)),
            line_profit=ExpressionWrapper(
                (F('quantity') * F('unit_price_at_sale')) - (F('quantity') * F('actual_cost')),
                output_field=DecimalField(max_digits=14, decimal_places=2)
            )
        )

        by_product_qs = qs.values(
            'product__name', 'product__category__name'
        ).annotate(
            units_sold=Sum('quantity'),
            revenue=Sum('line_revenue'),
            cogs=Sum('line_cogs'),
            gross_profit=Sum('line_profit')
        ).order_by('-gross_profit')

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="profit_loss.csv"'
        writer = csv.writer(response)
        writer.writerow(['Product', 'Category', 'Units Sold', 'Revenue (GHS)', 'COGS (GHS)', 'Gross Profit (GHS)', 'Margin %'])

        for p in by_product_qs:
            rev = float(p['revenue'] or 0)
            profit = float(p['gross_profit'] or 0)
            margin = round((profit / rev * 100), 2) if rev > 0 else 0
            writer.writerow([
                p['product__name'],
                p['product__category__name'] or '—',
                p['units_sold'],
                f"{p['revenue']:.2f}",
                f"{p['cogs']:.2f}",
                f"{p['gross_profit']:.2f}",
                f"{margin:.2f}"
            ])

        return response


from .models import StockMovement
from django.db.models.functions import Coalesce

class EndOfDaySummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        date_str = request.query_params.get('date')
        if date_str:
            try:
                target_date = timezone.datetime.strptime(date_str, '%Y-%m-%d').date()
            except ValueError:
                return Response({'error': 'Invalid date format. Use YYYY-MM-DD.'}, status=400)
        else:
            target_date = timezone.now().date()

        # Sales for the day
        sales_items = SaleItem.objects.filter(
            sale__created_at__date=target_date,
            sale__is_voided=False
        ).annotate(
            actual_cost=Coalesce('unit_cost_at_sale', F('product__cost_price')),
            line_revenue=ExpressionWrapper(F('quantity') * F('unit_price_at_sale'), output_field=DecimalField(max_digits=14, decimal_places=2)),
            line_cogs=ExpressionWrapper(F('quantity') * F('actual_cost'), output_field=DecimalField(max_digits=14, decimal_places=2)),
        )

        totals = sales_items.aggregate(
            total_revenue=Sum('line_revenue'),
            total_cogs=Sum('line_cogs'),
            total_items=Sum('quantity'),
        )
        
        revenue = float(totals['total_revenue'] or 0)
        cogs = float(totals['total_cogs'] or 0)
        profit = revenue - cogs
        margin = round((profit / revenue * 100), 2) if revenue > 0 else 0
        
        transaction_count = Sale.objects.filter(
            created_at__date=target_date, 
            is_voided=False
        ).count()

        # Top Products
        top_products = sales_items.values('product__name').annotate(
            qty=Sum('quantity'),
            rev=Sum('line_revenue')
        ).order_by('-rev')[:5]

        # Inventory Changes
        movements = StockMovement.objects.filter(
            created_at__date=target_date,
            is_voided=False
        ).select_related('product')
        
        stock_in_count = movements.filter(movement_type='IN').count()
        stock_in_value = movements.filter(movement_type='IN').aggregate(
            total=Sum(F('quantity') * F('unit_cost'), output_field=DecimalField(max_digits=14, decimal_places=2))
        )['total'] or 0

        return Response({
            'date': target_date.strftime('%Y-%m-%d'),
            'summary': {
                'revenue': revenue,
                'cogs': cogs,
                'profit': profit,
                'margin_pct': margin,
                'transaction_count': transaction_count,
                'items_sold': totals['total_items'] or 0,
            },
            'top_products': [
                {'name': p['product__name'], 'qty': p['qty'], 'rev': float(p['rev'])} 
                for p in top_products
            ],
            'inventory': {
                'stock_in_count': stock_in_count,
                'stock_in_value': float(stock_in_value),
            }
        })