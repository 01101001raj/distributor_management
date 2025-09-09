export enum UserRole {
  SUPER_ADMIN = 'Super Admin',
  EXECUTIVE = 'Executive',
  USER = 'User',
}

export interface User {
  id: string;
  username: string;
  password: string; // In a real app, this would be a hash
  role: UserRole;
}

export interface Distributor {
  id: string;
  name: string;
  phone: string;
  state: string;
  area: string;
  creditLimit: number;
  creditUsed: number;
  walletBalance: number;
  hasSpecialPricing: boolean;
  hasSpecialSchemes: boolean;
  agreementUrl?: string;
  dateAdded: string;
  addedByExecId: string;
}

export interface SKU {
  id: string;
  name:string;
  price: number;
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
}

export enum TransactionType {
  ORDER_DEBIT = 'ORDER_DEBIT',
  RECHARGE = 'RECHARGE'
}

export interface WalletTransaction {
  id: string;
  distributorId: string;
  amount: number;
  type: TransactionType;
  date: string;
  addedBy: string;
}

export interface Order {
  id:string;
  distributorId: string;
  totalAmount: number;
  coveredByWallet: number;
  coveredByCredit: number;
  date: string;
  placedByExecId: string;
}

export interface OrderItem {
  orderId: string;
  skuId: string;
  quantity: number;
  freeQuantity: number; // For "buy A get A" simple schemes
  unitPrice: number;
  isFreebie: boolean; // For "buy A get B" schemes
}

export interface EnrichedOrderItem extends OrderItem {
  skuName: string;
}

export enum NotificationType {
  WALLET_LOW = 'WALLET_LOW',
  ORDER_PLACED = 'ORDER_PLACED',
  ORDER_FAILED = 'ORDER_FAILED',
  NEW_SCHEME = 'NEW_SCHEME',
  DISTRIBUTOR_ADDED = 'DISTRIBUTOR_ADDED',
  CREDIT_LIMIT_HIGH = 'CREDIT_LIMIT_HIGH',
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