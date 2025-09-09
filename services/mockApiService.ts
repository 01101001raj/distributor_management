import { Distributor, SKU, Scheme, WalletTransaction, TransactionType, Order, OrderItem, UserRole, Notification, NotificationType, EnrichedOrderItem, User, SpecialPrice, InvoiceData, EnrichedWalletTransaction } from '../types';
import { DEFAULT_CREDIT_LIMIT } from '../config';

// --- MOCK DATABASE (Simulating Google Sheets) ---
let users: User[] = [
  { id: 'USER01', username: 'superadmin', password: 'password', role: UserRole.SUPER_ADMIN },
  { id: 'USER02', username: 'executive', password: 'password', role: UserRole.EXECUTIVE },
  { id: 'USER03', username: 'user', password: 'password', role: UserRole.USER },
];

let distributors: Distributor[] = [
    { 
        id: 'VIP-7890-24-AB',
        name: 'VIP Partners Inc.',
        phone: '9876547890',
        state: 'Maharashtra',
        area: 'Pune',
        hasSpecialPricing: true,
        hasSpecialSchemes: true,
        // Final balance after transactions
        walletBalance: 23310, 
        creditUsed: 500,
        creditLimit: 10000,
        dateAdded: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        addedByExecId: 'executive',
    },
    { 
        id: 'SCH-1234-24-CD',
        name: 'Scheme Queen Supplies',
        phone: '9876541234',
        state: 'Karnataka',
        area: 'Bengaluru',
        hasSpecialPricing: false,
        hasSpecialSchemes: true,
        // Final balance after transactions
        walletBalance: 12400,
        creditUsed: 1200,
        creditLimit: 5000,
        dateAdded: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        addedByExecId: 'executive',
    },
    { 
        id: 'PRI-5678-24-EF',
        name: 'Price Saver Wholesale',
        phone: '9876545678',
        state: 'Tamil Nadu',
        area: 'Chennai',
        hasSpecialPricing: true,
        hasSpecialSchemes: false,
        // Final balance after transactions
        walletBalance: 28200, 
        creditUsed: 0,
        creditLimit: 2000,
        dateAdded: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        addedByExecId: 'executive',
    },
    { 
        id: 'STA-9012-24-GH',
        name: 'Standard Provisions',
        phone: '9876549012',
        state: 'Delhi',
        area: 'New Delhi',
        hasSpecialPricing: false,
        hasSpecialSchemes: false,
        // Final balance after transactions
        walletBalance: 4000, 
        creditUsed: 1800,
        creditLimit: 2000,
        dateAdded: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        addedByExecId: 'executive',
    }
];

let skus: SKU[] = [
  { id: 'SKU001', name: 'normal 1L', price: 100 },
  { id: 'SKU002', name: 'normal 500ml', price: 135 },
  { id: 'SKU003', name: 'normal 2L', price: 150 },
  { id: 'SKU004', name: 'normal 250ml', price: 160 },
  { id: 'SKU005', name: '1L premium', price: 125 },
];

let specialPrices: SpecialPrice[] = [
    // Price for VIP Partners Inc.
    { id: 'SP001', distributorId: 'VIP-7890-24-AB', skuId: 'SKU005', price: 115, startDate: '2024-01-01', endDate: '2024-12-31' },
    // Price for Price Saver Wholesale
    { id: 'SP002', distributorId: 'PRI-5678-24-EF', skuId: 'SKU002', price: 120, startDate: '2024-01-01', endDate: '2024-12-31' },
];

let schemes: Scheme[] = [
  // Global Scheme
  { id: 'SCHEME01', description: 'Global Deal: Buy 10 normal 1L, Get 1 normal 500ml Free!', buySkuId: 'SKU001', buyQuantity: 10, getSkuId: 'SKU002', getQuantity: 1, isGlobal: true },
  // Scheme for VIP Partners Inc.
  { id: 'SCHEME02', description: 'VIP Offer: Buy 5 premium 1L, get 1 premium 1L Free!', buySkuId: 'SKU005', buyQuantity: 5, getSkuId: 'SKU005', getQuantity: 1, isGlobal: false, distributorId: 'VIP-7890-24-AB' },
  // Scheme for Scheme Queen Supplies
  { id: 'SCHEME03', description: 'Super Saver: Buy 20 normal 2L, get 3 normal 250ml Free!', buySkuId: 'SKU003', buyQuantity: 20, getSkuId: 'SKU004', getQuantity: 3, isGlobal: false, distributorId: 'SCH-1234-24-CD' },
];

