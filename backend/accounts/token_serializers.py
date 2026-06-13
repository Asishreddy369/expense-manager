from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework import permissions
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        # Allow users to provide either username or email in the 'username' field
        identifier = attrs.get(self.username_field)
        password = attrs.get('password')

        if identifier and '@' in identifier:
            try:
                user = User.objects.get(email__iexact=identifier)
                # replace identifier with the real username for downstream auth
                attrs[self.username_field] = user.get_username()
            except User.DoesNotExist:
                # leave as-is so default behavior returns proper error
                pass

        return super().validate(attrs)


from rest_framework_simplejwt.views import TokenObtainPairView


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = (permissions.AllowAny,)
