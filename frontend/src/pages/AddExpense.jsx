import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Save, X, Calendar, Tag, FileText, IndianRupee, CreditCard, StickyNote, Loader2 } from 'lucide-react';

const AddExpense = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [formData, setFormData] = useState({
    expense_date: new Date().toISOString().split('T')[0],
    expense_name: '',
    category: '',
    amount: '',
    payment_mode: 'UPI',
    description: '',
    notes: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, expRes] = await Promise.all([
          api.get('expenses/categories/'),
          api.get('expenses/expenses/')
        ]);
        setCategories(catRes.data);
        setRecentExpenses(expRes.data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchData();
  }, []);

  // Smart Behavior: Auto-fill if name matches a recent expense
  useEffect(() => {
    if (formData.expense_name && !formData.category) {
      const match = recentExpenses.find(
        e => e.expense_name.toLowerCase() === formData.expense_name.toLowerCase()
      );
      if (match) {
        setFormData(prev => ({
          ...prev,
          category: match.category,
          amount: match.amount,
          payment_mode: match.payment_mode
        }));
      }
    }
  }, [formData.expense_name, recentExpenses]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('expenses/expenses/', formData);
      navigate('/');
    } catch (error) {
      console.error('Error saving expense:', error);
      alert('Failed to save expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-6 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Add New Expense</h2>
          <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Date */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" /> Date
              </label>
              <input
                type="date"
                name="expense_date"
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                value={formData.expense_date}
                onChange={handleChange}
              />
            </div>

            {/* Name with suggestions link */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Tag className="h-4 w-4 text-primary" /> Name
              </label>
              <input
                type="text"
                name="expense_name"
                required
                list="recent-names"
                placeholder="e.g. Rent, Starbucks"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                value={formData.expense_name}
                onChange={handleChange}
              />
              <datalist id="recent-names">
                {[...new Set(recentExpenses.map(e => e.expense_name))].map(name => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" /> Category
              </label>
              <select
                name="category"
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all appearance-none bg-white"
                value={formData.category}
                onChange={handleChange}
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.category_name}</option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <IndianRupee className="h-4 w-4 text-primary" /> Amount
              </label>
              <input
                type="number"
                name="amount"
                required
                placeholder="0.00"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                value={formData.amount}
                onChange={handleChange}
              />
            </div>

            {/* Payment Mode */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" /> Payment Mode
              </label>
              <select
                name="payment_mode"
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all appearance-none bg-white"
                value={formData.payment_mode}
                onChange={handleChange}
              >
                <option value="UPI">UPI</option>
                <option value="Cash">Cash</option>
                <option value="Card">Credit/Debit Card</option>
                <option value="Net Banking">Net Banking</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" /> Description
            </label>
            <textarea
              name="description"
              rows="3"
              placeholder="Add some details..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none"
              value={formData.description}
              onChange={handleChange}
            ></textarea>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <StickyNote className="h-4 w-4 text-primary" /> Notes (Optional)
            </label>
            <input
              type="text"
              name="notes"
              placeholder="Any quick notes?"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              value={formData.notes}
              onChange={handleChange}
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-primary text-white rounded-xl font-bold shadow-xl shadow-blue-500/30 hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-3 text-lg"
            >
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Save className="h-6 w-6" />}
              Save Expense
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddExpense;
