import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const Layout = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--bg-page)' }}>
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      {/* On mobile: no left margin (sidebar is overlay). On md+: margin matches sidebar width */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${collapsed ? 'md:ml-20' : 'md:ml-64'}`}>
        <Navbar />
        {/* pt-2 on mobile gives breathing room below the sticky navbar; hamburger button is in the sidebar overlay */}
        <main className="flex-1 w-full mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
