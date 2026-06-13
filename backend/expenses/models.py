from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

class Category(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='categories')
    category_name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.category_name

    class Meta:
        verbose_name_plural = "Categories"

class Expense(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='expenses')
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='expenses')
    # Optional link to a Person/Contact for aggregation and history
    person = models.ForeignKey('Person', on_delete=models.SET_NULL, null=True, blank=True, related_name='expenses')
    expense_name = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_mode = models.CharField(max_length=50) # e.g., UPI, Cash, Card
    description = models.TextField(blank=True, null=True)
    expense_date = models.DateField()
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.expense_name} - {self.amount}"


class Person(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='people')
    name = models.CharField(max_length=255)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=30, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

@receiver(post_save, sender=User)
def create_default_categories(sender, instance, created, **kwargs):
    if created:
        defaults = ['Housing', 'Food', 'Travel', 'Groceries', 'Utilities', 'Entertainment', 'Others']
        for cat in defaults:
            Category.objects.create(user=instance, category_name=cat)
