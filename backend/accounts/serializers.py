from django.conf import settings
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import EmailOTP

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    email = serializers.EmailField(required=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'first_name', 'last_name')

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = 'identifier'

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username  # embed username in JWT
        return token

    def validate(self, attrs):
        identifier = attrs.get('identifier', '').strip()
        password = attrs.get('password')

        user = (
            User.objects.filter(email__iexact=identifier).first()
            or User.objects.filter(username__iexact=identifier).first()
        )

        if user is None:
            raise serializers.ValidationError({'detail': 'No account found for these credentials.'})

        authenticated_user = authenticate(
            request=self.context.get('request'),
            username=user.username,
            password=password,
        )

        if authenticated_user is None:
            raise serializers.ValidationError({'detail': 'Incorrect password.'})

        refresh = self.get_token(authenticated_user)
        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }


class OTPRequestSerializer(serializers.Serializer):
    identifier = serializers.CharField()

    def validate_identifier(self, value):
        identifier = value.strip()
        if not identifier:
            raise serializers.ValidationError('Username or email is required.')
        return identifier

    def validate(self, attrs):
        identifier = attrs['identifier']
        user = (
            User.objects.filter(email__iexact=identifier).first()
            or User.objects.filter(username__iexact=identifier).first()
        )

        if user is None:
            raise serializers.ValidationError({'detail': 'No account found for this username or email.'})
        if not user.email:
            raise serializers.ValidationError({'detail': 'This account does not have an email address.'})

        attrs['user'] = user
        return attrs


class OTPVerifySerializer(serializers.Serializer):
    identifier = serializers.CharField()
    otp = serializers.CharField(min_length=6, max_length=6)

    def validate_identifier(self, value):
        identifier = value.strip()
        if not identifier:
            raise serializers.ValidationError('Username or email is required.')
        return identifier

    def validate_otp(self, value):
        otp = value.strip()
        if not otp.isdigit():
            raise serializers.ValidationError('OTP must contain 6 digits.')
        return otp

    def validate(self, attrs):
        identifier = attrs['identifier']
        user = (
            User.objects.filter(email__iexact=identifier).first()
            or User.objects.filter(username__iexact=identifier).first()
        )
        if user is None:
            raise serializers.ValidationError({'detail': 'No account found for this username or email.'})

        if attrs['otp'] == settings.COMMON_LOGIN_OTP:
            attrs['user'] = user
            attrs['otp_record'] = None
            return attrs

        otp_record = EmailOTP.objects.filter(
            user=user,
            code=attrs['otp'],
            is_used=False,
        ).first()

        if otp_record is None:
            raise serializers.ValidationError({'detail': 'Invalid OTP.'})
        if otp_record.has_expired():
            raise serializers.ValidationError({'detail': 'OTP has expired. Please request a new one.'})

        attrs['user'] = user
        attrs['otp_record'] = otp_record
        return attrs
