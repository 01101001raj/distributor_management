
import React, { ReactNode, useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { NAVIGATION_ITEMS } from '../constants';
import Button from './common/Button';
import { LogOut, Menu, X } from 'lucide-react';
import NotificationDropdown from './common/NotificationDropdown';

const Layout: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { userRole, logout, currentUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  if (!userRole || !currentUser) {
      return null;
  }
  
  if (location.pathname.startsWith('/invoice/')) {
    return <>{children}</>;
  }

  const SidebarContent = () => (
    <>
      <div className="h-16 flex items-center justify-center border-b border-border">
        <h1 className="text-xl font-semibold text-primary">Distributor Portal</h1>
      </div>
      <nav className="flex-1 px-4 py-4">
        <ul>
          {NAVIGATION_ITEMS.map((item) =>
            item.roles.includes(userRole) && (
              <li key={item.path} className="mb-2">
                <NavLink
                  to={item.path}
                  className={({ isActive }) => 
                    `flex items-center p-2 rounded-lg transition-colors duration-200 ${isActive ? 'bg-blue-50 text-primary font-semibold' : 'text-text-secondary hover:bg-gray-100'}`
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
      <div className="p-4 border-t border-border">
          <Button onClick={handleLogout} variant="secondary" className="w-full">
              <LogOut size={16} className="mr-2" />
              Logout
          </Button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-background text-text-primary">
      {/* Mobile Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border flex flex-col transition-transform duration-300 ease-in-out md:hidden ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent />
      </aside>
      
      {/* Overlay for Mobile */}
      {isSidebarOpen && (
          <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
              onClick={() => setIsSidebarOpen(false)}
          ></div>
      )}

      {/* Desktop Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex-col hidden md:flex">
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden mr-4 p-2 rounded-md hover:bg-gray-100">
                {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            {(() => {
                const currentNavItem = NAVIGATION_ITEMS.find(item => location.pathname.includes(item.path) && item.path !== '/');
                let title = 'Dashboard'; // Default title
                if (currentNavItem) {
                    title = currentNavItem.label;
                } else if (location.pathname.startsWith('/distributors/')) {
                    title = 'Distributor Details';
                }
                return <h2 className="text-xl sm:text-2xl font-semibold text-text-primary truncate">{title}</h2>;
            })()}
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <NotificationDropdown />
            <div className="text-right">
              <p className="font-semibold text-sm sm:text-base truncate">{currentUser.username}</p>
              <p className="text-xs sm:text-sm text-text-secondary">{currentUser.role}</p>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
