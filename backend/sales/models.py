from django.db import models
from django.conf import settings


class Sale(models.Model):
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    note = models.TextField(blank=True)
    is_voided = models.BooleanField(default=False)
    void_reason = models.TextField(blank=True)
    voided_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='voided_sales'
    )
    voided_at = models.DateTimeField(null=True, blank=True)

    @property
    def total(self):
        return sum(item.line_total for item in self.items.all())

    def __str__(self):
        return f'Sale #{self.id} — {self.created_at.date()}'

    class Meta:
        ordering = ['-created_at']


class SaleItem(models.Model):
    sale = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey('inventory.Product', on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField()
    unit_price_at_sale = models.DecimalField(max_digits=10, decimal_places=2)

    @property
    def line_total(self):
        return self.quantity * self.unit_price_at_sale

    def __str__(self):
        return f'{self.quantity} x {self.product.name}'
