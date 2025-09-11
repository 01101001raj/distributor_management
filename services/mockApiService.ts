import { Distributor, SKU, Scheme, WalletTransaction, TransactionType, Order, OrderItem, UserRole, Notification, NotificationType, EnrichedOrderItem, User, SpecialPrice, InvoiceData, EnrichedWalletTransaction, OrderStatus } from '../types';

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
        hasSpecialPricing: false,
        hasSpecialSchemes: false,
        walletBalance: 22250,
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
        hasSpecialSchemes: false,
        walletBalance: 14650,
        dateAdded: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        addedByExecId: 'executive',
    },
    { 
        id: 'PRI-5678-24-EF',
        name: 'Price Saver Wholesale',
        phone: '9876545678',
        state: 'Tamil Nadu',
        area: 'Chennai',
        hasSpecialPricing: false,
        hasSpecialSchemes: false,
        walletBalance: 27975,
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
        walletBalance: 7000,
        dateAdded: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        addedByExecId: 'executive',
    },
    { 
        id: 'MET-4567-24-IJ',
        name: 'Metro Supplies',
        phone: '9123454567',
        state: 'Telangana',
        area: 'Hyderabad',
        hasSpecialPricing: false,
        hasSpecialSchemes: false,
        walletBalance: 11625,
        dateAdded: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
        addedByExecId: 'executive',
    },
    { 
        id: 'CAP-8901-24-KL',
        name: 'Capital Traders',
        phone: '9234568901',
        state: 'Haryana',
        area: 'Gurugram',
        hasSpecialPricing: false,
        hasSpecialSchemes: false,
        walletBalance: 20000,
        dateAdded: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
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

let specialPrices: SpecialPrice[] = [];

let schemes: Scheme[] = [
  { id: 'SCHEME01', description: 'Global Deal: Buy 10 normal 1L, Get 1 normal 1L Free!', buySkuId: 'SKU001', buyQuantity: 10, getSkuId: 'SKU001', getQuantity: 1, isGlobal: true },
  { id: 'SCHEME02', description: 'Global Deal: Buy 10 normal 500ml, Get 1 normal 500ml Free!', buySkuId: 'SKU002', buyQuantity: 10, getSkuId: 'SKU002', getQuantity: 1, isGlobal: true },
];

let walletTransactions: WalletTransaction[] = [
    // Initial Recharges
    { id: 'TRN001', distributorId: 'VIP-7890-24-AB', amount: 25000, type: TransactionType.RECHARGE, date: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(), addedBy: 'superadmin' },
    { id: 'TRN002', distributorId: 'SCH-1234-24-CD', amount: 16000, type: TransactionType.RECHARGE, date: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(), addedBy: 'superadmin' },
    { id: 'TRN003', distributorId: 'PRI-5678-24-EF', amount: 30000, type: TransactionType.RECHARGE, date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), addedBy: 'superadmin' },
    { id: 'TRN004', distributorId: 'STA-9012-24-GH', amount: 7000, type: TransactionType.RECHARGE, date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), addedBy: 'superadmin' },
    { id: 'TRN005', distributorId: 'MET-4567-24-IJ', amount: 15000, type: TransactionType.RECHARGE, date: new Date(Date.now() - 24 * 24 * 60 * 60 * 1000).toISOString(), addedBy: 'superadmin' },
    { id: 'TRN006', distributorId: 'CAP-8901-24-KL', amount: 20000, type: TransactionType.RECHARGE, date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), addedBy: 'superadmin' },

    // Order Debits (linked to orders below)
    { id: 'TRN-ORD01', orderId: 'ORD01', distributorId: 'VIP-7890-24-AB', amount: -750, type: TransactionType.ORDER_DEBIT, date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), addedBy: 'executive' },
    { id: 'TRN-ORD04', orderId: 'ORD04', distributorId: 'PRI-5678-24-EF', amount: -2025, type: TransactionType.ORDER_DEBIT, date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), addedBy: 'executive' },
    { id: 'TRN-ORD05', orderId: 'ORD05', distributorId: 'VIP-7890-24-AB', amount: -2000, type: TransactionType.ORDER_DEBIT, date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), addedBy: 'executive' },
    { id: 'TRN-ORD06', orderId: 'ORD06', distributorId: 'SCH-1234-24-CD', amount: -1350, type: TransactionType.ORDER_DEBIT, date: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(), addedBy: 'executive' },
    { id: 'TRN-ORD08', orderId: 'ORD08', distributorId: 'MET-4567-24-IJ', amount: -3375, type: TransactionType.ORDER_DEBIT, date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), addedBy: 'executive' },
];

