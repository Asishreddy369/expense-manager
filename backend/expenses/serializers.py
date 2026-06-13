from rest_framework import serializers
from django.db import models
from .models import Category, Expense, Person

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'
        read_only_fields = ('user',)

class ExpenseSerializer(serializers.ModelSerializer):
    category_name = serializers.ReadOnlyField(source='category.category_name')
    person_name = serializers.ReadOnlyField(source='person.name')

    class Meta:
        model = Expense
        fields = '__all__'
        read_only_fields = ('user',)


class PersonSerializer(serializers.ModelSerializer):
    total_amount = serializers.SerializerMethodField()

    class Meta:
        model = Person
        fields = ('id', 'name', 'email', 'phone', 'notes', 'created_at', 'total_amount')
        read_only_fields = ('created_at',)

    def get_total_amount(self, obj):
        return obj.expenses.aggregate(total=models.Sum('amount'))['total'] or 0