// --- EXPANDED DUMMY DATA FOR ORDERS AND TRANSACTIONS ---

let walletTransactions: WalletTransaction[] = [
    // Initial Recharges
    { id: 'TRN001', distributorId: 'VIP-7890-24-AB', amount: 25000, type: TransactionType.RECHARGE, date: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(), addedBy: 'superadmin' },
    { id: 'TRN002', distributorId: 'SCH-1234-24-CD', amount: 16000, type: TransactionType.RECHARGE, date: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(), addedBy: 'superadmin' },
    { id: 'TRN003', distributorId: 'PRI-5678-24-EF', amount: 30000, type: TransactionType.RECHARGE, date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), addedBy: 'superadmin' },
    { id: 'TRN004', distributorId: 'STA-9012-24-GH', amount: 7000, type: TransactionType.RECHARGE, date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), addedBy: 'superadmin' },

    // Order Debits (linked to orders below)
    { id: 'TRN-ORD01', distributorId: 'VIP-7890-24-AB', amount: -690, type: TransactionType.ORDER_DEBIT, date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), addedBy: 'executive' },
    { id: 'TRN-ORD02', distributorId: 'SCH-1234-24-CD', amount: -2600, creditAmount: -400, type: TransactionType.ORDER_DEBIT, date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(), addedBy: 'executive' },
    { id: 'TRN-ORD03', distributorId: 'STA-9012-24-GH', amount: -1200, creditAmount: -600, type: TransactionType.ORDER_DEBIT, date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), addedBy: 'executive' },
    { id: 'TRN-ORD04', distributorId: 'PRI-5678-24-EF', amount: -1800, type: TransactionType.ORDER_DEBIT, date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), addedBy: 'executive' },
];

let orders: Order[] = [
    { id: 'ORD01', distributorId: 'VIP-7890-24-AB', totalAmount: 690, coveredByWallet: 690, coveredByCredit: 0, date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), placedByExecId: 'executive' },
    { id: 'ORD02', distributorId: 'SCH-1234-24-CD', totalAmount: 3000, coveredByWallet: 2600, coveredByCredit: 400, date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(), placedByExecId: 'executive' },
    { id: 'ORD03', distributorId: 'STA-9012-24-GH', totalAmount: 1800, coveredByWallet: 1200, coveredByCredit: 600, date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), placedByExecId: 'executive' },
    { id: 'ORD04', distributorId: 'PRI-5678-24-EF', totalAmount: 1800, coveredByWallet: 1800, coveredByCredit: 0, date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), placedByExecId: 'executive' },
];

let orderItems: OrderItem[] = [
    // Items for ORD01 (VIP Partners - triggers special price and scheme)
    { orderId: 'ORD01', skuId: 'SKU005', quantity: 6, freeQuantity: 0, unitPrice: 115, isFreebie: false },
    { orderId: 'ORD01', skuId: 'SKU005', quantity: 1, freeQuantity: 0, unitPrice: 0, isFreebie: true },

    // Items for ORD02 (Scheme Queen - triggers special scheme)
    { orderId: 'ORD02', skuId: 'SKU003', quantity: 20, freeQuantity: 0, unitPrice: 150, isFreebie: false },
    { orderId: 'ORD02', skuId: 'SKU004', quantity: 3, freeQuantity: 0, unitPrice: 0, isFreebie: true },

    // Items for ORD03 (Standard Provisions - triggers global scheme)
    { orderId: 'ORD03', skuId: 'SKU001', quantity: 18, freeQuantity: 0, unitPrice: 100, isFreebie: false },
    { orderId: 'ORD03', skuId: 'SKU002', quantity: 1, freeQuantity: 0, unitPrice: 0, isFreebie: true },

    // Items for ORD04 (Price Saver - triggers special price)
    { orderId: 'ORD04', skuId: 'SKU002', quantity: 15, freeQuantity: 0, unitPrice: 120, isFreebie: false },
];

