import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Link, useNavigate } from 'react-router-dom';
import { Users, ChevronRight, Plus, IndianRupee } from 'lucide-react';

const AVATAR_COLORS = ['from-indigo-500 to-purple-600', 'from-pink-500 to-rose-600',
  'from-teal-500 to-cyan-600', 'from-amber-500 to-orange-600', 'from-emerald-500 to-green-600'];

const PeopleList = () => {
  const [people, setPeople]   = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate              = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [peopleRes, expRes] = await Promise.all([
          api.get('expenses/people/'),
          api.get('expenses/expenses/'),
        ]);
        const expData = expRes.data || [];
        // Compute total per person
        const totals = {};
        expData.forEach(e => {
          if (e.person) totals[e.person] = (totals[e.person] || 0) + Number(e.amount || 0);
        });
        setPeople((peopleRes.data || []).map(p => ({ ...p, total_amount: totals[p.id] || 0 })));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
    </div>
  );

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            People
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Track expenses shared with others.
          </p>
        </div>
        <button
          onClick={() => navigate('/add-expense')}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-xl font-semibold text-sm shadow-md shadow-indigo-500/20 hover:from-indigo-700 hover:to-purple-700 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add Expense</span>
        </button>
      </header>

      {people.length === 0 ? (
        <div className="card p-10 sm:p-16 flex flex-col items-center text-center">
          <Users className="h-12 w-12 mb-3" style={{ color: 'var(--border)' }} />
          <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>No people yet</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Add an expense and link it to a person to see them here.
          </p>
          <Link to="/add-expense"
            className="mt-4 px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-sm">
            + Add Expense
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {people.map((person, i) => (
            <Link
              key={person.id}
              to={`/people/${person.id}`}
              className="card p-4 flex items-center gap-4 hover:shadow-md transition-all group"
            >
              {/* Avatar */}
              <div className={`h-11 w-11 sm:h-12 sm:w-12 rounded-2xl bg-gradient-to-br ${AVATAR_COLORS[i % AVATAR_COLORS.length]} flex items-center justify-center text-white font-bold text-lg shrink-0 shadow`}>
                {person.name[0].toUpperCase()}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm sm:text-base truncate" style={{ color: 'var(--text-primary)' }}>{person.name}</p>
                {person.email && <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{person.email}</p>}
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  Since {new Date(person.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              </div>
              {/* Total */}
              <div className="text-right shrink-0">
                <div className="flex items-center gap-0.5 justify-end font-extrabold text-sm sm:text-base" style={{ color: 'var(--text-primary)' }}>
                  <IndianRupee className="h-3.5 w-3.5" />
                  {Number(person.total_amount).toLocaleString('en-IN')}
                </div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>total</p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--text-muted)' }} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default PeopleList;
