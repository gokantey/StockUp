from rest_framework import generics, status
from rest_framework.response import Response
from .models import Supplier
from .serializers import SupplierSerializer
from accounts.views import IsAdmin


class SupplierListCreateView(generics.ListCreateAPIView):
    serializer_class = SupplierSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        return Supplier.objects.filter(is_active=True).order_by('name')


class SupplierDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    permission_classes = [IsAdmin]

    def destroy(self, request, *args, **kwargs):
        supplier = self.get_object()
        supplier.is_active = False
        supplier.save()
        return Response(status=status.HTTP_204_NO_CONTENT)
