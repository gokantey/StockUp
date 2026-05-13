from rest_framework import generics
from .models import AuditLog
from .serializers import AuditLogSerializer
from accounts.views import IsAdmin

class AuditLogListView(generics.ListAPIView):
    queryset = AuditLog.objects.select_related('user').all()
    serializer_class = AuditLogSerializer
    permission_classes = [IsAdmin]
    filterset_fields = ['action', 'model_name', 'user']
    search_fields = ['object_repr', 'object_id', 'user__full_name', 'user__email']
    ordering_fields = ['timestamp']
    ordering = ['-timestamp']
