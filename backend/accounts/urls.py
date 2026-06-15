from django.urls import path
from .views import RegisterView, LoginView, RequestOTPView, VerifyOTPView
from .token_serializers import CustomTokenObtainPairView
from rest_framework_simplejwt.views import TokenRefreshView

# urlpatterns = [
#     path('register/', RegisterView.as_view(), name='register'),
#     path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
# from .views import LoginView, RegisterView, RequestOTPView, VerifyOTPView
# from rest_framework_simplejwt.views import (
#     TokenRefreshView,
# )

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='token_obtain_pair'),
    path('otp/request/', RequestOTPView.as_view(), name='otp_request'),
    path('otp/verify/', VerifyOTPView.as_view(), name='otp_verify'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
