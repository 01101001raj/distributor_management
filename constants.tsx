import React from 'react';
import { UserRole } from './types';
import { LayoutDashboard, UserPlus, ShoppingCart, Wallet, ListOrdered, Boxes, Bell, Users, Sparkles, TrendingUp } from 'lucide-react';

export const ROLES = [UserRole.SUPER_ADMIN, UserRole.EXECUTIVE, UserRole.USER];

export const NAVIGATION_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, roles: [UserRole.SUPER_ADMIN, UserRole.EXECUTIVE, UserRole.USER] },
  { path: '/orders', label: 'Order History', icon: <ListOrdered size={20} />, roles: [UserRole.SUPER_ADMIN, UserRole.EXECUTIVE, UserRole.USER] },
  { path: '/sales', label: 'Sales', icon: <TrendingUp size={20} />, roles: [UserRole.SUPER_ADMIN, UserRole.EXECUTIVE, UserRole.USER] },
  { path: '/notifications', label: 'Notifications', icon: <Bell size={20} />, roles: [UserRole.SUPER_ADMIN, UserRole.EXECUTIVE, UserRole.USER] },
  { path: '/add-distributor', label: 'Add Distributor', icon: <UserPlus size={20} />, roles: [UserRole.SUPER_ADMIN, UserRole.EXECUTIVE] },
  { path: '/place-order', label: 'Place Order', icon: <ShoppingCart size={20} />, roles: [UserRole.SUPER_ADMIN, UserRole.EXECUTIVE] },
  { path: '/recharge-wallet', label: 'Recharge Wallet', icon: <Wallet size={20} />, roles: [UserRole.SUPER_ADMIN, UserRole.EXECUTIVE] },
  { path: '/manage-skus', label: 'Manage Products', icon: <Boxes size={20} />, roles: [UserRole.SUPER_ADMIN] },
  { path: '/manage-schemes', label: 'Manage Schemes', icon: <Sparkles size={20} />, roles: [UserRole.SUPER_ADMIN] },
  { path: '/user-management', label: 'User Management', icon: <Users size={20} />, roles: [UserRole.SUPER_ADMIN] },
];