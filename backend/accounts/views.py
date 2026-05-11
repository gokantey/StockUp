import logging
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.conf import settings
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.throttling import AnonRateThrottle
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework.exceptions import AuthenticationFailed, NotAuthenticated
from .serializers import UserSerializer, CreateUserSerializer, UpdateUserSerializer

logger = logging.getLogger('stockup')
User = get_user_model()

ALLOWED_REDIRECT_HOSTS = [
    'localhost:5173',
    '127.0.0.1:5173',
]


def is_safe_redirect_url(url: str) -> bool:
    from urllib.parse import urlparse
    try:
        parsed = urlparse(url)
        return parsed.netloc in ALLOWED_REDIRECT_HOSTS
    except Exception:
        return False


# ─── Permissions ──────────────────────────────────────────────────────────────

class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'admin'
        )


# ─── Throttles ────────────────────────────────────────────────────────────────

class LoginThrottle(AnonRateThrottle):
    scope = 'login'


class PasswordResetThrottle(AnonRateThrottle):
    scope = 'password_reset'


# ─── Auth ─────────────────────────────────────────────────────────────────────

class ThrottledTokenObtainPairView(TokenObtainPairView):
    throttle_classes = [LoginThrottle]

    def handle_exception(self, exc):
        if isinstance(exc, (AuthenticationFailed, NotAuthenticated, InvalidToken, TokenError)):
            logger.warning('Failed login attempt for email: %s', self.request.data.get('email', '<unknown>'))
            return Response({'detail': 'Invalid credentials.'}, status=status.HTTP_401_UNAUTHORIZED)
        return super().handle_exception(exc)


class PasswordResetRequestView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes   = [PasswordResetThrottle]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        if not email:
            return Response({'detail': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = User.objects.get(email=email, is_active=True)
            token = default_token_generator.make_token(user)
            uid   = urlsafe_base64_encode(force_bytes(user.pk))
            frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
            reset_link   = f'{frontend_url}/reset-password/{uid}/{token}/'
            send_mail(
                subject='StockUp — Password Reset',
                message=(
                    f'Hi {user.full_name},\n\n'
                    f'Click the link below to reset your password. '
                    f'This link expires in 1 hour.\n\n{reset_link}\n\n'
                    f'If you did not request this, ignore this email.'
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
            )
            logger.info('Password reset email sent to %s', email)
        except User.DoesNotExist:
            logger.info('Password reset requested for unknown email: %s', email)
        except Exception:
            logger.exception('Failed to send password reset email to %s', email)
        return Response({'detail': 'If that email is registered, a reset link has been sent.'}, status=status.HTTP_200_OK)


class PasswordResetConfirmView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        uid      = request.data.get('uid', '')
        token    = request.data.get('token', '')
        password = request.data.get('password', '')
        if not all([uid, token, password]):
            return Response({'detail': 'uid, token and password are required.'}, status=status.HTTP_400_BAD_REQUEST)
        if len(password) < 8:
            return Response({'detail': 'Password must be at least 8 characters.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            pk   = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=pk, is_active=True)
        except (User.DoesNotExist, ValueError, TypeError, OverflowError):
            logger.warning('Invalid password reset attempt — bad uid: %s', uid)
            return Response({'detail': 'Reset link is invalid or has expired.'}, status=status.HTTP_400_BAD_REQUEST)
        if not default_token_generator.check_token(user, token):
            logger.warning('Invalid/expired reset token for user pk=%s', pk)
            return Response({'detail': 'Reset link is invalid or has expired.'}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(password)
        user.save()
        logger.info('Password reset successful for user pk=%s', pk)
        return Response({'detail': 'Password updated successfully.'})


# ─── User management ──────────────────────────────────────────────────────────

class UserListCreateView(generics.ListCreateAPIView):
    queryset           = User.objects.all().order_by('full_name')
    permission_classes = [IsAdmin]

    def get_serializer_class(self):
        return CreateUserSerializer if self.request.method == 'POST' else UserSerializer

    def perform_create(self, serializer):
        user = serializer.save()
        logger.info('User created: %s (by admin pk=%s)', user.email, self.request.user.pk)


class UserDetailView(generics.RetrieveUpdateAPIView):
    queryset           = User.objects.all()
    permission_classes = [IsAdmin]

    def get_serializer_class(self):
        return UpdateUserSerializer if self.request.method in ('PUT', 'PATCH') else UserSerializer

    def perform_update(self, serializer):
        user = serializer.save()
        logger.info('User updated: pk=%s (by admin pk=%s)', user.pk, self.request.user.pk)


class MeView(generics.RetrieveAPIView):
    serializer_class   = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


# ─── Admin resets a specific user's password ──────────────────────────────────

class AdminResetPasswordView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        new_password = str(request.data.get('new_password', '')).strip()
        if not new_password:
            return Response({'detail': 'new_password is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if len(new_password) < 8:
            return Response({'detail': 'Password must be at least 8 characters.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        user.set_password(new_password)
        user.save()
        logger.info('Admin pk=%s reset password for user pk=%s (%s)', request.user.pk, user.pk, user.email)
        return Response({'detail': f'Password updated for {user.full_name}.'})


# ─── Logged-in user changes their own password ────────────────────────────────

class ChangeMyPasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        current_password = str(request.data.get('current_password', '')).strip()
        new_password     = str(request.data.get('new_password', '')).strip()
        if not current_password or not new_password:
            return Response({'detail': 'current_password and new_password are required.'}, status=status.HTTP_400_BAD_REQUEST)
        if len(new_password) < 8:
            return Response({'detail': 'New password must be at least 8 characters.'}, status=status.HTTP_400_BAD_REQUEST)
        if not request.user.check_password(current_password):
            logger.warning('Failed change-password attempt for user pk=%s', request.user.pk)
            return Response({'detail': 'Current password is incorrect.'}, status=status.HTTP_400_BAD_REQUEST)
        request.user.set_password(new_password)
        request.user.save()
        logger.info('User pk=%s changed their own password', request.user.pk)
        return Response({'detail': 'Password changed successfully.'})


# ─── Personal activity stats ──────────────────────────────────────────────────

class MeStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from django.utils import timezone
        from django.db.models import Sum, F, ExpressionWrapper, DecimalField
        from sales.models import Sale, SaleItem

        user  = request.user
        today = timezone.now().date()

        user_sales  = Sale.objects.filter(created_by=user, is_voided=False)
        today_sales = user_sales.filter(created_at__date=today)

        def revenue_sum(qs):
            return SaleItem.objects.filter(sale__in=qs).aggregate(
                total=Sum(ExpressionWrapper(
                    F('quantity') * F('unit_price_at_sale'),
                    output_field=DecimalField(max_digits=14, decimal_places=2)
                ))
            )['total'] or 0

        total_revenue = revenue_sum(user_sales)
        today_revenue = revenue_sum(today_sales)

        recent = user_sales.order_by('-created_at')[:5]
        recent_data = []
        for sale in recent:
            sale_total = revenue_sum(Sale.objects.filter(pk=sale.pk))
            recent_data.append({
                'id':         sale.id,
                'created_at': sale.created_at,
                'items':      sale.items.count(),
                'total':      float(sale_total),
            })

        return Response({
            'total_sales':   user_sales.count(),
            'total_revenue': float(total_revenue),
            'today_sales':   today_sales.count(),
            'today_revenue': float(today_revenue),
            'recent_sales':  recent_data,
        })