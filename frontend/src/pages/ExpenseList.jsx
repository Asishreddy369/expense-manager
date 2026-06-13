import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Search, Filter, ArrowUpDown, Trash2, Edit3, ChevronLeft, ChevronRight, Wallet, PieChart as PieChartIcon, FileText, Calendar } from 'lucide-react';

const ExpenseList = () => {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

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
        setExpenses(expenses.filter(e => e.id !== id));
      } catch (error) {
        console.error('Error deleting expense:', error);
      }
    }
  };

  const handleExport = (type) => {
    const token = localStorage.getItem('access_token');
    window.open(`http://localhost:8000/api/expenses/export/?type=${type}&token=${token}`, '_blank');
  };

  const filteredExpenses = expenses.filter(e => {
    const matchesSearch = e.expense_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory ? e.category === parseInt(filterCategory) : true;
    const matchesPayment = paymentFilter ? e.payment_mode === paymentFilter : true;
    const matchesDate = (startDate ? e.expense_date >= startDate : true) && 
                        (endDate ? e.expense_date <= endDate : true);
    return matchesSearch && matchesCategory && matchesPayment && matchesDate;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Expense History</h1>
          <p className="text-gray-500 mt-1">Manage and track your past transactions.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => handleExport('pdf')}
            className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm"
          >
            <FileText className="h-4 w-4 text-red-500" /> Download PDF
          </button>
          <button 
            onClick={() => handleExport('excel')}
            className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm"
          >
            <FileText className="h-4 w-4 text-green-500" /> Export Excel
          </button>
        </div>
      </header>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative col-span-1 md:col-span-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search name..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Filter className="h-4 w-4 text-gray-400" />
          </div>
          <select
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm appearance-none bg-white"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.category_name}</option>
            ))}
          </select>
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Wallet className="h-4 w-4 text-gray-400" />
          </div>
          <select
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm appearance-none bg-white"
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
          >
            <option value="">All Payments</option>
            <option value="UPI">UPI</option>
            <option value="Cash">Cash</option>
            <option value="Card">Card</option>
            <option value="Net Banking">Net Banking</option>
          </select>
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Calendar className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="date"
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            placeholder="From"
          />
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Calendar className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="date"
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            placeholder="To"
          />
        </div>

        <button 
           onClick={() => {setSearchTerm(''); setFilterCategory(''); setPaymentFilter(''); setStartDate(''); setEndDate('');}}
           className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-primary transition-colors flex items-center justify-center gap-2"
        >
          Reset Filters
        </button>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Expense Name</th>
                <th className="px-6 py-4 font-semibold">Category</th>
                <th className="px-6 py-4 font-semibold">Amount</th>
                <th className="px-6 py-4 font-semibold">Payment</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredExpenses.length > 0 ? (
                filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4 text-sm text-gray-600">{expense.expense_date}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-gray-900">{expense.expense_name}</div>
                      <div className="text-xs text-gray-400 truncate max-w-[200px]">{expense.description || 'No description'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-primary">
                        {expense.category_name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">₹{expense.amount}</td>
                    <td className="px-6 py-4">
                       <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded capitalize">{expense.payment_mode}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 text-gray-400 hover:text-primary transition-colors">
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(expense.id)}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-gray-400 italic">
                    No expenses found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Placeholder */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-500 tracking-tight">
            Showing <span className="font-semibold">{filteredExpenses.length}</span> results
          </p>
          <div className="flex gap-2 text-primary">
             <button className="p-2 rounded-lg hover:bg-white border border-transparent hover:border-gray-200 disabled:opacity-30" disabled>
                <ChevronLeft className="h-5 w-5" />
             </button>
             <button className="p-2 rounded-lg hover:bg-white border border-transparent hover:border-gray-200 disabled:opacity-30" disabled>
                <ChevronRight className="h-5 w-5" />
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseList;
