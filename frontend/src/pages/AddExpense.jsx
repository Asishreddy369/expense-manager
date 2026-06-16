import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Save, X, Calendar, Tag, IndianRupee, CreditCard, Loader2, Layers, Plus, ChevronDown, Wallet, TrendingDown, StickyNote } from 'lucide-react';
import Modal from '../components/Modal';

const inputCls = "input-theme w-full px-4 py-3 border-2 rounded-xl focus:ring-0 focus:border-indigo-400 outline-none transition-all placeholder-gray-400";
const labelCls = "text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 mb-1.5 text-gray-500 dark:text-gray-400";

const PAYMENT_MODES = [
  { value: 'UPI', emoji: '📱', color: 'bg-purple-100 text-purple-700' },
  { value: 'Cash', emoji: '💵', color: 'bg-green-100 text-green-700' },
  { value: 'Card', emoji: '💳', color: 'bg-blue-100 text-blue-700' },
  { value: 'Net Banking', emoji: '🏦', color: 'bg-amber-100 text-amber-700' },
];

const AddExpense = () => {
  const navigate = useNavigate();
  const dateInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [people, setPeople] = useState([]);
  const [showPersonModal, setShowPersonModal] = useState(false);
  const [personForm, setPersonForm] = useState({ name: '', email: '', phone: '' });
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [successMsg, setSuccessMsg] = useState('');
  const [totalBudget, setTotalBudget] = useState('');
  const [formData, setFormData] = useState({
    expense_date: new Date().toISOString().split('T')[0],
    expense_name: '',
    category: '',
    amount: '',
    payment_mode: 'UPI',
    person: '',
    notes: '',
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
        try {
          const peopleRes = await api.get('expenses/people/');
          setPeople(peopleRes.data);
        } catch { /* ignore */ }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const person = params.get('person');
    if (person) setFormData(prev => ({ ...prev, expense_name: person }));
  }, []);

  // Smart auto-fill from past expenses
  useEffect(() => {
    if (formData.expense_name && !formData.category) {
      const match = recentExpenses.find(
        e => e.expense_name.toLowerCase() === formData.expense_name.toLowerCase()
      );
      if (match) {
        setFormData(prev => ({ ...prev, category: match.category, amount: match.amount, payment_mode: match.payment_mode }));
      }
    }
  }, [formData.expense_name, recentExpenses]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...formData };
      if (!payload.person) delete payload.person;
      await api.post('expenses/expenses/', payload);
      setSuccessMsg('Expense saved successfully!');
      setTimeout(() => navigate('/expenses'), 1000);
    } catch (error) {
      console.error('Error saving expense:', error);
      alert('Failed to save expense. Please check all fields.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePerson = async (e) => {
    e.preventDefault();
    if (!personForm.name) return alert('Please enter a name');
    try {
      const res = await api.post('expenses/people/', personForm);
      setPeople(prev => [res.data, ...prev]);
      setFormData(prev => ({ ...prev, person: res.data.id }));
      setShowPersonModal(false);
    } catch (err) {
      alert('Failed to create person');
    }
  };

  return (
    <>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-5 sm:p-8 text-white shadow-2xl shadow-indigo-500/30 mb-6">
          <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-1">Expense Tracker</p>
              <h1 className="text-2xl sm:text-3xl font-extrabold">Add New Expense</h1>
              <p className="text-indigo-200 text-sm mt-1">Track every rupee you spend</p>
            </div>
            <button onClick={() => navigate(-1)} className="bg-white/20 hover:bg-white/30 backdrop-blur-sm p-2 rounded-xl transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {successMsg && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-medium">
            ✅ {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="card overflow-hidden">
          <div className="p-6 space-y-6">

            {/* Row 1: Date + Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={labelCls}><Calendar className="h-3.5 w-3.5 text-indigo-500" /> Date</label>
                <div className="relative flex items-center border-2 rounded-xl hover:border-indigo-300 transition-colors" style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)' }}>
                  <Calendar className="h-4 w-4 text-indigo-400 shrink-0 ml-4" />
                  <span className="flex-1 px-3 py-3 font-medium text-sm select-none" style={{ color: 'var(--text-primary)' }}>
                    {formData.expense_date
                      ? new Date(formData.expense_date + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                      : 'Select date'}
                  </span>
                  {/* Hidden native input — programmatically opened */}
                  <input
                    ref={dateInputRef}
                    type="date"
                    name="expense_date"
                    required
                    value={formData.expense_date}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  {/* Clickable calendar icon opens picker */}
                  <button
                    type="button"
                    onClick={() => dateInputRef.current?.showPicker()}
                    className="mr-3 p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition-colors"
                    title="Pick a date"
                  >
                    <Calendar className="h-4 w-4" />
                  </button>
                </div>
                {/* Quick date shortcuts — wraps on small screens */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[
                    { label: 'Today', days: 0 },
                    { label: 'Yesterday', days: 1 },
                    { label: '2 days ago', days: 2 },
                    { label: 'Last week', days: 7 },
                  ].map(({ label, days }) => {
                    const d = new Date();
                    d.setDate(d.getDate() - days);
                    const val = d.toISOString().split('T')[0];
                    return (
                      <button key={label} type="button"
                        onClick={() => setFormData(prev => ({ ...prev, expense_date: val }))}
                        className={`text-xs px-2 py-1 rounded-lg font-medium transition-all border ${
                          formData.expense_date === val
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : 'border-gray-200 hover:border-indigo-400 hover:text-indigo-600'
                        }`}
                        style={formData.expense_date !== val ? { background: 'var(--input-bg)', color: 'var(--text-secondary)' } : {}}>
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className={labelCls}><Tag className="h-3.5 w-3.5 text-pink-500" /> Expense Name</label>
                <input type="text" name="expense_name" required list="recent-names"
                  placeholder="e.g. Rent, Groceries, Netflix"
                  className={inputCls} value={formData.expense_name} onChange={handleChange} />
                <datalist id="recent-names">
                  {[...new Set(recentExpenses.map(e => e.expense_name))].map(name => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Row 2: Category + Person */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={labelCls}><Layers className="h-3.5 w-3.5 text-purple-500" /> Category</label>
                <div className="relative">
                  <select name="category" required className={inputCls + " appearance-none pr-10"}
                    value={formData.category} onChange={handleChange}>
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.category_name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-3.5 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className={labelCls}>👤 Person / Contact <span className="text-gray-300 normal-case font-normal">(optional)</span></label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <select name="person" className={inputCls + " appearance-none pr-10"}
                      value={formData.person || ''}
                      onChange={(e) => { if (e.target.value === '__new') { setShowPersonModal(true); return; } handleChange(e); }}>
                      <option value="">No person</option>
                      {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      <option value="__new">+ Create new...</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-3.5 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                  <button type="button" onClick={() => setShowPersonModal(true)}
                    className="px-3 py-2 rounded-xl border-2 border-dashed border-indigo-200 text-indigo-500 hover:bg-indigo-50 transition-colors text-sm font-medium">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Row 3: Amount + Payment Mode */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={labelCls}><IndianRupee className="h-3.5 w-3.5 text-emerald-500" /> Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-gray-400 font-bold">₹</span>
                  <input type="number" name="amount" required placeholder="0.00" min="0" step="0.01"
                    className={inputCls + " pl-8"} value={formData.amount} onChange={handleChange} />
                </div>
              </div>
              <div>
                <label className={labelCls}><CreditCard className="h-3.5 w-3.5 text-blue-500" /> Payment Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENT_MODES.map(m => (
                    <button key={m.value} type="button"
                      onClick={() => setFormData(prev => ({ ...prev, payment_mode: m.value }))}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${formData.payment_mode === m.value ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'hover:border-gray-300'}`}
                      style={formData.payment_mode !== m.value ? { borderColor: 'var(--border)', color: 'var(--text-secondary)', background: 'var(--input-bg)' } : {}}>
                      <span>{m.emoji}</span> {m.value}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className={labelCls}><StickyNote className="h-3.5 w-3.5 text-amber-500" /> Notes <span className="text-gray-300 normal-case font-normal">(optional)</span></label>
              <input
                type="text"
                name="notes"
                placeholder="Quick note about this expense..."
                className={inputCls}
                value={formData.notes}
                onChange={handleChange}
              />
            </div>

            {/* Budget Tally */}
            <div className="rounded-2xl border-2 border-dashed border-indigo-200 p-4 space-y-3" style={{ background: 'var(--input-bg)' }}>
              <label className={labelCls + " text-indigo-600"}>
                <Wallet className="h-3.5 w-3.5 text-indigo-500" /> Total Money in Hand
                <span className="text-indigo-300 normal-case font-normal ml-1">(optional — for tally)</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-indigo-400 font-bold">₹</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Enter total amount you have"
                  className="input-theme w-full pl-8 pr-4 py-3 border-2 border-indigo-200 rounded-xl focus:ring-0 focus:border-indigo-500 outline-none transition-all placeholder-gray-400"
                  value={totalBudget}
                  onChange={e => setTotalBudget(e.target.value)}
                />
              </div>

              {/* Live tally display */}
              {totalBudget !== '' && (
                (() => {
                  const total = parseFloat(totalBudget) || 0;
                  const spent = parseFloat(formData.amount) || 0;
                  const balance = total - spent;
                  const pct = total > 0 ? Math.min((spent / total) * 100, 100) : 0;
                  const isOver = balance < 0;
                  return (
                    <div className="space-y-3">
                      {/* Progress bar */}
                      <div className="w-full bg-white rounded-full h-2.5 overflow-hidden border border-indigo-100">
                        <div
                          className={`h-2.5 rounded-full transition-all duration-500 ${isOver ? 'bg-red-500' : pct > 75 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      {/* 3 stat boxes */}
                      <div className="grid grid-cols-3 gap-2 sm:gap-3">
                        <div className="rounded-xl p-2.5 sm:p-3 text-center border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                          <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Total</p>
                          <p className="font-extrabold text-sm sm:text-base" style={{ color: 'var(--text-primary)' }}>₹{total.toLocaleString('en-IN')}</p>
                        </div>
                        <div className="rounded-xl p-2.5 sm:p-3 text-center border border-red-100 bg-red-50">
                          <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
                            <TrendingDown className="h-3 w-3" /> Spent
                          </p>
                          <p className="font-extrabold text-red-600 text-sm sm:text-base">₹{spent.toLocaleString('en-IN')}</p>
                        </div>
                        <div className={`rounded-xl p-2.5 sm:p-3 text-center border ${isOver ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-100'}`}>
                          <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${isOver ? 'text-red-400' : 'text-emerald-500'}`}>Balance</p>
                          <p className={`font-extrabold text-sm sm:text-base ${isOver ? 'text-red-600' : 'text-emerald-600'}`}>
                            {isOver ? '-' : ''}₹{Math.abs(balance).toLocaleString('en-IN')}
                          </p>
                        </div>
                      </div>

                      {isOver && (
                        <p className="text-xs text-red-500 font-semibold text-center bg-red-50 rounded-lg py-1.5">
                          ⚠️ This expense exceeds your total by ₹{Math.abs(balance).toLocaleString('en-IN')}
                        </p>
                      )}
                    </div>
                  );
                })()
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 sm:px-6 py-4 border-t flex gap-3" style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }}>
            <button type="button" onClick={() => navigate(-1)}
              className="flex-1 py-3 rounded-xl border-2 font-bold transition-all" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30 hover:from-indigo-700 hover:to-purple-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
              Save Expense
            </button>
          </div>
        </form>
      </div>

      <Modal isOpen={showPersonModal} title="Add New Person" onClose={() => setShowPersonModal(false)}>
        <form onSubmit={handleCreatePerson} className="space-y-4">
          {[{ label: 'Name *', name: 'name', type: 'text', required: true },
            { label: 'Email', name: 'email', type: 'email' },
            { label: 'Phone', name: 'phone', type: 'tel' }].map(f => (
            <div key={f.name}>
              <label className="text-sm font-semibold block mb-1" style={{ color: 'var(--text-primary)' }}>{f.label}</label>
              <input type={f.type} name={f.name} required={f.required}
                value={personForm[f.name]} onChange={e => setPersonForm({ ...personForm, [e.target.name]: e.target.value })}
                className="input-theme w-full px-3 py-2.5 border-2 border-gray-100 rounded-xl outline-none focus:border-indigo-400 transition-all" />
            </div>
          ))}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowPersonModal(false)}
              className="flex-1 py-2.5 rounded-xl border-2 font-semibold transition-colors"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>Cancel</button>
            <button type="submit"
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold">Create</button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default AddExpense;
