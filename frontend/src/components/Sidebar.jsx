import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Home, List, Users, PlusCircle, PieChart, FileText, LogOut, Menu, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [openOnMobile, setOpenOnMobile] = useState(false);

  useEffect(() => {
    const handler = () => setOpenOnMobile(o => !o);
    window.addEventListener('toggleSidebar', handler);
    return () => window.removeEventListener('toggleSidebar', handler);
  }, []);

  return (
    <>
      {/* overlay for mobile when open */}
      <div className={`fixed inset-0 bg-black/40 z-30 md:hidden transition-opacity ${openOnMobile ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={() => setOpenOnMobile(false)} />

      <aside className={`fixed top-0 left-0 h-full z-40 bg-white border-r border-gray-100 transform transition-transform ${openOnMobile ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 ${collapsed ? 'w-20' : 'w-64'}`}>
        <div className="p-4 flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <Link to="/" className={`flex items-center gap-2 ${collapsed ? 'opacity-0 w-0 overflow-hidden' : ''}`}>
              <div className="bg-primary p-2 rounded-lg">
                <PieChart className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900">ExpensePro</span>
            </Link>
            <button onClick={() => setCollapsed(c => !c)} className="p-1 rounded hover:bg-gray-50">
              {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
            </button>
          </div>

          <nav className="flex-1 flex flex-col gap-1">
            <Link to="/" className="px-3 py-2 rounded-lg flex items-center gap-3 text-gray-700 hover:bg-gray-50">
              <Home className="h-4 w-4" /> {!collapsed && 'Dashboard'}
            </Link>
            <Link to="/people" className="px-3 py-2 rounded-lg flex items-center gap-3 text-gray-700 hover:bg-gray-50">
              <Users className="h-4 w-4" /> {!collapsed && 'People'}
            </Link>
            <Link to="/expenses" className="px-3 py-2 rounded-lg flex items-center gap-3 text-gray-700 hover:bg-gray-50">
              <List className="h-4 w-4" /> {!collapsed && 'Expenses'}
            </Link>
            <Link to="/add-expense" className="px-3 py-2 rounded-lg flex items-center gap-3 text-gray-700 hover:bg-gray-50">
              <PlusCircle className="h-4 w-4" /> {!collapsed && 'Add Expense'}
            </Link>
            <Link to="/reports" className="px-3 py-2 rounded-lg flex items-center gap-3 text-gray-700 hover:bg-gray-50">
              <FileText className="h-4 w-4" /> {!collapsed && 'Reports'}
            </Link>
          </nav>

          <div className="mt-6">
            <button onClick={() => { logout(); window.location.href = '/login'; }} className="w-full text-left px-3 py-2 rounded-lg flex items-center gap-3 text-red-500 hover:bg-red-50">
              <LogOut className="h-4 w-4" /> {!collapsed && 'Logout'}
            </button>
          </div>
        </div>
      </aside>

      {/* mobile menu button top-left */}
      <button className="md:hidden fixed top-3 left-3 z-50 bg-white p-2 rounded shadow" onClick={() => window.dispatchEvent(new Event('toggleSidebar'))} aria-label="Toggle menu">
        <Menu className="h-5 w-5" />
      </button>
    </>
  );
};

export default Sidebar;