let notifications: Notification[] = [
    { id: 'NOTIF001', type: NotificationType.ORDER_PLACED, message: 'New order ORD04 placed for Price Saver Wholesale.', distributorId: 'PRI-5678-24-EF', isRead: false, date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()},
    { id: 'NOTIF002', type: NotificationType.DISTRIBUTOR_ADDED, message: 'New distributor "Standard Provisions" has been onboarded.', distributorId: 'STA-9012-24-GH', isRead: true, date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()},
    { id: 'NOTIF003', type: NotificationType.NEW_SCHEME, message: 'New global scheme available: Buy 10 normal 1L, get 1 normal 500ml free.', isRead: false, date: new Date(Date.now() - 60 * 60 * 1000).toISOString() },
    { id: 'NOTIF004', type: NotificationType.CREDIT_LIMIT_HIGH, message: 'Standard Provisions has used 90% of their credit limit.', distributorId: 'STA-9012-24-GH', isRead: false, date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()},
];


// --- UTILITY FUNCTIONS ---
const simulateDelay = <T,>(data: T, delay = 500): Promise<T> => new Promise(resolve => setTimeout(() => resolve(data), delay));

const generateId = (prefix: string) => `${prefix}${Date.now()}${Math.random().toString(16).slice(2, 6)}`;

const generateDistributorId = (name: string, phone: string): string => {
    const namePart = name.substring(0, 3).toUpperCase();
    const phonePart = phone.slice(-4);
    const yearPart = new Date().getFullYear().toString().slice(-2);
    const randomPart = Math.random().toString(36).substring(2, 4).toUpperCase();
    return `${namePart}-${phonePart}-${yearPart}-${randomPart}`;
}

const checkCreditLimitAndNotify = (distributorId: string) => {
    const distributor = distributors.find(d => d.id === distributorId);
    if (!distributor || distributor.creditLimit === 0) return;

    const usagePercent = (distributor.creditUsed / distributor.creditLimit);
    const THRESHOLD = 0.8;

    const existingNotification = notifications.find(n => 
        n.distributorId === distributorId && 
        n.type === NotificationType.CREDIT_LIMIT_HIGH && 
        !n.isRead
    );

    if (usagePercent >= THRESHOLD && !existingNotification) {
        const newNotification: Notification = {
            id: generateId('NOTIF'),
            type: NotificationType.CREDIT_LIMIT_HIGH,
            message: `${distributor.name} has used ${(usagePercent * 100).toFixed(0)}% of their credit limit.`,
            distributorId: distributor.id,
            isRead: false,
            date: new Date().toISOString(),
        };
        notifications.unshift(newNotification);
    }
};

// --- API FUNCTIONS ---

