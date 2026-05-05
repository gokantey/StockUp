from rest_framework import serializers
from .models import Supplier


class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Supplier
        fields = ['id', 'name', 'contact_person', 'phone', 'email', 'address', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']

    def validate_name(self, value):
        return value.strip()

    def validate_contact_person(self, value):
        return value.strip() if value else value

    def validate_phone(self, value):
        return value.strip() if value else value

    def validate_email(self, value):
        return value.strip().lower() if value else value

    def validate_address(self, value):
        if value and len(value) > 500:
            raise serializers.ValidationError('Address must be 500 characters or fewer.')
        return value.strip() if value else value