let orders: Order[] = [
    { id: 'ORD01', distributorId: 'VIP-7890-24-AB', totalAmount: 750, coveredByWallet: 750, date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), placedByExecId: 'executive', status: OrderStatus.DELIVERED },
    { id: 'ORD02', distributorId: 'SCH-1234-24-CD', totalAmount: 3000, coveredByWallet: 3000, date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(), placedByExecId: 'executive', status: OrderStatus.PENDING },
    { id: 'ORD03', distributorId: 'STA-9012-24-GH', totalAmount: 1800, coveredByWallet: 1800, date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), placedByExecId: 'executive', status: OrderStatus.PENDING },
    { id: 'ORD04', distributorId: 'PRI-5678-24-EF', totalAmount: 2025, coveredByWallet: 2025, date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), placedByExecId: 'executive', status: OrderStatus.DELIVERED },
    { id: 'ORD05', distributorId: 'VIP-7890-24-AB', totalAmount: 2000, coveredByWallet: 2000, date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), placedByExecId: 'executive', status: OrderStatus.DELIVERED },
    { id: 'ORD06', distributorId: 'SCH-1234-24-CD', totalAmount: 1350, coveredByWallet: 1350, date: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(), placedByExecId: 'executive', status: OrderStatus.DELIVERED },
    { id: 'ORD07', distributorId: 'CAP-8901-24-KL', totalAmount: 2500, coveredByWallet: 2500, date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), placedByExecId: 'executive', status: OrderStatus.PENDING },
    { id: 'ORD08', distributorId: 'MET-4567-24-IJ', totalAmount: 3375, coveredByWallet: 3375, date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), placedByExecId: 'executive', status: OrderStatus.DELIVERED },
    { id: 'ORD09', distributorId: 'SCH-1234-24-CD', totalAmount: 1550, coveredByWallet: 1550, date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), placedByExecId: 'executive', status: OrderStatus.PENDING },
];

let orderItems: OrderItem[] = [
    // ORD01 (VIP) - 6x premium 1L @ 125. Total 750.
    { orderId: 'ORD01', skuId: 'SKU005', quantity: 6, freeQuantity: 0, unitPrice: 125, isFreebie: false },
    // ORD02 (SchQ) - 20x normal 2L @ 150. Total 3000. (Pending). OK.
    { orderId: 'ORD02', skuId: 'SKU003', quantity: 20, freeQuantity: 0, unitPrice: 150, isFreebie: false },
    // ORD03 (Std) - 18x normal 1L @ 100. Total 1800. (Pending). Triggers scheme: 1 free 1L.
    { orderId: 'ORD03', skuId: 'SKU001', quantity: 18, freeQuantity: 0, unitPrice: 100, isFreebie: false },
    { orderId: 'ORD03', skuId: 'SKU001', quantity: 1, freeQuantity: 0, unitPrice: 0, isFreebie: true },
    // ORD04 (Price) - 15x 500ml @ 135. Total 2025. Triggers scheme.
    { orderId: 'ORD04', skuId: 'SKU002', quantity: 15, freeQuantity: 0, unitPrice: 135, isFreebie: false },
    { orderId: 'ORD04', skuId: 'SKU002', quantity: 1, freeQuantity: 0, unitPrice: 0, isFreebie: true },
    // ORD05 (VIP) - 20x 1L normal @ 100. Total 2000. Triggers scheme (2 free 1L).
    { orderId: 'ORD05', skuId: 'SKU001', quantity: 20, freeQuantity: 0, unitPrice: 100, isFreebie: false },
    { orderId: 'ORD05', skuId: 'SKU001', quantity: 2, freeQuantity: 0, unitPrice: 0, isFreebie: true },
    // ORD06 (SchQ) - 10x 500ml @ 135. Total 1350. Triggers scheme (1 free 500ml).
    { orderId: 'ORD06', skuId: 'SKU002', quantity: 10, freeQuantity: 0, unitPrice: 135, isFreebie: false },
    { orderId: 'ORD06', skuId: 'SKU002', quantity: 1, freeQuantity: 0, unitPrice: 0, isFreebie: true },
    // ORD07 (Capital) - 20x 1L premium @ 125. Total 2500. (Pending).
    { orderId: 'ORD07', skuId: 'SKU005', quantity: 20, freeQuantity: 0, unitPrice: 125, isFreebie: false },
    // ORD08 (Metro) - 25x 500ml @ 135. Total 3375. Triggers scheme (2 free 500ml).
    { orderId: 'ORD08', skuId: 'SKU002', quantity: 25, freeQuantity: 0, unitPrice: 135, isFreebie: false },
    { orderId: 'ORD08', skuId: 'SKU002', quantity: 2, freeQuantity: 0, unitPrice: 0, isFreebie: true },
    // ORD09 (SchQ) - 5x 2L @ 150 (750), 5x 250ml @ 160 (800). Total 1550. (Pending)
    { orderId: 'ORD09', skuId: 'SKU003', quantity: 5, freeQuantity: 0, unitPrice: 150, isFreebie: false },
    { orderId: 'ORD09', skuId: 'SKU004', quantity: 5, freeQuantity: 0, unitPrice: 160, isFreebie: false },
];

