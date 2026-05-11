from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    ThrottledTokenObtainPairView,
    UserListCreateView,
    UserDetailView,
    MeView,
    MeStatsView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
    AdminResetPasswordView,
    ChangeMyPasswordView,
)

urlpatterns = [
    path('auth/login/',                  ThrottledTokenObtainPairView.as_view(), name='token_obtain'),
    path('auth/refresh/',                TokenRefreshView.as_view(),             name='token_refresh'),
    path('auth/password-reset/',         PasswordResetRequestView.as_view(),     name='password_reset_request'),
    path('auth/password-reset/confirm/', PasswordResetConfirmView.as_view(),     name='password_reset_confirm'),

    path('users/',                         UserListCreateView.as_view(),     name='user_list'),
    path('users/me/',                      MeView.as_view(),                 name='user_me'),
    path('users/me/stats/',                MeStatsView.as_view(),            name='me_stats'),
    path('users/me/change-password/',      ChangeMyPasswordView.as_view(),   name='change_my_password'),
    path('users/<int:pk>/',                UserDetailView.as_view(),         name='user_detail'),
    path('users/<int:pk>/reset-password/', AdminResetPasswordView.as_view(), name='admin_reset_password'),
]