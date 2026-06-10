from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, ExpenseViewSet, DashboardSummaryView, ExpenseAnalysisView, ExportExpensesView

router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'expenses', ExpenseViewSet, basename='expense')

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard-summary/', DashboardSummaryView.as_view(), name='dashboard-summary'),
    path('analysis/', ExpenseAnalysisView.as_view(), name='expense-analysis'),
    path('export/', ExportExpensesView.as_view(), name='export-expenses'),
]
