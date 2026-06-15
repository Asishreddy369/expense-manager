from datetime import timedelta

from django.contrib.auth.models import User
from django.core import mail
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from .models import EmailOTP


@override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
class AccountsAuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='johndoe',
            email='john@example.com',
            password='StrongPass123!',
        )

    def test_password_login_accepts_email_identifier(self):
        response = self.client.post(
            '/api/accounts/login/',
            {'identifier': 'john@example.com', 'password': 'StrongPass123!'},
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_password_login_accepts_common_password(self):
        response = self.client.post(
            '/api/accounts/login/',
            {'identifier': 'john@example.com', 'password': '234560'},
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_request_otp_sends_email(self):
        response = self.client.post(
            '/api/accounts/otp/request/',
            {'identifier': 'johndoe'},
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn('OTP sent to john@example.com.', response.data['detail'])
        self.assertEqual(EmailOTP.objects.filter(user=self.user, is_used=False).count(), 1)

    def test_verify_otp_returns_tokens(self):
        otp_record = EmailOTP.objects.create(
            user=self.user,
            code='123456',
            expires_at=timezone.now() + timedelta(minutes=10),
        )

        response = self.client.post(
            '/api/accounts/otp/verify/',
            {'identifier': 'john@example.com', 'otp': otp_record.code},
            format='json',
        )

        otp_record.refresh_from_db()
        self.assertEqual(response.status_code, 200)
        self.assertTrue(otp_record.is_used)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_verify_common_otp_returns_tokens(self):
        response = self.client.post(
            '/api/accounts/otp/verify/',
            {'identifier': 'john@example.com', 'otp': '234560'},
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