export const api = {
  // User Management
  loginUser: async (username: string, password: string): Promise<User | null> => {
    const user = users.find(u => u.username === username && u.password === password);
    return simulateDelay(user || null);
  },
  getUsers: async (): Promise<User[]> => simulateDelay([...users]),
  addUser: async (userData: Omit<User, 'id'>, actorRole: UserRole): Promise<User> => {
    if (actorRole !== UserRole.SUPER_ADMIN) throw new Error("Permission denied");
    if (users.some(u => u.username === userData.username)) throw new Error("Username already exists");
    const newUser: User = { ...userData, id: generateId('USER') };
    users.push(newUser);
    return simulateDelay(newUser);
  },
  updateUser: async (userData: User, actorRole: UserRole): Promise<User> => {
    if (actorRole !== UserRole.SUPER_ADMIN) throw new Error("Permission denied");
    const index = users.findIndex(u => u.id === userData.id);
    if (index === -1) throw new Error("User not found");
    // Preserve password if not provided in update
    const existingPassword = users[index].password;
    users[index] = { ...users[index], ...userData };
    if (!userData.password) {
        users[index].password = existingPassword;
    }
    return simulateDelay(users[index]);
  },
  deleteUser: async (userId: string, actorId: string, actorRole: UserRole): Promise<{ success: true }> => {
    if (actorRole !== UserRole.SUPER_ADMIN) throw new Error("Permission denied");
    if (userId === actorId) throw new Error("Cannot delete your own account");
    const index = users.findIndex(u => u.id === userId);
    if (index === -1) throw new Error("User not found");
    users.splice(index, 1);
    return simulateDelay({ success: true });
  },

  getDistributorById: async (id: string): Promise<Distributor | undefined> => simulateDelay(distributors.find(d => d.id === id)),
  getDistributors: async (): Promise<Distributor[]> => simulateDelay([...distributors]),
  getSKUs: async (): Promise<SKU[]> => simulateDelay([...skus]),
  
  // Scheme Management
  getSchemes: async (): Promise<Scheme[]> => simulateDelay([...schemes]),
  getSchemesByDistributor: async (distributorId: string): Promise<Scheme[]> => {
      const distributorSchemes = schemes.filter(s => s.distributorId === distributorId);
      return simulateDelay(distributorSchemes);
  },
  getGlobalSchemes: async (): Promise<Scheme[]> => simulateDelay(schemes.filter(s => s.isGlobal)),
  addScheme: async (schemeData: Omit<Scheme, 'id'>, actorRole: UserRole): Promise<Scheme> => {
      if (actorRole !== UserRole.SUPER_ADMIN && !schemeData.distributorId) throw new Error("Permission denied to create global schemes");
      const newScheme: Scheme = { ...schemeData, id: generateId('SCHEME')};
      schemes.push(newScheme);
      return simulateDelay(newScheme);
  },
  updateScheme: async (scheme: Scheme, actorRole: UserRole): Promise<Scheme> => {
      if (actorRole !== UserRole.SUPER_ADMIN && !scheme.distributorId) throw new Error("Permission denied");
      const index = schemes.findIndex(s => s.id === scheme.id);
      if (index === -1) throw new Error("Scheme not found");
      schemes[index] = scheme;
      return simulateDelay(scheme);
  },
  deleteScheme: async (schemeId: string, actorRole: UserRole): Promise<{success: true}> => {
      // Allow executives to delete distributor-specific schemes, super-admins to delete any.
      const scheme = schemes.find(s => s.id === schemeId);
      if (!scheme) throw new Error("Scheme not found");
      if(actorRole === UserRole.EXECUTIVE && scheme.isGlobal) throw new Error("Permission denied");

      schemes = schemes.filter(s => s.id !== schemeId);
      return simulateDelay({success: true});
  },

  // Special Price Management
  getSpecialPricesByDistributor: async(distributorId: string): Promise<SpecialPrice[]> => {
    return simulateDelay(specialPrices.filter(sp => sp.distributorId === distributorId));
  },
  addSpecialPrice: async (priceData: Omit<SpecialPrice, 'id'>): Promise<SpecialPrice> => {
    const newPrice: SpecialPrice = { ...priceData, id: generateId('SP')};
    specialPrices.push(newPrice);
    return simulateDelay(newPrice);
  },
  updateSpecialPrice: async (priceData: SpecialPrice): Promise<SpecialPrice> => {
    const index = specialPrices.findIndex(sp => sp.id === priceData.id);
    if (index === -1) throw new Error("Special price not found");
    specialPrices[index] = priceData;
    return simulateDelay(priceData);
  },
  deleteSpecialPrice: async (priceId: string): Promise<{success: true}> => {
    specialPrices = specialPrices.filter(sp => sp.id !== priceId);
    return simulateDelay({success: true});
  },

  getOrders: async (): Promise<Order[]> => simulateDelay([...orders]),
  getOrderItems: async (orderId: string): Promise<EnrichedOrderItem[]> => {
      const items = orderItems.filter(item => item.orderId === orderId);
      const enrichedItems = items.map(item => {
          const sku = skus.find(s => s.id === item.skuId);
          return {
              ...item,
              skuName: sku ? sku.name : 'Unknown SKU',
          };
      });
      return simulateDelay(enrichedItems);
  },
  getWalletTransactions: async(): Promise<WalletTransaction[]> => simulateDelay([...walletTransactions]),
  
  getWalletTransactionsByDistributor: async(distributorId: string): Promise<EnrichedWalletTransaction[]> => {
    const distributor = distributors.find(d => d.id === distributorId);
    if (!distributor) return simulateDelay([]);

    // Get all transactions for the distributor and sort them from oldest to newest
    const distributorTransactions = [...walletTransactions]
        .filter(t => t.distributorId === distributorId)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const enrichedTransactions: EnrichedWalletTransaction[] = [];
    let runningBalance = 0;

    for (const t of distributorTransactions) {
        runningBalance += t.amount;
        enrichedTransactions.push({
            ...t,
            balanceAfter: runningBalance,
        });
    }

    return simulateDelay(enrichedTransactions);
  },

  getOrdersByDistributor: async(distributorId: string): Promise<Order[]> => simulateDelay([...orders].filter(o => o.distributorId === distributorId)),
  getNotifications: async (): Promise<Notification[]> => simulateDelay([...notifications].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())),
    
  markNotificationAsRead: async (notificationId: string): Promise<Notification> => {
      const notification = notifications.find(n => n.id === notificationId);
      if (!notification) throw new Error("Notification not found");
      notification.isRead = true;
      return simulateDelay({ ...notification });
  },
  
  markAllNotificationsAsRead: async (): Promise<Notification[]> => {
      notifications.forEach(n => n.isRead = true);
      return simulateDelay([...notifications]);
  },

  addDistributor: async (data: Omit<Distributor, 'id' | 'dateAdded' | 'walletBalance' | 'creditUsed' | 'creditLimit'> & { agreementFile: File | null }): Promise<Distributor> => {
    const newId = generateDistributorId(data.name, data.phone);
    // Simulate file upload to Google Drive
    const agreementUrl = data.agreementFile ? `https://fake.drive.google.com/${newId}-${data.agreementFile.name}` : undefined;

    const newDistributor: Distributor = {
      ...data,
      id: newId,
      walletBalance: 0,
      creditUsed: 0,
      creditLimit: DEFAULT_CREDIT_LIMIT,
      agreementUrl,
      dateAdded: new Date().toISOString().split('T')[0],
    };
    distributors.push(newDistributor);
    
    const newNotification: Notification = {
        id: generateId('NOTIF'),
        type: NotificationType.DISTRIBUTOR_ADDED,
        message: `New distributor "${newDistributor.name}" has been onboarded.`,
        distributorId: newDistributor.id,
        isRead: false,
        date: new Date().toISOString(),
    };
    notifications.unshift(newNotification);

    return simulateDelay(newDistributor);
  },
  
  rechargeWallet: async (distributorId: string, amount: number, addedBy: string): Promise<WalletTransaction> => {
    const distributor = distributors.find(d => d.id === distributorId);
    if (!distributor) throw new Error("Distributor not found");

    let rechargeAmount = amount;
    const creditToClear = Math.min(rechargeAmount, distributor.creditUsed);

    if (creditToClear > 0) {
      distributor.creditUsed -= creditToClear;
      rechargeAmount -= creditToClear;
    }
    
    distributor.walletBalance += rechargeAmount;
    
    const newTransaction: WalletTransaction = {
      id: generateId('TRN'),
      distributorId,
      amount,
      type: TransactionType.RECHARGE,
      date: new Date().toISOString(),
      addedBy,
    };
    walletTransactions.push(newTransaction);
    
    checkCreditLimitAndNotify(distributorId);
    
    return simulateDelay(newTransaction);
  },

  placeOrder: async (
    distributorId: string, 
    items: { skuId: string; quantity: number }[],
    placedByExecId: string
  ): Promise<Order> => {
    const distributor = distributors.find(d => d.id === distributorId);
    if (!distributor) throw new Error("Distributor not found");

    const newOrderItems: Omit<OrderItem, 'orderId'>[] = [];
    let totalAmount = 0;
    
    // 1. Get relevant pricing and schemes
    const today = new Date().toISOString().split('T')[0];
    const distributorPrices = specialPrices.filter(sp => 
        sp.distributorId === distributorId && sp.startDate <= today && sp.endDate >= today
    );

    // Check for distributor-specific schemes. If they exist, use them exclusively. Otherwise, use global schemes.
    const distributorSpecificSchemes = schemes.filter(s => s.distributorId === distributorId);
    const applicableSchemes = distributorSpecificSchemes.length > 0 
        ? distributorSpecificSchemes
        : schemes.filter(s => s.isGlobal);

    // 2. Process paid items and calculate cost
    for (const item of items) {
        if (item.quantity <= 0) continue;
        
        const sku = skus.find(s => s.id === item.skuId);
        if(!sku) continue;

        const specialPrice = distributorPrices.find(sp => sp.skuId === item.skuId);
        const unitPrice = specialPrice ? specialPrice.price : sku.price;
        
        totalAmount += item.quantity * unitPrice;

        newOrderItems.push({
            skuId: item.skuId,
            quantity: item.quantity,
            freeQuantity: 0,
            unitPrice: unitPrice,
            isFreebie: false,
        });
    }

    // 3. Process schemes and add free items
    const freebies: Omit<OrderItem, 'orderId'>[] = [];
    for (const scheme of applicableSchemes) {
        const buyItem = newOrderItems.find(oi => oi.skuId === scheme.buySkuId && !oi.isFreebie);
        if (buyItem) {
            const timesSchemeApplied = Math.floor(buyItem.quantity / scheme.buyQuantity);
            if (timesSchemeApplied > 0) {
                const getSku = skus.find(s => s.id === scheme.getSkuId);
                if (getSku) {
                    const totalFreeQuantity = timesSchemeApplied * scheme.getQuantity;
                    const existingFreebie = freebies.find(f => f.skuId === scheme.getSkuId);
                    if (existingFreebie) {
                        existingFreebie.quantity += totalFreeQuantity;
                    } else {
                        freebies.push({
                            skuId: scheme.getSkuId,
                            quantity: totalFreeQuantity,
                            unitPrice: 0,
                            freeQuantity: 0, // This property is legacy, main logic uses isFreebie
                            isFreebie: true,
                        });
                    }
                }
            }
        }
    }
    
    const finalOrderItems = [...newOrderItems, ...freebies];

    const availableCredit = distributor.creditLimit - distributor.creditUsed;
    const totalAvailableFunds = distributor.walletBalance + availableCredit;

    if (totalAmount > totalAvailableFunds) {
        const failNotification: Notification = {
            id: generateId('NOTIF'),
            type: NotificationType.ORDER_FAILED,
            message: `Order for ${distributor.name} failed due to insufficient balance.`,
            distributorId,
            isRead: false,
            date: new Date().toISOString(),
        };
        notifications.unshift(failNotification);
        throw new Error("Insufficient Balance");
    }

    const paidByWallet = Math.min(totalAmount, distributor.walletBalance);
    const paidByCredit = totalAmount - paidByWallet;

    distributor.walletBalance -= paidByWallet;
    distributor.creditUsed += paidByCredit;

    const newOrderId = generateId('ORD');
    const newOrder: Order = {
        id: newOrderId,
        distributorId,
        totalAmount,
        coveredByWallet: paidByWallet,
        coveredByCredit: paidByCredit,
        date: new Date().toISOString(),
        placedByExecId,
    };
    orders.push(newOrder);

    finalOrderItems.forEach(item => orderItems.push({ ...item, orderId: newOrderId }));

    const successNotification: Notification = {
        id: generateId('NOTIF'),
        type: NotificationType.ORDER_PLACED,
        message: `New order ${newOrder.id} placed for ${distributor.name}.`,
        distributorId: newOrder.distributorId,
        isRead: false,
        date: new Date().toISOString(),
    };
    notifications.unshift(successNotification);
    
    if (paidByWallet > 0) {
        const debitTransaction: WalletTransaction = {
            id: generateId('TRN'),
            distributorId,
            amount: -paidByWallet,
            creditAmount: paidByCredit > 0 ? -paidByCredit : undefined,
            type: TransactionType.ORDER_DEBIT,
            date: new Date().toISOString(),
            addedBy: placedByExecId,
        };
        walletTransactions.push(debitTransaction);
    }
    
    checkCreditLimitAndNotify(distributorId);

    return simulateDelay(newOrder);
  },
  
  getInvoiceData: async (orderId: string): Promise<InvoiceData | null> => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return simulateDelay(null);

    const distributor = distributors.find(d => d.id === order.distributorId);
    if (!distributor) return simulateDelay(null);

    // Not using simulateDelay here because getOrderItems already has one
    const items = await api.getOrderItems(orderId); 
    
    return simulateDelay({ order, distributor, items });
  },

  updateSKU: async (sku: SKU, role: UserRole): Promise<SKU> => {
    if (role !== UserRole.SUPER_ADMIN) throw new Error("Permission denied");
    const index = skus.findIndex(s => s.id === sku.id);
    if (index === -1) throw new Error("SKU not found");
    skus[index] = sku;
    return simulateDelay(sku);
  },
  
  addSKU: async (skuData: Omit<SKU, 'id'>, role: UserRole): Promise<SKU> => {
    if (role !== UserRole.SUPER_ADMIN) throw new Error("Permission denied");
    const newSku: SKU = {
        ...skuData,
        id: generateId('SKU'),
    };
    skus.push(newSku);
    return simulateDelay(newSku);
  },

};
