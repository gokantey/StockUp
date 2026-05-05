import logging
from rest_framework import serializers
from django.contrib.auth import get_user_model

logger = logging.getLogger('stockup')
User = get_user_model()

VALID_ROLES = ['admin', 'staff']


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model  = User
        fields = ['id', 'email', 'full_name', 'role', 'is_active', 'date_joined']
        read_only_fields = ['id', 'date_joined']


class CreateUserSerializer(serializers.ModelSerializer):
    password  = serializers.CharField(write_only=True, min_length=8, max_length=128)
    full_name = serializers.CharField(max_length=150)
    email     = serializers.EmailField(max_length=254)
    role      = serializers.ChoiceField(choices=VALID_ROLES, default='staff')

    class Meta:
        model  = User
        fields = ['email', 'full_name', 'role', 'password']

    def validate_email(self, value):
        value = value.strip().lower()
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return value

    def validate_full_name(self, value):
        return value.strip()

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class UpdateUserSerializer(serializers.ModelSerializer):
    password  = serializers.CharField(write_only=True, min_length=8, max_length=128, required=False, allow_blank=True)
    full_name = serializers.CharField(max_length=150, required=False)
    email     = serializers.EmailField(max_length=254, required=False)
    role      = serializers.ChoiceField(choices=VALID_ROLES, required=False)

    class Meta:
        model  = User
        fields = ['email', 'full_name', 'role', 'is_active', 'password']

    def validate_email(self, value):
        value = value.strip().lower()
        if User.objects.filter(email=value).exclude(pk=self.instance.pk).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return value

    def validate_full_name(self, value):
        return value.strip()

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        if password:
            instance.set_password(password)
            logger.info('Password changed for user pk=%s', instance.pk)
        instance.save()
        return instance