import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
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
      <HashRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/*" element={<ProtectedApp />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}

function ProtectedApp() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Routes>
      {/* Routes that need the main layout */}
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="add-distributor" element={<DistributorOnboarding />} />
        <Route path="place-order" element={<PlaceOrder />} />
        <Route path="recharge-wallet" element={<RechargeWallet />} />
        <Route path="orders" element={<OrderHistory />} />
        <Route path="sales" element={<SalesPage />} />
        <Route path="distributors/:distributorId" element={<DistributorDetailsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="manage-skus" element={<ManageSKUs />} />
        <Route path="manage-schemes" element={<ManageSchemes />} />
        <Route path="special-assignments" element={<SpecialAssignmentsPage />} />
        <Route path="distributor-scorecard" element={<DistributorScorecardPage />} />
        <Route path="ceo-insights" element={<CEOInsightsPage />} />
        <Route path="user-management" element={<UserManagement />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
      
      {/* Standalone routes that do not use the main layout */}
      <Route path="invoice/:orderId" element={<Invoice />} />
    </Routes>
  );
}


export default App;
