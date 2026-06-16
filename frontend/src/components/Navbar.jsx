import React, { useContext } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, PlusCircle, Bell, Sun, Moon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { ThemeContext } from '../App';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { dark, setDark } = useContext(ThemeContext);

  return (
    <nav className="navbar-theme sticky top-0 z-20 w-full">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14 sm:h-16 items-center">

          {/* Logo — shifted right on mobile to avoid hamburger overlap */}
          <Link to="/" className="flex items-center gap-2 pl-10 md:pl-0">
            <div className="bg-gradient-to-br from-violet-600 to-purple-700 p-2 rounded-xl shadow-lg shadow-violet-500/30">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-lg font-extrabold bg-gradient-to-r from-violet-600 to-purple-500 bg-clip-text text-transparent hidden sm:block">
              ExpensePro
            </span>
          </Link>

          {/* Right actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">

            {/* Add Expense */}
            <button onClick={() => navigate('/add-expense')}
              className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white px-3 sm:px-4 py-2 rounded-xl font-semibold text-sm hover:from-violet-700 hover:to-purple-700 transition-all shadow-md shadow-violet-500/20">
              <PlusCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Add Expense</span>
            </button>

            {/* Dark mode toggle */}
            <button
              onClick={() => setDark(d => !d)}
              className="p-2 rounded-xl transition-colors"
              style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
              title={dark ? 'Switch to Light' : 'Switch to Dark'}
            >
              {dark ? <Sun className="h-4 w-4 text-yellow-400" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Bell — hidden on xs to save space */}
            <button className="relative p-2 rounded-xl transition-colors hidden sm:block"
              style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-pink-500 rounded-full"></span>
            </button>

            {/* Avatar */}
            <div className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-xl"
              style={{ background: 'var(--input-bg)', border: '1px solid var(--border)' }}>
              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-white font-bold text-xs shadow">
                {user?.username?.[0]?.toUpperCase() || 'U'}
              </div>
              <span className="text-sm font-semibold hidden md:block" style={{ color: 'var(--text-primary)' }}>
                {user?.username || 'User'}
              </span>
            </div>

            {/* Logout */}
            <button onClick={() => { logout(); navigate('/login'); }}
              className="p-2 rounded-xl transition-colors hover:bg-red-50 hover:text-red-500"
              style={{ color: 'var(--text-muted)' }}>
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
