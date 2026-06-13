import React from 'react';
import { Link } from 'react-router-dom';
import { Home, List, Users, PlusCircle, PieChart, FileText, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { logout } = useAuth();

  return (
    <aside className="w-64 bg-white border-r border-gray-100 fixed h-full top-0 left-0 z-20">
      <div className="p-4">
        <Link to="/" className="flex items-center gap-2 mb-6">
          <div className="bg-primary p-2 rounded-lg">
            <PieChart className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-gray-900">ExpensePro</span>
        </Link>

        <nav className="flex flex-col gap-1">
          <Link to="/" className="px-3 py-2 rounded-lg flex items-center gap-3 text-gray-700 hover:bg-gray-50">
            <Home className="h-4 w-4" /> Dashboard
          </Link>
          <Link to="/people" className="px-3 py-2 rounded-lg flex items-center gap-3 text-gray-700 hover:bg-gray-50">
            <Users className="h-4 w-4" /> People
          </Link>
          <Link to="/expenses" className="px-3 py-2 rounded-lg flex items-center gap-3 text-gray-700 hover:bg-gray-50">
            <List className="h-4 w-4" /> Expenses
          </Link>
          <Link to="/add-expense" className="px-3 py-2 rounded-lg flex items-center gap-3 text-gray-700 hover:bg-gray-50">
            <PlusCircle className="h-4 w-4" /> Add Expense
          </Link>
          <Link to="/reports" className="px-3 py-2 rounded-lg flex items-center gap-3 text-gray-700 hover:bg-gray-50">
            <FileText className="h-4 w-4" /> Reports
          </Link>
        </nav>

        <div className="mt-6">
          <button onClick={() => { logout(); window.location.href = '/login'; }} className="w-full text-left px-3 py-2 rounded-lg flex items-center gap-3 text-red-500 hover:bg-red-50">
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
