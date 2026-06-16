import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Search, Filter, Trash2, Edit3, ChevronLeft, ChevronRight,
  Wallet, FileText, Calendar, X } from 'lucide-react';

const PAYMENT_COLORS = {
  UPI: 'bg-purple-100 text-purple-700',
  Cash: 'bg-green-100 text-green-700',
  Card: 'bg-blue-100 text-blue-700',
  'Net Banking': 'bg-amber-100 text-amber-700',
};

const ExpenseList = () => {
  const [expenses, setExpenses]       = useState([]);
  const [categories, setCategories]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [searchTerm, setSearchTerm]   = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [paymentFilter, setPaymentFilter]   = useState('');
  const [startDate, setStartDate]     = useState('');
  const [endDate, setEndDate]         = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [expRes, catRes] = await Promise.all([
          api.get('expenses/expenses/'),
          api.get('expenses/categories/')
        ]);
        setExpenses(expRes.data);
        setCategories(catRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await api.delete(`expenses/expenses/${id}/`);
        setExpenses(prev => prev.filter(e => e.id !== id));
      } catch (error) {
        console.error('Error deleting expense:', error);
      }
    }
  };

  const handleExport = (type) => {
    const token = localStorage.getItem('access_token');
    const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/';
    window.open(`${base}expenses/export/?type=${type}&token=${token}`, '_blank');
  };

  const resetFilters = () => {
    setSearchTerm(''); setFilterCategory(''); setPaymentFilter('');
    setStartDate(''); setEndDate('');
  };

  const filteredExpenses = expenses.filter(e => {
    const matchesSearch   = e.expense_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory ? e.category === parseInt(filterCategory) : true;
    const matchesPayment  = paymentFilter ? e.payment_mode === paymentFilter : true;
    const matchesDate     = (startDate ? e.expense_date >= startDate : true) &&
                            (endDate   ? e.expense_date <= endDate   : true);
    return matchesSearch && matchesCategory && matchesPayment && matchesDate;
  });

  const hasFilters = searchTerm || filterCategory || paymentFilter || startDate || endDate;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6">

      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Expense History
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Manage and track all your transactions.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => handleExport('pdf')}
            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition-all"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
          >
            <FileText className="h-4 w-4 text-red-500 shrink-0" />
            <span>PDF</span>
          </button>
          <button
            onClick={() => handleExport('excel')}
            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition-all"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
          >
            <FileText className="h-4 w-4 text-green-500 shrink-0" />
            <span>Excel</span>
          </button>
        </div>
      </header>

      {/* Filters */}
      <div className="card p-4 space-y-3">
        {/* Search + Reset row */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search expenses..."
              className="input-theme w-full pl-9 pr-3 py-2 border-2 rounded-xl outline-none text-sm transition-all"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          {hasFilters && (
            <button onClick={resetFilters}
              className="px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-1 transition-colors"
              style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
              <X className="h-3.5 w-3.5" /> Reset
            </button>
          )}
        </div>

        {/* Filter row — wraps nicely on mobile */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
            <select
              className="input-theme w-full pl-9 pr-3 py-2 border-2 rounded-xl outline-none text-sm appearance-none"
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.category_name}</option>)}
            </select>
          </div>

          <div className="relative">
            <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
            <select
              className="input-theme w-full pl-9 pr-3 py-2 border-2 rounded-xl outline-none text-sm appearance-none"
              value={paymentFilter}
              onChange={e => setPaymentFilter(e.target.value)}
            >
              <option value="">All Payments</option>
              <option value="UPI">UPI</option>
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              <option value="Net Banking">Net Banking</option>
            </select>
          </div>

          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
            <input
              type="date"
              className="input-theme w-full pl-9 pr-2 py-2 border-2 rounded-xl outline-none text-sm"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
          </div>

          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
            <input
              type="date"
              className="input-theme w-full pl-9 pr-2 py-2 border-2 rounded-xl outline-none text-sm"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ── Desktop table (md+) ── */}
      <div className="card overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-xs uppercase tracking-wider" style={{ background: 'var(--input-bg)', color: 'var(--text-muted)' }}>
              <tr>
                <th className="px-5 py-4 font-semibold">Date</th>
                <th className="px-5 py-4 font-semibold">Expense Name</th>
                <th className="px-5 py-4 font-semibold">Category</th>
                <th className="px-5 py-4 font-semibold">Amount</th>
                <th className="px-5 py-4 font-semibold">Payment</th>
                <th className="px-5 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody style={{ color: 'var(--text-primary)' }}>
              {filteredExpenses.length > 0 ? filteredExpenses.map(expense => (
                <tr key={expense.id} className="border-t group transition-colors hover:bg-white/5" style={{ borderColor: 'var(--border)' }}>
                  <td className="px-5 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>{expense.expense_date}</td>
                  <td className="px-5 py-4">
                    <p className="text-sm font-bold">{expense.expense_name}</p>
                    <p className="text-xs truncate max-w-[200px]" style={{ color: 'var(--text-muted)' }}>{expense.notes || expense.description || ''}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-600">
                      {expense.category_name}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm font-extrabold">₹{expense.amount}</td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${PAYMENT_COLORS[expense.payment_mode] || 'bg-gray-100 text-gray-600'}`}>
                      {expense.payment_mode}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 rounded-lg transition-colors" style={{ color: 'var(--text-muted)' }}>
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(expense.id)}
                        className="p-2 rounded-lg hover:text-red-500 transition-colors" style={{ color: 'var(--text-muted)' }}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" className="px-5 py-10 text-center text-sm italic" style={{ color: 'var(--text-muted)' }}>
                    No expenses found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 flex items-center justify-between border-t" style={{ borderColor: 'var(--border)', background: 'var(--input-bg)' }}>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Showing <span className="font-semibold">{filteredExpenses.length}</span> results
          </p>
          <div className="flex gap-1" style={{ color: 'var(--text-secondary)' }}>
            <button className="p-2 rounded-lg disabled:opacity-30" disabled><ChevronLeft className="h-5 w-5" /></button>
            <button className="p-2 rounded-lg disabled:opacity-30" disabled><ChevronRight className="h-5 w-5" /></button>
          </div>
        </div>
      </div>

      {/* ── Mobile cards (< md) ── */}
      <div className="md:hidden space-y-3">
        {filteredExpenses.length > 0 ? filteredExpenses.map(expense => (
          <div key={expense.id} className="card p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-bold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{expense.expense_name}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{expense.expense_date} • {expense.category_name}</p>
                {(expense.notes || expense.description) && (
                  <p className="text-xs mt-1 truncate" style={{ color: 'var(--text-muted)' }}>{expense.notes || expense.description}</p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="font-extrabold text-sm" style={{ color: 'var(--text-primary)' }}>₹{expense.amount}</p>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg mt-1 inline-block ${PAYMENT_COLORS[expense.payment_mode] || 'bg-gray-100 text-gray-600'}`}>
                  {expense.payment_mode}
                </span>
              </div>
            </div>
            <div className="flex gap-2 mt-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
              <button className="flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                <Edit3 className="h-3.5 w-3.5" /> Edit
              </button>
              <button onClick={() => handleDelete(expense.id)}
                className="flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 text-red-500 bg-red-50 hover:bg-red-100 transition-colors">
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </div>
          </div>
        )) : (
          <div className="card p-8 text-center">
            <Wallet className="h-10 w-10 mx-auto mb-2" style={{ color: 'var(--border)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No expenses found matching your criteria.</p>
          </div>
        )}
        <p className="text-sm text-center pb-2" style={{ color: 'var(--text-muted)' }}>
          Showing <span className="font-semibold">{filteredExpenses.length}</span> results
        </p>
      </div>
    </div>
  );
};

export default ExpenseList;
