from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    ThrottledTokenObtainPairView,
    UserListCreateView,
    UserDetailView,
    MeView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
)

urlpatterns = [
    path('auth/login/',                  ThrottledTokenObtainPairView.as_view(), name='token_obtain'),
    path('auth/refresh/',                TokenRefreshView.as_view(),             name='token_refresh'),
    path('auth/password-reset/',         PasswordResetRequestView.as_view(),     name='password_reset_request'),
    path('auth/password-reset/confirm/', PasswordResetConfirmView.as_view(),     name='password_reset_confirm'),
    path('users/',                       UserListCreateView.as_view(),           name='user_list'),
    path('users/<int:pk>/',              UserDetailView.as_view(),               name='user_detail'),
    path('users/me/',                    MeView.as_view(),                       name='user_me'),
]