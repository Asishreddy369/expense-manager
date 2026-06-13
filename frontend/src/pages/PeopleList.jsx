import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Link } from 'react-router-dom';

const PeopleList = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('expenses/people/');
        const data = res.data || [];
        setGroups(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">People</h2>
      {groups.length === 0 ? (
        <div className="text-gray-500">No people found. Add expenses to create people.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groups.map(g => (
            <Link key={g.id} to={`/people/${g.id}`} className="bg-white p-4 rounded-lg border border-gray-100 hover:shadow">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-gray-900">{g.name}</p>
                  <p className="text-sm text-gray-400">Created: {new Date(g.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">₹{Number(g.total_amount || 0).toLocaleString()}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default PeopleList;
