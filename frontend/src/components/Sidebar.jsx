import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, List, Users, PlusCircle, PieChart, FileText, LogOut, Menu, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ collapsed, setCollapsed }) => {
  const { logout } = useAuth();
  const location = useLocation();
  const [openOnMobile, setOpenOnMobile] = useState(false);

  useEffect(() => {
    const handler = () => setOpenOnMobile(o => !o);
    window.addEventListener('toggleSidebar', handler);
    return () => window.removeEventListener('toggleSidebar', handler);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    setOpenOnMobile(false);
  }, [location.pathname]);

  const navLinks = [
    { to: '/', icon: <Home className="h-4 w-4 shrink-0" />, label: 'Dashboard', color: 'text-indigo-600 bg-indigo-50' },
    { to: '/people', icon: <Users className="h-4 w-4 shrink-0" />, label: 'People', color: 'text-pink-600 bg-pink-50' },
    { to: '/expenses', icon: <List className="h-4 w-4 shrink-0" />, label: 'Expenses', color: 'text-teal-600 bg-teal-50' },
    { to: '/add-expense', icon: <PlusCircle className="h-4 w-4 shrink-0" />, label: 'Add Expense', color: 'text-purple-600 bg-purple-50' },
    { to: '/reports', icon: <FileText className="h-4 w-4 shrink-0" />, label: 'Reports', color: 'text-amber-600 bg-amber-50' },
  ];

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 bg-black/40 z-30 md:hidden transition-opacity ${openOnMobile ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setOpenOnMobile(false)}
      />

      <aside
        className={`
          fixed top-0 left-0 h-full z-40 sidebar-theme
          flex flex-col
          transition-all duration-300
          ${openOnMobile ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
          ${collapsed ? 'w-20' : 'w-64'}
        `}
      >
        {/* Logo + collapse toggle */}
        <div className="p-4 flex items-center justify-between border-b h-16 shrink-0" style={{ borderColor: 'var(--border)' }}>
          {!collapsed && (
            <Link to="/" className="flex items-center gap-2 overflow-hidden">
              <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-2 rounded-xl shrink-0 shadow-lg shadow-indigo-500/30">
                <PieChart className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent whitespace-nowrap">ExpensePro</span>
            </Link>
          )}
          {collapsed && (
            <div className="mx-auto bg-gradient-to-br from-indigo-600 to-purple-600 p-2 rounded-xl shadow-lg shadow-indigo-500/30">
              <PieChart className="h-5 w-5 text-white" />
            </div>
          )}
          <button
            onClick={() => setCollapsed(c => !c)}
            className={`p-1 rounded hover:bg-gray-50 shrink-0 ${collapsed ? 'mx-auto' : ''}`}
            aria-label="Toggle sidebar"
          >
            {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 flex flex-col gap-1 p-3 overflow-y-auto">
          {navLinks.map(({ to, icon, label, color }) => (
            <Link
              key={to}
              to={to}
              className={`
                px-3 py-2.5 rounded-xl flex items-center gap-3 transition-all text-sm font-medium
                ${isActive(to) ? color + ' font-bold shadow-sm' : 'hover:bg-violet-50 dark:hover:bg-violet-950/40'}
                ${collapsed ? 'justify-center' : ''}
              `}
              style={!isActive(to) ? { color: 'var(--text-secondary)' } : {}}
              title={collapsed ? label : undefined}
            >
              <span className={isActive(to) ? '' : 'text-gray-400'}>{icon}</span>
              {!collapsed && <span className="whitespace-nowrap">{label}</span>}
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t shrink-0" style={{ borderColor: 'var(--border)' }}>
          <button
            onClick={() => { logout(); window.location.href = '/login'; }}
            className={`w-full px-3 py-2 rounded-lg flex items-center gap-3 text-red-500 hover:bg-red-50 transition-colors ${collapsed ? 'justify-center' : ''}`}
            title={collapsed ? 'Logout' : undefined}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="whitespace-nowrap">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Mobile hamburger */}
      <button
        className="md:hidden fixed top-3 left-3 z-50 bg-white p-2 rounded shadow"
        onClick={() => window.dispatchEvent(new Event('toggleSidebar'))}
        aria-label="Toggle menu"
      >
        <Menu className="h-5 w-5" />
      </button>
    </>
  );
};

export default Sidebar;
