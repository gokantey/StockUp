from django.db import models
from django.conf import settings

class AuditLog(models.Model):
    ACTION_CHOICES = [
        ('IN',     'Goods Arrived (IN)'),
        ('OUT',    'Goods Sold (OUT)'),
        ('ADJUST', 'Stock Adjusted'),
        ('CREATE', 'Added New'),
        ('UPDATE', 'Modified / Updated'),
        ('VOID',   'Cancelled / Voided'),
        ('LOGIN',  'Logged In'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs'
    )
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    model_name = models.CharField(max_length=50, db_index=True)
    object_id = models.CharField(max_length=255, db_index=True, null=True, blank=True)
    object_repr = models.CharField(max_length=255, null=True, blank=True)
    changes = models.JSONField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        user_email = self.user.email if self.user else "System"
        return f"{self.timestamp.strftime('%Y-%m-%d %H:%M:%S')} - {user_email} - {self.action} {self.model_name}"
