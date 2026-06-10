import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Home, PieChart, List, PlusCircle, UserCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-100 fixed w-full z-10 top-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <div className="bg-primary p-2 rounded-lg">
                <PieChart className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 hidden sm:block">ExpensePro</span>
            </Link>
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            <Link to="/" className="text-gray-600 hover:text-primary p-2 transition-colors">
              <Home className="h-5 w-5" />
            </Link>
            <Link to="/expenses" className="text-gray-600 hover:text-primary p-2 transition-colors">
              <List className="h-5 w-5" />
            </Link>
            <button
               onClick={() => navigate('/add-expense')}
               className="bg-primary text-white p-2 rounded-full hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
            >
              <PlusCircle className="h-5 w-5" />
            </button>
            <div className="h-8 w-px bg-gray-200"></div>
            <div className="flex items-center gap-2">
              <UserCircle className="h-8 w-8 text-gray-400" />
              <span className="text-sm font-medium text-gray-700 hidden md:block">{user?.username || 'User'}</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-400 hover:text-red-500 p-2 transition-colors"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
