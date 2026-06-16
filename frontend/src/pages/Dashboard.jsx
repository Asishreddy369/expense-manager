import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { IndianRupee, TrendingUp, Layers, ArrowRight, Wallet, Clock,
  TrendingDown, PieChart as PieChartIcon, BarChart3, Zap, Shield, Bell, Star } from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const COLORS = ['#6366f1','#f59e0b','#10b981','#ef4444','#3b82f6','#ec4899','#8b5cf6','#14b8a6'];

const features = [
  { icon: <Zap className="h-5 w-5" />, color: 'from-yellow-400 to-orange-500', title: 'Smart Auto-fill', desc: 'Type an expense name and fields auto-populate from past entries.' },
  { icon: <Shield className="h-5 w-5" />, color: 'from-green-400 to-teal-500', title: 'Secure & Private', desc: 'JWT-secured API. Your data stays yours, always.' },
  { icon: <PieChartIcon className="h-5 w-5" />, color: 'from-purple-400 to-indigo-500', title: 'Visual Analytics', desc: 'Pie & bar charts show where your money goes at a glance.' },
  { icon: <Bell className="h-5 w-5" />, color: 'from-pink-400 to-rose-500', title: 'OTP Login', desc: 'Login with a one-time password sent to your email — no passwords to remember.' },
];

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ this_month_expenses: 0, total_expenses: 0, category_count: 0, recent_transactions: [] });
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
    { title: 'This Month', value: `₹${Number(stats.this_month_expenses).toLocaleString()}`, icon: <IndianRupee className="h-6 w-6 text-white" />, gradient: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-400/40' },
    { title: 'Total Spent', value: `₹${Number(stats.total_expenses).toLocaleString()}`, icon: <TrendingUp className="h-6 w-6 text-white" />, gradient: 'from-emerald-400 to-teal-600', shadow: 'shadow-emerald-400/40' },
    { title: 'Categories', value: stats.category_count, icon: <Layers className="h-6 w-6 text-white" />, gradient: 'from-amber-400 to-orange-500', shadow: 'shadow-amber-400/40' },
  ];

  const pieData = analysis?.by_category?.length ? {
    labels: analysis.by_category.map(c => c.category__category_name),
    datasets: [{ data: analysis.by_category.map(c => c.total), backgroundColor: COLORS, borderWidth: 0 }]
  } : null;

  const barData = analysis?.monthly_trend?.length ? {
    labels: analysis.monthly_trend.map(m => new Date(m.month + '-01').toLocaleDateString('default', { month: 'short' })),
    datasets: [{ label: 'Monthly Expenses', data: analysis.monthly_trend.map(m => m.total), backgroundColor: COLORS.slice(0, analysis.monthly_trend.length), borderRadius: 8 }]
  } : null;

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
    </div>
  );

  return (
    <div className="space-y-5 sm:space-y-8">

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-5 sm:p-8 text-white shadow-2xl shadow-indigo-500/30">
        <div className="absolute -top-10 -right-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-indigo-200 text-xs font-medium uppercase tracking-widest mb-1">Dashboard</p>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight truncate">
              Welcome back, {user?.username} 👋
            </h1>
            <p className="mt-1 sm:mt-2 text-indigo-200 text-sm">Here's your financial summary for today.</p>
            <Link to="/add-expense" className="mt-3 sm:mt-4 inline-flex items-center gap-2 bg-white text-indigo-600 font-bold px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl hover:bg-indigo-50 transition-all shadow-lg text-sm">
              + Add Expense
            </Link>
          </div>
          {analysis?.comparison && (
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-3 sm:p-4 flex items-center gap-3 shrink-0 self-start sm:self-auto">
              <div className={`p-2 rounded-xl ${analysis.comparison.diff > 0 ? 'bg-red-400/30' : 'bg-green-400/30'}`}>
                {analysis.comparison.diff > 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
              </div>
              <div>
                <p className="text-xs text-indigo-200 uppercase font-bold tracking-wider">vs Last Month</p>
                <p className="text-base sm:text-lg font-bold">{analysis.comparison.percent_diff}% {analysis.comparison.diff > 0 ? 'increase' : 'decrease'}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {cards.map((card, i) => (
          <div key={i} className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.gradient} p-5 sm:p-6 text-white shadow-xl ${card.shadow} hover:scale-[1.02] transition-transform`}>
            <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-white/10" />
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm shrink-0">{card.icon}</div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white/80">{card.title}</p>
                <h3 className="text-2xl sm:text-3xl font-extrabold truncate">{card.value}</h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="card p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <span className="bg-indigo-100 text-indigo-600 p-1.5 rounded-lg"><PieChartIcon className="h-4 w-4" /></span>
            Expenses by Category
          </h2>
          <div className="h-56 sm:h-64 flex items-center justify-center">
            {pieData ? <Pie data={pieData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, padding: 12 } } } }} /> :
              <p className="text-sm italic" style={{ color: 'var(--text-muted)' }}>Add expenses to see your chart</p>}
          </div>
        </div>
        <div className="card p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <span className="bg-amber-100 text-amber-600 p-1.5 rounded-lg"><BarChart3 className="h-4 w-4" /></span>
            Monthly Trend
          </h2>
          <div className="h-56 sm:h-64 flex items-center justify-center">
            {barData ? <Bar data={barData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} /> :
              <p className="text-sm italic" style={{ color: 'var(--text-muted)' }}>No monthly data yet</p>}
          </div>
        </div>
      </div>

      {/* Recent + Features */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Transactions */}
        <div className="card p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-5">
            <h2 className="text-base sm:text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <span className="bg-teal-100 text-teal-600 p-1.5 rounded-lg"><Clock className="h-4 w-4" /></span>
              Recent Transactions
            </h2>
            <Link to="/expenses" className="text-sm font-semibold text-indigo-600 hover:underline flex items-center gap-1">
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="space-y-2 sm:space-y-3">
            {stats.recent_transactions.length > 0 ? stats.recent_transactions.map((tx, i) => (
              <div key={tx.id} className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0"
                    style={{ background: COLORS[i % COLORS.length] }}>
                    {tx.expense_name[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{tx.expense_name}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{tx.category_name} • {tx.expense_date}</p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>₹{tx.amount}</p>
                  <span className="text-[10px] px-1.5 py-0.5 rounded uppercase" style={{ background: 'var(--input-bg)', color: 'var(--text-muted)' }}>{tx.payment_mode}</span>
                </div>
              </div>
            )) : (
              <div className="text-center py-8">
                <Wallet className="h-10 w-10 mx-auto mb-2" style={{ color: 'var(--border)' }} />
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No transactions yet</p>
                <Link to="/add-expense" className="text-indigo-600 text-sm font-semibold mt-1 inline-block">Add your first →</Link>
              </div>
            )}
          </div>
        </div>

        {/* Features showcase */}
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-2xl p-4 sm:p-6 text-white">
          <div className="flex items-center gap-2 mb-4 sm:mb-5">
            <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
            <h2 className="text-base sm:text-lg font-bold">What You Can Do</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:gap-4">
            {features.map((f, i) => (
              <div key={i} className="flex items-start gap-3 bg-white/5 rounded-xl p-3 hover:bg-white/10 transition-colors">
                <div className={`bg-gradient-to-br ${f.color} p-2 rounded-lg shrink-0`}>{f.icon}</div>
                <div className="min-w-0">
                  <p className="font-bold text-sm">{f.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