let notifications: Notification[] = [
    { id: 'NOTIF001', type: NotificationType.ORDER_PLACED, message: 'New order ORD09 placed for Scheme Queen Supplies.', distributorId: 'SCH-1234-24-CD', isRead: false, date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()},
    { id: 'NOTIF002', type: NotificationType.DISTRIBUTOR_ADDED, message: 'New distributor "Capital Traders" has been onboarded.', distributorId: 'CAP-8901-24-KL', isRead: true, date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()},
    { id: 'NOTIF003', type: NotificationType.ORDER_PLACED, message: 'New order ORD08 placed for Metro Supplies.', distributorId: 'MET-4567-24-IJ', isRead: true, date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()},
    { id: 'NOTIF004', type: NotificationType.NEW_SCHEME, message: 'New global scheme available: Buy 10 normal 1L, get 1 normal 1L free.', isRead: false, date: new Date(Date.now() - 60 * 60 * 1000).toISOString() },
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

const calculateOrderTotal = (
    items: { skuId: string; quantity: number }[],
    distributorId: string
): { finalOrderItems: Omit<OrderItem, 'orderId'>[], totalAmount: number } => {
    
    const newOrderItems: Omit<OrderItem, 'orderId'>[] = [];
    let totalAmount = 0;

    const today = new Date().toISOString().split('T')[0];
    const distributorPrices = specialPrices.filter(sp =>
        sp.distributorId === distributorId && sp.startDate <= today && sp.endDate >= today
    );

    const distributorSpecificSchemes = schemes.filter(s => s.distributorId === distributorId);
    const applicableSchemes = distributorSpecificSchemes.length > 0
        ? distributorSpecificSchemes
        : schemes.filter(s => s.isGlobal);

    for (const item of items) {
        if (item.quantity <= 0) continue;
        const sku = skus.find(s => s.id === item.skuId);
        if (!sku) continue;
        const specialPrice = distributorPrices.find(sp => sp.skuId === item.skuId);
        const unitPrice = specialPrice ? specialPrice.price : sku.price;
        totalAmount += item.quantity * unitPrice;
        newOrderItems.push({ skuId: item.skuId, quantity: item.quantity, freeQuantity: 0, unitPrice: unitPrice, isFreebie: false });
    }

    const freebies = new Map<string, { quantity: number; source: string }>();

    const schemesByBuySku = applicableSchemes.reduce((acc, scheme) => {
        if (!acc[scheme.buySkuId]) acc[scheme.buySkuId] = [];
        acc[scheme.buySkuId].push(scheme);
        return acc;
    }, {} as Record<string, Scheme[]>);

    for (const skuId in schemesByBuySku) {
        schemesByBuySku[skuId].sort((a, b) => b.buyQuantity - a.buyQuantity);
    }

    const purchasedQuantities = new Map<string, number>();
    items.forEach(item => {
        if (item.quantity > 0) {
            purchasedQuantities.set(item.skuId, (purchasedQuantities.get(item.skuId) || 0) + item.quantity);
        }
    });

    purchasedQuantities.forEach((quantity, skuId) => {
        const relevantSchemes = schemesByBuySku[skuId];
        if (relevantSchemes) {
            let remainingQuantity = quantity;
            relevantSchemes.forEach(scheme => {
                if (remainingQuantity >= scheme.buyQuantity) {
                    const timesApplied = Math.floor(remainingQuantity / scheme.buyQuantity);
                    const totalFree = timesApplied * scheme.getQuantity;
                    
                    const existing = freebies.get(scheme.getSkuId) || { quantity: 0, source: scheme.description };
                    freebies.set(scheme.getSkuId, { quantity: existing.quantity + totalFree, source: scheme.description });
                    
                    remainingQuantity %= scheme.buyQuantity;
                }
            });
        }
    });
    
    const freebieItems: Omit<OrderItem, 'orderId'>[] = [];
    freebies.forEach((data, freeSkuId) => {
        freebieItems.push({ skuId: freeSkuId, quantity: data.quantity, unitPrice: 0, freeQuantity: 0, isFreebie: true });
    });
    
    const finalOrderItems = [...newOrderItems, ...freebieItems];
    return { finalOrderItems, totalAmount };
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
  getAllOrderItems: async (): Promise<OrderItem[]> => simulateDelay([...orderItems]),
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

    let runningBalance = 0;
    // Find the initial balance by summing up all transactions *before* the first one in the sorted list (edge case, usually 0)
    // This isn't perfect for a real system, but for mock data it works by re-calculating from zero.
    
    // We can find total balance by looking at the distributor object, and work backwards. Or simpler, just calculate forwards.
    const enrichedTransactions: EnrichedWalletTransaction[] = [];
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

  addDistributor: async (data: Omit<Distributor, 'id' | 'dateAdded' | 'walletBalance'> & { agreementFile: File | null }): Promise<Distributor> => {
    const newId = generateDistributorId(data.name, data.phone);
    // Simulate file upload to Google Drive
    const agreementUrl = data.agreementFile ? `https://fake.drive.google.com/${newId}-${data.agreementFile.name}` : undefined;

    const newDistributor: Distributor = {
      ...data,
      id: newId,
      walletBalance: 0,
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
    
    distributor.walletBalance += amount;
    
    const newTransaction: WalletTransaction = {
      id: generateId('TRN'),
      distributorId,
      amount,
      type: TransactionType.RECHARGE,
      date: new Date().toISOString(),
      addedBy,
    };
    walletTransactions.push(newTransaction);
    
    return simulateDelay(newTransaction);
  },

  placeOrder: async (
    distributorId: string, 
    items: { skuId: string; quantity: number }[],
    placedByExecId: string
  ): Promise<Order> => {
    const distributor = distributors.find(d => d.id === distributorId);
    if (!distributor) throw new Error("Distributor not found");

    const { finalOrderItems, totalAmount } = calculateOrderTotal(items, distributorId);

    // Only check for balance, do not debit yet.
    if (totalAmount > distributor.walletBalance) {
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

    const newOrderId = generateId('ORD');
    const newOrder: Order = {
        id: newOrderId,
        distributorId,
        totalAmount,
        coveredByWallet: totalAmount, // This will be used upon delivery
        date: new Date().toISOString(),
        placedByExecId,
        status: OrderStatus.PENDING,
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

    return simulateDelay(newOrder);
  },
  
  updateOrderStatus: async (orderId: string, status: OrderStatus, actorId: string): Promise<Order> => {
    const orderIndex = orders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) throw new Error("Order not found");

    const orderToUpdate = { ...orders[orderIndex] };
    
    // Prevent re-processing a delivered order
    if (orderToUpdate.status === OrderStatus.DELIVERED && status === OrderStatus.DELIVERED) {
        return simulateDelay(orderToUpdate);
    }
    
    orderToUpdate.status = status;
    
    if (status === OrderStatus.DELIVERED) {
        const distributor = distributors.find(d => d.id === orderToUpdate.distributorId);
        if (!distributor) throw new Error("Distributor for this order not found during status update.");

        // Check balance at the time of delivery
        if (orderToUpdate.totalAmount > distributor.walletBalance) {
            throw new Error(`Delivery failed: insufficient funds. Distributor has ₹${distributor.walletBalance.toLocaleString()} but order costs ₹${orderToUpdate.totalAmount.toLocaleString()}.`);
        }

        // Deduct from wallet and create transaction now
        distributor.walletBalance -= orderToUpdate.totalAmount;

        const debitTransaction: WalletTransaction = {
            id: generateId('TRN'),
            orderId,
            distributorId: orderToUpdate.distributorId,
            amount: -orderToUpdate.totalAmount, // Negative amount
            type: TransactionType.ORDER_DEBIT,
            date: new Date().toISOString(),
            addedBy: actorId,
        };
        walletTransactions.push(debitTransaction);
    }
    
    orders[orderIndex] = orderToUpdate;

    return simulateDelay(orderToUpdate);
  },
  
  updateOrderItems: async (
    orderId: string,
    newItems: { skuId: string; quantity: number }[],
    actorId: string
  ): Promise<Order> => {
    const order = orders.find(o => o.id === orderId);
    if (!order) throw new Error("Order not found");
    if (order.status === OrderStatus.DELIVERED) throw new Error("Cannot edit a delivered order");

    const distributor = distributors.find(d => d.id === order.distributorId);
    if (!distributor) throw new Error("Distributor not found for this order");
    
    const { finalOrderItems: newFinalOrderItems, totalAmount: newTotalAmount } = calculateOrderTotal(newItems, distributor.id);

    const delta = newTotalAmount - order.totalAmount;
    
    // If cost increased, check if distributor can afford it from their current balance
    if (delta > 0) {
        if (delta > distributor.walletBalance) {
            throw new Error(`Insufficient funds to cover price increase of ₹${delta.toLocaleString()}.`);
        }
    }

    // No wallet transactions or balance changes for pending orders.
    // Just update the order details.
    order.totalAmount = newTotalAmount;
    order.coveredByWallet = newTotalAmount;

    // Replace order items
    orderItems = orderItems.filter(oi => oi.orderId !== orderId);
    newFinalOrderItems.forEach(item => orderItems.push({ ...item, orderId: orderId }));
    
    return simulateDelay(order);
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