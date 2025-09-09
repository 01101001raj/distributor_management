import { Distributor, SKU, Scheme, WalletTransaction, TransactionType, Order, OrderItem, UserRole, Notification, NotificationType, EnrichedOrderItem, User, SpecialPrice, InvoiceData } from '../types';
import { DEFAULT_CREDIT_LIMIT } from '../config';

// --- MOCK DATABASE (Simulating Google Sheets) ---
let users: User[] = [
  { id: 'USER01', username: 'superadmin', password: 'password', role: UserRole.SUPER_ADMIN },
  { id: 'USER02', username: 'executive', password: 'password', role: UserRole.EXECUTIVE },
  { id: 'USER03', username: 'user', password: 'password', role: UserRole.USER },
];

let distributors: Distributor[] = [
  { id: 'SHA-1234-24-AB', name: 'Shankar Traders', phone: '9876541234', state: 'Maharashtra', area: 'Mumbai', creditLimit: 50000, creditUsed: 45000, walletBalance: 15000, dateAdded: '2024-01-10', addedByExecId: 'EXEC01', hasSpecialPricing: false, hasSpecialSchemes: true },
  { id: 'GUP-5678-24-CD', name: 'Gupta Enterprises', phone: '9876545678', state: 'Delhi', area: 'Chandni Chowk', creditLimit: 100000, creditUsed: 0, walletBalance: 25000, dateAdded: '2024-02-15', addedByExecId: 'EXEC01', hasSpecialPricing: false, hasSpecialSchemes: false },
  { id: 'VER-9012-24-EF', name: 'Verma Distribution', phone: '9876549012', state: 'Uttar Pradesh', area: 'Lucknow', creditLimit: 75000, creditUsed: 75000, walletBalance: 5000, dateAdded: '2024-03-20', addedByExecId: 'EXEC02', hasSpecialPricing: true, hasSpecialSchemes: false },
];

let skus: SKU[] = [
  { id: 'SKU001', name: 'Classic Biscuits', price: 10 },
  { id: 'SKU002', name: 'Cream Wafers', price: 20 },
  { id: 'SKU003', name: 'Salted Crackers', price: 15 },
  { id: 'SKU004', name: 'Chocolate Cookies', price: 25 },
];

let specialPrices: SpecialPrice[] = [
    { id: 'SP001', distributorId: 'VER-9012-24-EF', skuId: 'SKU004', price: 22, startDate: '2024-01-01', endDate: '2024-12-31' },
];

let schemes: Scheme[] = [
  // Global Scheme
  { id: 'SCHEME01', description: 'Global Deal: Buy 10 Classic Biscuits, Get 1 Free!', buySkuId: 'SKU001', buyQuantity: 10, getSkuId: 'SKU001', getQuantity: 1, isGlobal: true },
  // Distributor-specific scheme
  { id: 'SCHEME02', description: 'Shankar Exclusive: Buy 5 Cream Wafers, get 1 Salted Cracker free', buySkuId: 'SKU002', buyQuantity: 5, getSkuId: 'SKU003', getQuantity: 1, isGlobal: false, distributorId: 'SHA-1234-24-AB' },
];

let walletTransactions: WalletTransaction[] = [];
let orders: Order[] = [];
let orderItems: OrderItem[] = [];

let notifications: Notification[] = [
    { id: 'NOTIF006', type: NotificationType.CREDIT_LIMIT_HIGH, message: 'Verma Distribution has used 100% of their credit limit.', distributorId: 'VER-9012-24-EF', isRead: false, date: new Date(Date.now() - 3 * 60 * 1000).toISOString() },
    { id: 'NOTIF000', type: NotificationType.CREDIT_LIMIT_HIGH, message: 'Shankar Traders has used 90% of their credit limit.', distributorId: 'SHA-1234-24-AB', isRead: false, date: new Date(Date.now() - 1 * 60 * 1000).toISOString() },
    { id: 'NOTIF001', type: NotificationType.WALLET_LOW, message: 'Wallet balance for Shankar Traders is low.', distributorId: 'SHA-1234-24-AB', isRead: false, date: new Date(Date.now() - 2 * 60 * 1000).toISOString() },
    { id: 'NOTIF002', type: NotificationType.ORDER_PLACED, message: 'New order placed for Gupta Enterprises.', distributorId: 'GUP-5678-24-CD', isRead: false, date: new Date(Date.now() - 10 * 60 * 1000).toISOString() },
    { id: 'NOTIF003', type: NotificationType.NEW_SCHEME, message: 'New scheme available: Buy 10 Get 1 Free on Classic Biscuits.', isRead: false, date: new Date(Date.now() - 60 * 60 * 1000).toISOString() },
    { id: 'NOTIF004', type: NotificationType.DISTRIBUTOR_ADDED, message: 'New distributor "Ramesh & Sons" has been onboarded.', isRead: true, date: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() },
    { id: 'NOTIF005', type: NotificationType.ORDER_FAILED, message: 'Order for Verma Distribution failed due to insufficient credit.', distributorId: 'VER-9012-24-EF', isRead: true, date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
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
      if (actorRole !== UserRole.SUPER_ADMIN) throw new Error("Permission denied");
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
  getWalletTransactionsByDistributor: async(distributorId: string): Promise<WalletTransaction[]> => simulateDelay([...walletTransactions].filter(t => t.distributorId === distributorId)),
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
    const applicableSchemes = schemes.filter(s => s.isGlobal || s.distributorId === distributorId);

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
                    const existingFreebie = freebies.find(f => f.skuId === scheme.getSkuId);
                    if (existingFreebie) {
                        existingFreebie.quantity += timesSchemeApplied * scheme.getQuantity;
                    } else {
                        freebies.push({
                            skuId: scheme.getSkuId,
                            quantity: timesSchemeApplied * scheme.getQuantity,
                            unitPrice: 0,
                            freeQuantity: 0,
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