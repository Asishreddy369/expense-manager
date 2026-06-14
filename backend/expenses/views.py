from datetime import timedelta
from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Sum
from django.utils import timezone
from .models import Category, Expense
from .serializers import CategorySerializer, ExpenseSerializer

class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Category.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class ExpenseViewSet(viewsets.ModelViewSet):
    serializer_class = ExpenseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Expense.objects.filter(user=self.request.user).order_by('-expense_date')
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category_id=category)
        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class DashboardSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        today = timezone.now().date()
        first_day_of_month = today.replace(day=1)
        
        this_month_expenses = Expense.objects.filter(
            user=request.user,
            expense_date__gte=first_day_of_month
        ).aggregate(Sum('amount'))['amount__sum'] or 0

        total_expenses = Expense.objects.filter(
            user=request.user
        ).aggregate(Sum('amount'))['amount__sum'] or 0

        category_count = Category.objects.filter(user=request.user).count()
        
        recent_transactions = Expense.objects.filter(
            user=request.user
        ).order_by('-expense_date')[:5]
        
        recent_transactions_data = ExpenseSerializer(recent_transactions, many=True).data

        return Response({
            "this_month_expenses": this_month_expenses,
            "total_expenses": total_expenses,
            "category_count": category_count,
            "recent_transactions": recent_transactions_data
        })

class ExpenseAnalysisView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # 1. Expenses by Category
        by_category = Expense.objects.filter(user=request.user).values('category__category_name').annotate(total=Sum('amount'))
        
        # 2. Monthly Trend (Last 6 months)
        from django.db.models.functions import TruncMonth
        monthly_trend = Expense.objects.filter(user=request.user).annotate(month=TruncMonth('expense_date')).values('month').annotate(total=Sum('amount')).order_by('month')
        
        # 3. Monthly Comparison (This month vs Last month)
        today = timezone.now().date()
        this_month = today.replace(day=1)
        last_month = (this_month - timedelta(days=1)).replace(day=1)
        
        this_month_total = Expense.objects.filter(user=request.user, expense_date__gte=this_month).aggregate(Sum('amount'))['amount__sum'] or 0
        last_month_total = Expense.objects.filter(user=request.user, expense_date__gte=last_month, expense_date__lt=this_month).aggregate(Sum('amount'))['amount__sum'] or 0

        diff = this_month_total - last_month_total
        percent_diff = ((diff / last_month_total) * 100) if last_month_total > 0 else 0

        return Response({
            "by_category": by_category,
            "monthly_trend": monthly_trend,
            "comparison": {
                "this_month_total": this_month_total,
                "last_month_total": last_month_total,
                "diff": diff,
                "percent_diff": round(percent_diff, 2)
            }
        })

import io
from django.http import HttpResponse

class ExportExpensesView(APIView):
    permission_classes = [permissions.AllowAny] # We will manually check token

    def get(self, request):
        token = request.query_params.get('token')
        if not token:
            return Response({"error": "No token provided"}, status=401)
        
        from rest_framework_simplejwt.authentication import JWTAuthentication
        try:
            validated_token = JWTAuthentication().get_validated_token(token)
            user = JWTAuthentication().get_user(validated_token)
        except:
            return Response({"error": "Invalid token"}, status=401)

        export_type = request.query_params.get('type', 'excel')
        expenses = Expense.objects.filter(user=user).order_by('-expense_date')

        if export_type == 'excel':
            try:
                from openpyxl import Workbook
            except ImportError:
                return Response(
                    {"error": "Excel export dependency is not installed."},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE,
                )

            wb = Workbook()
            ws = wb.active
            ws.title = "Expenses"
            headers = ["Date", "Name", "Category", "Amount", "Mode", "Description"]
            ws.append(headers)
            for exp in expenses:
                ws.append([exp.expense_date, exp.expense_name, exp.category.category_name if exp.category else '', exp.amount, exp.payment_mode, exp.description])
            
            output = io.BytesIO()
            wb.save(output)
            output.seek(0)
            response = HttpResponse(output.read(), content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            response['Content-Disposition'] = 'attachment; filename=expenses.xlsx'
            return response

        elif export_type == 'pdf':
            try:
                from reportlab.lib.pagesizes import letter
                from reportlab.pdfgen import canvas
            except ImportError:
                return Response(
                    {"error": "PDF export dependency is not installed."},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE,
                )

            buffer = io.BytesIO()
            p = canvas.Canvas(buffer, pagesize=letter)
            p.drawString(100, 750, f"Expense Report for {user.username}")
            y = 720
            p.drawString(100, y, "Date | Name | Category | Amount")
            y -= 20
            for exp in expenses:
                p.drawString(100, y, f"{exp.expense_date} | {exp.expense_name} | {exp.category.category_name if exp.category else ''} | {exp.amount}")
                y -= 20
                if y < 50:
                    p.showPage()
                    y = 750
            p.showPage()
            p.save()
            buffer.seek(0)
            response = HttpResponse(buffer.read(), content_type='application/pdf')
            response['Content-Disposition'] = 'attachment; filename=expenses.pdf'
            return response

        return Response({"error": "Invalid export type"}, status=status.HTTP_400_BAD_REQUEST)
