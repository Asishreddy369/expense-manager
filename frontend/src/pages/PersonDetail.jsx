import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { ArrowLeft, Plus, IndianRupee, Calendar, Wallet } from 'lucide-react';

const PAYMENT_COLORS = {
  UPI: 'bg-purple-100 text-purple-700',
  Cash: 'bg-green-100 text-green-700',
  Card: 'bg-blue-100 text-blue-700',
  'Net Banking': 'bg-amber-100 text-amber-700',
};

const PersonDetail = () => {
  const { name, id } = useParams();
  const personId     = id || name;
  const [txs, setTxs]       = useState([]);
  const [total, setTotal]   = useState(0);
  const [person, setPerson] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pRes, expRes] = await Promise.all([
          api.get(`expenses/people/${personId}/`),
          api.get(`expenses/expenses/?person=${personId}`),
        ]);
        setPerson(pRes.data);
        const data = expRes.data || [];
        setTxs(data);
        setTotal(data.reduce((s, x) => s + Number(x.amount || 0), 0));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [personId]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
    </div>
  );

  return (
    <div className="space-y-5 sm:space-y-6 max-w-2xl mx-auto">

      {/* Back + title */}
      <div className="flex items-start gap-3">
        <Link to="/people"
          className="p-2 rounded-xl shrink-0 mt-0.5 transition-colors"
          style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-extrabold truncate" style={{ color: 'var(--text-primary)' }}>
            {person?.name}
          </h1>
          {person?.email && <p className="text-sm truncate" style={{ color: 'var(--text-muted)' }}>{person.email}</p>}
        </div>
      </div>

      {/* Summary card */}
      <div className="rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-5 sm:p-6 text-white shadow-xl shadow-indigo-500/30">
        <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-1">Total Spent</p>
        <div className="flex items-center gap-1">
          <IndianRupee className="h-6 w-6 sm:h-8 sm:w-8" />
          <span className="text-3xl sm:text-4xl font-extrabold">{total.toLocaleString('en-IN')}</span>
        </div>
        <p className="text-indigo-200 text-xs mt-1">{txs.length} transaction{txs.length !== 1 ? 's' : ''}</p>
        <button
          onClick={() => navigate(`/add-expense?person=${encodeURIComponent(person?.name || '')}`)}
          className="mt-4 flex items-center gap-2 bg-white text-indigo-600 font-bold px-4 py-2 rounded-xl text-sm hover:bg-indigo-50 transition-all shadow"
        >
          <Plus className="h-4 w-4" /> Add Expense
        </button>
      </div>

      {/* Transactions */}
      <div>
        <h2 className="text-base font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Transactions</h2>
        {txs.length === 0 ? (
          <div className="card p-10 flex flex-col items-center text-center">
            <Wallet className="h-10 w-10 mb-2" style={{ color: 'var(--border)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No transactions for this person yet.</p>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {txs.map(tx => (
              <div key={tx.id} className="card p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{tx.expense_name}</p>
                  <div className="flex items-center flex-wrap gap-2 mt-1">
                    <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <Calendar className="h-3 w-3" /> {tx.expense_date}
                    </span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${PAYMENT_COLORS[tx.payment_mode] || 'bg-gray-100 text-gray-600'}`}>
                      {tx.payment_mode}
                    </span>
                    {tx.category_name && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-semibold">
                        {tx.category_name}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-0.5 font-extrabold text-sm shrink-0" style={{ color: 'var(--text-primary)' }}>
                  <IndianRupee className="h-3.5 w-3.5" />
                  {Number(tx.amount).toLocaleString('en-IN')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonDetail;
