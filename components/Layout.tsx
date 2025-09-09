

import React, { ReactNode } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { NAVIGATION_ITEMS } from '../constants';
import Button from './common/Button';
import { LogOut } from 'lucide-react';
import NotificationDropdown from './common/NotificationDropdown';

const Layout: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { userRole, logout, currentUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  if (!userRole || !currentUser) {
      return null;
  }
  
  // Render children directly for the invoice page to allow for a clean, printable layout
  if (location.pathname.startsWith('/invoice/')) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-background text-text-primary">
      {/* Sidebar */}
      <aside className="w-64 bg-card shadow-lg flex flex-col">
        <div className="h-16 flex items-center justify-center border-b border-gray-200">
          <h1 className="text-xl font-bold text-primary">Distributor Portal</h1>
        </div>
        <nav className="flex-1 px-4 py-4">
          <ul>
            {NAVIGATION_ITEMS.map((item) =>
              item.roles.includes(userRole) && (
                <li key={item.path} className="mb-2">
                  <NavLink
                    to={item.path}
                    className={({ isActive }) => 
                      `flex items-center p-2 rounded-lg transition-colors duration-200 hover:bg-gray-100 ${isActive ? 'bg-blue-100 text-primary' : ''}`
                    }
                  >
                    <span className="mr-3">{item.icon}</span>
                    {item.label}
                  </NavLink>
                </li>
              )
            )}
          </ul>
        </nav>
        <div className="p-4 border-t border-gray-200">
            <Button onClick={handleLogout} variant="secondary" className="w-full">
                <LogOut size={16} className="mr-2" />
                Logout
            </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-card shadow-md flex items-center justify-between px-6">
          {(() => {
              const currentNavItem = NAVIGATION_ITEMS.find(item => item.path === location.pathname);
              let title = 'Dashboard'; // Default title
              if (currentNavItem) {
                  title = currentNavItem.label;
              } else if (location.pathname.startsWith('/distributors/')) {
                  title = 'Distributor Details';
              }
              return <h2 className="text-2xl font-semibold text-text-primary">{title}</h2>;
          })()}
          <div className="flex items-center gap-4">
            <NotificationDropdown />
            <div className="text-right">
              <p className="font-semibold">{currentUser.username}</p>
              <p className="text-sm text-text-secondary">{currentUser.role}</p>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;