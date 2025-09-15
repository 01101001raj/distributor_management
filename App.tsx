import React from 'react';
// FIX: Use namespace import for react-router-dom to resolve export errors.
import * as ReactRouterDOM from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import BentoPage from './components/BentoPage';
import DistributorOnboarding from './components/DistributorOnboarding';
import PlaceOrder from './components/PlaceOrder';
import RechargeWallet from './components/RechargeWallet';
import OrderHistory from './components/OrderHistory';
import ManageSKUs from './components/ManageSKUs';
import LoginPage from './components/LoginPage';
import NotificationsPage from './components/NotificationsPage';
import DistributorDetailsPage from './components/DistributorDetailsPage';
import UserManagement from './components/UserManagement';
import ManageSchemes from './components/ManageSchemes';
import Invoice from './components/Invoice';
import SalesPage from './components/SalesPage';
import SpecialAssignmentsPage from './components/SpecialAssignmentsPage';
import CEOInsightsPage from './components/CEOInsightsPage';
import DistributorScorecardPage from './components/DistributorScorecardPage';
import SettingsPage from './components/SettingsPage';

function App() {
  return (
    <AuthProvider>
      <ReactRouterDOM.HashRouter>
        <ReactRouterDOM.Routes>
          <ReactRouterDOM.Route path="/login" element={<LoginPage />} />
          <ReactRouterDOM.Route path="/*" element={<ProtectedApp />} />
        </ReactRouterDOM.Routes>
      </ReactRouterDOM.HashRouter>
    </AuthProvider>
  );
}

function ProtectedApp() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <ReactRouterDOM.Navigate to="/login" replace />;
  }

  return (
    <ReactRouterDOM.Routes>
      {/* Routes that need the main layout */}
      <ReactRouterDOM.Route element={<Layout />}>
        <ReactRouterDOM.Route index element={<ReactRouterDOM.Navigate to="/bento-dashboard" replace />} />
        <ReactRouterDOM.Route path="bento-dashboard" element={<BentoPage />} />
        <ReactRouterDOM.Route path="dashboard" element={<Dashboard />} />
        <ReactRouterDOM.Route path="add-distributor" element={<DistributorOnboarding />} />
        <ReactRouterDOM.Route path="place-order" element={<PlaceOrder />} />
        <ReactRouterDOM.Route path="recharge-wallet" element={<RechargeWallet />} />
        <ReactRouterDOM.Route path="orders" element={<OrderHistory />} />
        <ReactRouterDOM.Route path="sales" element={<SalesPage />} />
        <ReactRouterDOM.Route path="distributors/:distributorId" element={<DistributorDetailsPage />} />
        <ReactRouterDOM.Route path="notifications" element={<NotificationsPage />} />
        <ReactRouterDOM.Route path="manage-skus" element={<ManageSKUs />} />
        <ReactRouterDOM.Route path="manage-schemes" element={<ManageSchemes />} />
        <ReactRouterDOM.Route path="special-assignments" element={<SpecialAssignmentsPage />} />
        <ReactRouterDOM.Route path="distributor-scorecard" element={<DistributorScorecardPage />} />
        <ReactRouterDOM.Route path="ceo-insights" element={<CEOInsightsPage />} />
        <ReactRouterDOM.Route path="user-management" element={<UserManagement />} />
        <ReactRouterDOM.Route path="settings" element={<SettingsPage />} />
        <ReactRouterDOM.Route path="*" element={<ReactRouterDOM.Navigate to="/bento-dashboard" replace />} />
      </ReactRouterDOM.Route>
      
      {/* Standalone routes that do not use the main layout */}
      <ReactRouterDOM.Route path="invoice/:orderId" element={<Invoice />} />
    </ReactRouterDOM.Routes>
  );
}


export default App;