import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { NAVIGATION_ITEMS } from '../constants';
import { LogOut, Menu, X, ChevronsLeft, ChevronsRight, Briefcase } from 'lucide-react';
import NotificationDropdown from './common/NotificationDropdown';
import { UserRole } from '../types';

const SidebarContent: React.FC<{ userRole: UserRole; handleLogout: () => void; isCollapsed: boolean; toggleCollapse: () => void }> = ({ userRole, handleLogout, isCollapsed, toggleCollapse }) => (
    <div className="flex flex-col h-full">
      <div className={`h-16 flex items-center justify-center border-b border-border transition-all duration-300 ${isCollapsed ? 'px-2' : 'px-6'}`}>
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
                <NavLink
                  to={item.path}
                  className={({ isActive }) => 
                    `flex items-center p-3 rounded-md transition-colors duration-200 text-sm font-medium ${isCollapsed ? 'justify-center' : ''} ${isActive ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:bg-slate-100'}`
                  }
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  <span className={`ml-3 transition-opacity duration-200 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>{item.label}</span>
                </NavLink>
              </div>
            )
          )}
      </nav>
      <div className="p-3 border-t border-border mt-auto">
          <button onClick={toggleCollapse} className="hidden md:flex items-center w-full p-3 rounded-md transition-colors duration-200 text-sm font-medium text-text-secondary hover:bg-slate-100">
            <span className="flex-shrink-0">{isCollapsed ? <ChevronsRight size={20} /> : <ChevronsLeft size={20}/>}</span>
            <span className={`ml-3 transition-opacity duration-200 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>Collapse</span>
          </button>
          <button onClick={handleLogout} className="flex items-center w-full mt-1 p-3 rounded-md transition-colors duration-200 text-sm font-medium text-text-secondary hover:bg-slate-100">
              <LogOut size={20} />
              <span className={`ml-3 transition-opacity duration-200 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>Logout</span>
          </button>
      </div>
    </div>
  );

const Layout: React.FC = () => {
  const { userRole, logout, currentUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
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
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border flex flex-col transition-transform duration-300 ease-in-out md:hidden ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent userRole={userRole} handleLogout={handleLogout} isCollapsed={false} toggleCollapse={() => {}} />
      </aside>
      
      {/* Overlay for Mobile */}
      {isMobileSidebarOpen && (
          <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
              onClick={() => setIsMobileSidebarOpen(false)}
          ></div>
      )}

      {/* Desktop Sidebar */}
      <aside className={`bg-card border-r border-border flex-col hidden md:flex transition-all duration-300 ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}>
        <SidebarContent userRole={userRole} handleLogout={handleLogout} isCollapsed={isSidebarCollapsed} toggleCollapse={() => setIsSidebarCollapsed(prev => !prev)} />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-card flex items-center justify-between px-6 border-b border-border flex-shrink-0">
          <div className="flex items-center">
            <button onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)} className="md:hidden mr-4 p-2 -ml-2 rounded-md hover:bg-slate-100">
                {isMobileSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <h2 className="text-xl font-semibold text-text-primary truncate">{getPageTitle()}</h2>
          </div>
          <div className="flex items-center gap-4">
            <NotificationDropdown />
            <div className="text-right">
              <p className="font-semibold text-sm truncate">{currentUser.username}</p>
              <p className="text-xs text-text-secondary">{currentUser.role}</p>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;