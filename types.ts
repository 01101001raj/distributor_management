// FIX: Replaced incorrect content with proper type definitions to resolve circular dependency and export errors.

export enum UserRole {
  SUPER_ADMIN = 'Super Admin',
  EXECUTIVE = 'Executive',
  USER = 'User',
}

export enum TransactionType {
  RECHARGE = 'RECHARGE',
  ORDER_DEBIT = 'ORDER_DEBIT',
  ORDER_ADJUSTMENT = 'ORDER_ADJUSTMENT',
  ORDER_CONFIRMED = 'ORDER_CONFIRMED',
}

export enum NotificationType {
  WALLET_LOW = 'WALLET_LOW',
  ORDER_PLACED = 'ORDER_PLACED',
  ORDER_FAILED = 'ORDER_FAILED',
  NEW_SCHEME = 'NEW_SCHEME',
  DISTRIBUTOR_ADDED = 'DISTRIBUTOR_ADDED',
}

export enum OrderStatus {
    PENDING = 'Pending',
    DELIVERED = 'Delivered',
}

export interface User {
  id: string;
  username: string;
  password?: string;
  role: UserRole;
}

export interface Distributor {
  id: string;
  name: string;
  phone: string;
  state: string;
  area: string;
  hasSpecialPricing: boolean;
  hasSpecialSchemes: boolean;
  agreementUrl?: string;
  walletBalance: number;
  dateAdded: string;
  addedByExecId: string;
}

export interface SKU {
  id: string;
  name: string;
  price: number;
  hsnCode?: string;
}

export interface SpecialPrice {
  id: string;
  distributorId: string;
  skuId: string;
  price: number;
  startDate: string;
  endDate: string;
}

export interface Scheme {
  id: string;
  description: string;
  buySkuId: string;
  buyQuantity: number;
  getSkuId: string;
  getQuantity: number;
  isGlobal: boolean;
  distributorId?: string;
  startDate: string;
  endDate: string;
}

export interface WalletTransaction {
  id: string;
  distributorId: string;
  amount: number;
  type: TransactionType;
  date: string;
  addedBy: string;
  orderId?: string;
}

export interface EnrichedWalletTransaction extends WalletTransaction {
  balanceAfter: number;
}

export interface Order {
  id: string;
  distributorId: string;
  totalAmount: number;
  coveredByWallet: number;
  date: string;
  placedByExecId: string;
  status: OrderStatus;
}

export interface OrderItem {
  orderId: string;
  skuId: string;
  quantity: number;
  freeQuantity: number; // This property is legacy, main logic uses isFreebie
  unitPrice: number;
  isFreebie: boolean;
}

export interface EnrichedOrderItem extends OrderItem {
  skuName: string;
  hsnCode?: string;
}

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  distributorId?: string;
  isRead: boolean;
  date: string;
}

export interface InvoiceData {
    order: Order;
    distributor: Distributor;
    items: EnrichedOrderItem[];
}