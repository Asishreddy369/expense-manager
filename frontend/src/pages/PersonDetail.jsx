import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';

const PersonDetail = () => {
  const { name, id } = useParams();
  const personId = id || name; // support old route
  const [txs, setTxs] = useState([]);
  const [total, setTotal] = useState(0);
  const [person, setPerson] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      try {
        // fetch person details
        const pRes = await api.get(`expenses/people/${personId}/`);
        setPerson(pRes.data);
        // fetch transactions for this person
        const res = await api.get(`expenses/expenses/?person=${personId}`);
        const data = res.data || [];
        setTxs(data);
        setTotal(data.reduce((s, x) => s + Number(x.amount || 0), 0));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [personId]);

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">{person?.name}</h2>
          <p className="text-sm text-gray-500">Total: ₹{total.toLocaleString()}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate(`/add-expense?person=${encodeURIComponent(person?.name || '')}`)} className="px-4 py-2 bg-primary text-white rounded">Add Expense</button>
          <Link to="/people" className="px-4 py-2 border rounded">Back</Link>
        </div>
      </div>

      {txs.length === 0 ? (
        <div className="text-gray-500">No transactions for this person.</div>
      ) : (
        <div className="space-y-3">
          {txs.map(tx => (
            <div key={tx.id} className="bg-white p-4 rounded border">
              <div className="flex justify-between">
                <div>
                  <p className="font-semibold">{tx.expense_name}</p>
                  <p className="text-xs text-gray-400">{tx.expense_date} • {tx.payment_mode}</p>
                </div>
                <div className="font-bold">₹{tx.amount}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PersonDetail;
