import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { IndianRupee, TrendingUp, Layers, ArrowRight, Wallet, Clock, TrendingDown, PieChart as PieChartIcon, BarChart3 } from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    this_month_expenses: 0,
    total_expenses: 0,
    category_count: 0,
    recent_transactions: []
  });
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, analysisRes] = await Promise.all([
          api.get('expenses/dashboard-summary/'),
          api.get('expenses/analysis/')
        ]);
        setStats(statsRes.data);
        setAnalysis(analysisRes.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const cards = [
    {
      title: 'This Month Expenses',
      value: `₹${stats.this_month_expenses.toLocaleString()}`,
      icon: <IndianRupee className="h-6 w-6 text-white" />,
      color: 'bg-primary',
      shadow: 'shadow-blue-500/30'
    },
    {
      title: 'Total Expenses',
      value: `₹${stats.total_expenses.toLocaleString()}`,
      icon: <TrendingUp className="h-6 w-6 text-white" />,
      color: 'bg-secondary',
      shadow: 'shadow-teal-500/30'
    },
    {
      title: 'Categories',
      value: stats.category_count,
      icon: <Layers className="h-6 w-6 text-white" />,
      color: 'bg-amber-500',
      shadow: 'shadow-amber-500/30'
    }
  ];

  const pieData = analysis ? {
    labels: analysis.by_category.map(c => c.category__category_name),
    datasets: [{
      data: analysis.by_category.map(c => c.total),
      backgroundColor: ['#2563EB', '#14B8A6', '#F59E0B', '#22C55E', '#8B5CF6', '#EC4899', '#64748B'],
      borderWidth: 0,
    }]
  } : null;

  const barData = analysis ? {
    labels: analysis.monthly_trend.map(m => new Date(m.month).toLocaleDateString('default', { month: 'short' })),
    datasets: [{
      label: 'Monthly Expenses',
      data: analysis.monthly_trend.map(m => m.total),
      backgroundColor: '#2563EB',
      borderRadius: 8,
    }]
  } : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome, {user?.username === 'Profile' ? 'Ashish' : user?.username} 👋
          </h1>
          <p className="text-gray-500 mt-1">Here's what's happening with your expenses today.</p>
        </div>
        
        {analysis?.comparison && (
          <div className="bg-white p-3 rounded-xl border border-gray-100 flex items-center gap-3">
             <div className={`p-2 rounded-lg ${analysis.comparison.diff > 0 ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>
                {analysis.comparison.diff > 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
             </div>
             <div>
                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">vs Last Month</p>
                <p className={`text-sm font-bold ${analysis.comparison.diff > 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {analysis.comparison.percent_diff}% {analysis.comparison.diff > 0 ? 'increase' : 'decrease'}
                </p>
             </div>
          </div>
        )}
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card, index) => (
          <div key={index} className={`bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 transition-transform hover:scale-[1.02]`}>
            <div className={`${card.color} p-3 rounded-xl ${card.shadow} shadow-lg`}>
              {card.icon}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{card.title}</p>
              <h3 className="text-2xl font-bold text-gray-900">{card.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pie Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <PieChartIcon className="h-5 w-5 text-primary" />
            Expenses by Category
          </h2>
          <div className="h-64 flex items-center justify-center">
            {pieData ? <Pie data={pieData} options={{ maintainAspectRatio: false }} /> : 'No data available'}
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Monthly Spending Trend
          </h2>
          <div className="h-64 flex items-center justify-center">
            {barData ? <Bar data={barData} options={{ maintainAspectRatio: false }} /> : 'No data available'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Transactions */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
               <Clock className="h-5 w-5 text-primary" />
               Recent Transactions
            </h2>
            <Link to="/expenses" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="space-y-4">
            {stats.recent_transactions.length > 0 ? (
              stats.recent_transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors border border-transparent hover:border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className="bg-gray-100 p-2 rounded-lg">
                       <Wallet className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{tx.expense_name}</p>
                      <p className="text-xs text-gray-500">{tx.category_name} • {tx.expense_date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">₹{tx.amount}</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">{tx.payment_mode}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10">
                <p className="text-gray-400 italic">No transactions yet.</p>
                <Link to="/add-expense" className="text-primary text-sm font-semibold mt-2 inline-block">Add your first expense</Link>
              </div>
            )}
          </div>
        </div>

        {/* Mini Chart Mock (Phase 2 will have real chart) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Expense Analysis</h2>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
             <div className="text-center">
                <PieChartIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-400 text-sm font-medium">Real charts coming in Phase 2</p>
                <p className="text-gray-300 text-xs italic mt-1">Start adding expenses to see the magic!</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
