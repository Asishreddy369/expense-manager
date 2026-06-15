import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const Layout = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--bg-page)' }}>
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${collapsed ? 'md:ml-20' : 'md:ml-64'}`}>
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
