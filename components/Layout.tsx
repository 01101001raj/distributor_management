import React, { useState, useEffect } from 'react';
// FIX: Use namespace import for react-router-dom to resolve export errors.
import * as ReactRouterDOM from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { NAVIGATION_ITEMS } from '../constants';
import { LogOut, Menu, X, ChevronsLeft, ChevronsRight, Briefcase } from 'lucide-react';
import NotificationDropdown from './common/NotificationDropdown';
import { UserRole } from '../types';

const SidebarContent: React.FC<{ userRole: UserRole; handleLogout: () => void; isCollapsed: boolean; toggleCollapse: () => void }> = ({ userRole, handleLogout, isCollapsed, toggleCollapse }) => (
    <div className="flex flex-col h-full bg-card">
      <div className={`h-16 flex items-center border-b border-border transition-all duration-300 overflow-hidden ${isCollapsed ? 'px-2 justify-center' : 'px-6'}`}>
        {isCollapsed ? (
          <Briefcase size={24} className="text-primary" />
        ) : (
          <h1 className="text-xl font-bold text-primary whitespace-nowrap">Distributor Portal</h1>
        )}
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
          {NAVIGATION_ITEMS.map((item) =>
            item.roles.includes(userRole) && (
              <div key={item.path} title={isCollapsed ? item.label : undefined}>
                <ReactRouterDOM.NavLink
                  to={item.path}
                  className={({ isActive }) => 
                    `relative flex items-center p-3 rounded-md transition-colors duration-200 text-sm font-medium overflow-hidden ${isCollapsed ? 'justify-center' : ''} ${isActive ? 'bg-primary-lightest text-primary font-semibold' : 'text-text-secondary hover:bg-slate-100 hover:text-text-primary'}`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && <div className="absolute left-0 top-2 bottom-2 w-1 bg-primary rounded-r-full"></div>}
                      <span className="flex-shrink-0">{item.icon}</span>
                      <span className={`ml-3 whitespace-nowrap transition-opacity duration-200 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>{item.label}</span>
                    </>
                  )}
                </ReactRouterDOM.NavLink>
              </div>
            )
          )}
      </nav>
      <div className="p-3 border-t border-border mt-auto">
          <button onClick={toggleCollapse} className="hidden md:flex items-center w-full p-3 rounded-md transition-colors duration-200 text-sm font-medium text-text-secondary hover:bg-slate-100 hover:text-text-primary overflow-hidden">
            <span className="flex-shrink-0">{isCollapsed ? <ChevronsRight size={20} /> : <ChevronsLeft size={20}/>}</span>
            <span className={`ml-3 transition-opacity duration-200 whitespace-nowrap ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>Collapse</span>
          </button>
          <button onClick={handleLogout} className="flex items-center w-full mt-1 p-3 rounded-md transition-colors duration-200 text-sm font-medium text-text-secondary hover:bg-slate-100 hover:text-text-primary overflow-hidden">
              <LogOut size={20} />
              <span className={`ml-3 transition-opacity duration-200 whitespace-nowrap ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>Logout</span>
          </button>
      </div>
    </div>
  );

const Layout: React.FC = () => {
  const { userRole, logout, currentUser } = useAuth();
  const location = ReactRouterDOM.useLocation();
  const navigate = ReactRouterDOM.useNavigate();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  if (!userRole || !currentUser) {
      return null;
  }

  const getPageTitle = () => {
    const currentNavItem = NAVIGATION_ITEMS.find(item => location.pathname.startsWith(item.path) && item.path !== '/');
    if (currentNavItem) return currentNavItem.label;
    if (location.pathname.startsWith('/distributors/')) return 'Distributor Details';
    if (location.pathname === '/') return 'Dashboard';
    return 'Dashboard';
  }

  return (
    <div className="flex h-screen bg-background text-text-primary">
      {/* Mobile Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-card flex flex-col transition-transform duration-300 ease-in-out md:hidden border-r border-border ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent userRole={userRole} handleLogout={handleLogout} isCollapsed={false} toggleCollapse={() => {}} />
      </aside>
      
      {/* Overlay for Mobile */}
      {isMobileSidebarOpen && (
          <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
              onClick={() => setIsMobileSidebarOpen(false)}
          ></div>
      )}

      {/* Desktop Sidebar */}
      <aside className={`bg-card flex-col hidden md:flex transition-all duration-300 border-r border-border ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}>
        <SidebarContent userRole={userRole} handleLogout={handleLogout} isCollapsed={isSidebarCollapsed} toggleCollapse={() => setIsSidebarCollapsed(prev => !prev)} />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-card flex items-center justify-between px-6 flex-shrink-0 border-b border-border">
          <div className="flex items-center">
            <button onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)} className="md:hidden mr-4 p-2 -ml-2 rounded-md hover:bg-slate-100">
                {isMobileSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <h2 className="text-xl font-semibold text-text-primary truncate">{getPageTitle()}</h2>
          </div>
          <div className="flex items-center gap-4">
            <NotificationDropdown />
            <div className="text-right">
              <p className="font-medium text-sm truncate">{currentUser.username}</p>
              <p className="text-xs text-text-secondary">{currentUser.role}</p>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <ReactRouterDOM.Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;