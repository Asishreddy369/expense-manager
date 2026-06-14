from datetime import timedelta
from random import randint

from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import EmailOTP
from .serializers import (
    CustomTokenObtainPairSerializer,
    OTPRequestSerializer,
    OTPVerifySerializer,
    UserSerializer,
)

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = UserSerializer

    def perform_create(self, serializer):
        serializer.save()


class LoginView(TokenObtainPairView):
    permission_classes = (permissions.AllowAny,)
    serializer_class = CustomTokenObtainPairSerializer


class RequestOTPView(generics.GenericAPIView):
    permission_classes = (permissions.AllowAny,)
    serializer_class = OTPRequestSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data['user']
        EmailOTP.objects.filter(user=user, is_used=False).update(is_used=True)

        otp_code = f'{randint(0, 999999):06d}'
        expires_at = timezone.now() + timedelta(minutes=10)
        EmailOTP.objects.create(user=user, code=otp_code, expires_at=expires_at)

        send_mail(
            subject='Your Expense Manager login OTP',
            message=(
                f'Hello {user.username},\n\n'
                f'Your one-time password is {otp_code}.\n'
                'It will expire in 10 minutes.\n\n'
                'If you did not request this OTP, you can ignore this email.'
            ),
            from_email=None,
            recipient_list=[user.email],
            fail_silently=False,
        )

        return Response({'detail': f'OTP sent to {user.email}.'}, status=status.HTTP_200_OK)


class VerifyOTPView(generics.GenericAPIView):
    permission_classes = (permissions.AllowAny,)
    serializer_class = OTPVerifySerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data['user']
        otp_record = serializer.validated_data['otp_record']
        if otp_record is not None:
            otp_record.is_used = True
            otp_record.save(update_fields=['is_used'])

        refresh = CustomTokenObtainPairSerializer.get_token(user)
        return Response(
            {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            },
            status=status.HTTP_200_OK,
        )
