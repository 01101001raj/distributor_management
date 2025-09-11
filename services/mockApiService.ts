// FIX: Replaced placeholder content with a full mock API service implementation.
import {
  User, UserRole, Distributor, SKU, SpecialPrice, Scheme,
  WalletTransaction, TransactionType, Order, OrderItem, Notification,
  NotificationType, EnrichedOrderItem, InvoiceData, OrderStatus,
  EnrichedWalletTransaction,
} from '../types';

// --- UTILS ---
const MOCK_API_LATENCY = 100; // ms

const simulateNetwork = <T>(data: T): Promise<T> => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(JSON.parse(JSON.stringify(data))); // Deep copy to simulate immutability
    }, MOCK_API_LATENCY);
  });
};

const generateId = (prefix: string = '') => `${prefix}${Date.now()}${Math.random().toString(36).substring(2, 8)}`;

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomDate = (start: Date, end: Date) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
const randomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];


// --- DATA GENERATION CONFIG ---
const INITIAL_USERS: User[] = [
    { id: 'user-1', username: 'admin', password: 'password', role: UserRole.SUPER_ADMIN },
    { id: 'user-2', username: 'exec', password: 'password', role: UserRole.EXECUTIVE },
    { id: 'user-3', username: 'user', password: 'password', role: UserRole.USER },
];

const INITIAL_SKUS: SKU[] = [
    { id: 'sku-1', name: 'Normal 2L', price: 90, hsnCode: '2201' },
    { id: 'sku-2', name: 'Normal 1L', price: 50, hsnCode: '2201' },
    { id: 'sku-3', name: 'Normal 500ml', price: 25, hsnCode: '2201' },
    { id: 'sku-4', name: 'Normal 250ml', price: 15, hsnCode: '2201' },
    { id: 'sku-5', name: 'Premium 1L', price: 80, hsnCode: '2202' },
];

const getFutureDate = (days: number) => new Date(Date.now() + days * 86400000).toISOString().split('T')[0];
const getPastDate = (days: number) => new Date(Date.now() - days * 86400000).toISOString().split('T')[0];

const INITIAL_SCHEMES: Scheme[] = [
    {
        id: 'scheme-1', description: 'Monsoon Bonanza (Global)', buySkuId: 'sku-1', buyQuantity: 10,
        getSkuId: 'sku-2', getQuantity: 1, isGlobal: true,
        startDate: getPastDate(90), endDate: getFutureDate(30),
    },
    {
        id: 'scheme-2', description: 'Premium Offer (Global)', buySkuId: 'sku-5', buyQuantity: 5,
        getSkuId: 'sku-5', getQuantity: 1, isGlobal: true,
        startDate: getPastDate(60), endDate: getFutureDate(60),
    },
];

// --- MOCK DATA GENERATOR ---
class MockDataGenerator {
    distributors: Distributor[] = [];
    specialPrices: SpecialPrice[] = [];
    orders: Order[] = [];
    orderItems: OrderItem[] = [];
    walletTransactions: WalletTransaction[] = [];
    
    firmNamePrefixes = ['Reliable', 'Sunrise', 'Deccan', 'National', 'Pioneer', 'United', 'Global', 'Prime', 'Apex', 'Premier', 'Citywide'];
    firmNameSuffixes = ['Distributors', 'Traders', 'Enterprises', 'Supplies', 'Wholesale', 'Ventures', 'Group'];
    locations = {
        'Maharashtra': ['Pune', 'Mumbai', 'Nagpur', 'Nashik'],
        'Karnataka': ['Bangalore', 'Mysore', 'Mangalore', 'Hubli'],
        'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot'],
        'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai'],
        'Delhi': ['North Delhi', 'South Delhi', 'East Delhi'],
    };

    constructor() {
        this.generateData();
    }
    
    generateData() {
        const states = Object.keys(this.locations);
        
        // 1. Generate Distributors
        for (let i = 0; i < 35; i++) {
            const state = randomElement(states);
            const area = randomElement(this.locations[state as keyof typeof this.locations]);
            const name = `${randomElement(this.firmNamePrefixes)} ${randomElement(this.firmNameSuffixes)}`;
            
            const hasSpecialPricing = Math.random() < 0.2; // 20% chance
            const hasSpecialSchemes = Math.random() < 0.15; // 15% chance
            
            const dist: Distributor = {
                id: `dist-${i + 1}`,
                name: `${name}, ${area}`,
                phone: `9${randomInt(100000000, 999999999)}`,
                state,
                area,
                hasSpecialPricing,
                hasSpecialSchemes,
                walletBalance: 0, // Will be calculated later
                dateAdded: randomDate(new Date(Date.now() - 365 * 86400000), new Date()).toISOString(),
                addedByExecId: randomElement(['exec', 'admin']),
            };
            this.distributors.push(dist);

            if (hasSpecialPricing) {
                const skuToDiscount = randomElement(INITIAL_SKUS);
                this.specialPrices.push({
                    id: `sp-${i + 1}`,
                    distributorId: dist.id,
                    skuId: skuToDiscount.id,
                    price: Math.round(skuToDiscount.price * 0.95), // 5% discount
                    startDate: getPastDate(30),
                    endDate: getFutureDate(30)
                });
            }
        }
        
        const SIX_MONTHS_AGO = new Date();
        SIX_MONTHS_AGO.setMonth(SIX_MONTHS_AGO.getMonth() - 6);
        const NOW = new Date();
        
        // 2. Generate Orders, Items, and Transactions
        this.distributors.forEach(dist => {
            // Initial wallet recharge
            this.walletTransactions.push({
                id: generateId('txn-'), distributorId: dist.id, amount: randomInt(50000, 200000), type: TransactionType.RECHARGE,
                date: new Date(new Date(dist.dateAdded).getTime() + 86400000).toISOString(), addedBy: 'admin'
            });

            const numOrders = randomInt(5, 25);
            for (let i = 0; i < numOrders; i++) {
                const orderDate = randomDate(SIX_MONTHS_AGO, NOW);
                
                // Add intermittent recharges
                if (i > 0 && i % 5 === 0) {
                     this.walletTransactions.push({
                        id: generateId('txn-'), distributorId: dist.id, amount: randomInt(20000, 100000), type: TransactionType.RECHARGE,
                        date: orderDate.toISOString(), addedBy: 'exec'
                    });
                }
                
                const order: Order = {
                    id: generateId(`ord-${dist.id.split('-')[1]}-`),
                    distributorId: dist.id,
                    totalAmount: 0, // Calculate later
                    coveredByWallet: 0,
                    date: orderDate.toISOString(),
                    placedByExecId: 'exec',
                    status: Math.random() < 0.9 ? OrderStatus.DELIVERED : OrderStatus.PENDING,
                };

                const numItems = randomInt(2, 5);
                let subtotal = 0;
                const paidItems: { skuId: string, quantity: number }[] = [];
                
                for (let j = 0; j < numItems; j++) {
                    const sku = randomElement(INITIAL_SKUS);
                    const quantity = randomInt(5, 50);
                    const specialPrice = this.specialPrices.find(p => p.distributorId === dist.id && p.skuId === sku.id);
                    const unitPrice = specialPrice ? specialPrice.price : sku.price;
                    subtotal += quantity * unitPrice;
                    
                    this.orderItems.push({ orderId: order.id, skuId: sku.id, quantity, freeQuantity: 0, unitPrice, isFreebie: false });
                    paidItems.push({ skuId: sku.id, quantity });
                }

                // Apply schemes
                const applicableSchemes = INITIAL_SCHEMES; // For simplicity, only global
                applicableSchemes.forEach(scheme => {
                    const boughtItem = paidItems.find(i => i.skuId === scheme.buySkuId);
                    if (boughtItem && boughtItem.quantity >= scheme.buyQuantity) {
                        const timesApplied = Math.floor(boughtItem.quantity / scheme.buyQuantity);
                        const freeQty = timesApplied * scheme.getQuantity;
                        this.orderItems.push({ orderId: order.id, skuId: scheme.getSkuId, quantity: freeQty, freeQuantity: 0, unitPrice: 0, isFreebie: true });
                    }
                });

                order.totalAmount = subtotal;
                order.coveredByWallet = subtotal;
                this.orders.push(order);
                
                this.walletTransactions.push({
                    id: generateId('txn-'), distributorId: dist.id, amount: -subtotal, type: TransactionType.ORDER_DEBIT,
                    date: order.date, addedBy: 'exec', orderId: order.id
                });
            }
        });
        
        // 3. Final Wallet Calculation
        this.distributors.forEach(dist => {
            const balance = this.walletTransactions
                .filter(t => t.distributorId === dist.id)
                .reduce((sum, tx) => sum + tx.amount, 0);
            
            if (balance < 0) {
                 this.walletTransactions.push({
                    id: generateId('txn-'), distributorId: dist.id, amount: Math.abs(balance) + 5000, type: TransactionType.ORDER_ADJUSTMENT,
                    date: NOW.toISOString(), addedBy: 'System'
                });
                dist.walletBalance = 5000;
            } else {
                dist.walletBalance = balance;
            }
        });
    }
}


// --- DATA STORE ---
class MockDataStore {
  users: User[];
  distributors: Distributor[];
  skus: SKU[];
  specialPrices: SpecialPrice[];
  schemes: Scheme[];
  orders: Order[];
  orderItems: OrderItem[];
  walletTransactions: WalletTransaction[];
  notifications: Notification[];

  constructor() {
    this.users = this.getFromStorage('users', INITIAL_USERS);
    this.skus = this.getFromStorage('skus', INITIAL_SKUS);
    
    if (!localStorage.getItem('mockApi_distributors')) {
        console.log("No mock data found in localStorage. Generating new dataset...");
        const generator = new MockDataGenerator();
        this.distributors = generator.distributors;
        this.specialPrices = generator.specialPrices;
        this.schemes = INITIAL_SCHEMES; // Start with global schemes
        this.orders = generator.orders;
        this.orderItems = generator.orderItems;
        this.walletTransactions = generator.walletTransactions;
        this.notifications = this.generateInitialNotifications(this.distributors);
    } else {
        console.log("Loading mock data from localStorage.");
        this.distributors = this.getFromStorage('distributors', []);
        this.specialPrices = this.getFromStorage('specialPrices', []);
        this.schemes = this.getFromStorage('schemes', INITIAL_SCHEMES);
        this.orders = this.getFromStorage('orders', []);
        this.orderItems = this.getFromStorage('orderItems', []);
        this.walletTransactions = this.getFromStorage('walletTransactions', []);
        this.notifications = this.getFromStorage('notifications', []);
    }
    
    this.saveAll(); // Ensure initial data is saved if local storage is empty
  }
  
  generateInitialNotifications(distributors: Distributor[]): Notification[] {
      const lowBalanceDists = distributors
          .filter(d => d.walletBalance < 15000 && d.walletBalance > 0)
          .slice(0, 3);
      
      return lowBalanceDists.map((d, i) => ({
          id: `notif-${i+1}`,
          type: NotificationType.WALLET_LOW,
          message: `${d.name}'s wallet is low: ₹${d.walletBalance.toLocaleString('en-IN')}`,
          distributorId: d.id,
          isRead: false,
          date: getPastDate(i),
      }));
  }
  
  private getFromStorage<T>(key: string, defaultValue: T): T {
    try {
      const stored = localStorage.getItem(`mockApi_${key}`);
      if (stored) return JSON.parse(stored) as T;
    } catch (e) { console.error(`Failed to load ${key}`, e); }
    return defaultValue;
  }
  
  private saveToStorage<T>(key: string, data: T) {
    localStorage.setItem(`mockApi_${key}`, JSON.stringify(data));
  }
  
  saveAll() {
    this.saveToStorage('users', this.users);
    this.saveToStorage('distributors', this.distributors);
    this.saveToStorage('skus', this.skus);
    this.saveToStorage('specialPrices', this.specialPrices);
    this.saveToStorage('schemes', this.schemes);
    this.saveToStorage('orders', this.orders);
    this.saveToStorage('orderItems', this.orderItems);
    this.saveToStorage('walletTransactions', this.walletTransactions);
    this.saveToStorage('notifications', this.notifications);
  }
}

const store = new MockDataStore();


// --- API SERVICE IMPLEMENTATION ---
class ApiService {
  // --- Auth ---
  async loginUser(username: string, password: string): Promise<User> {
    const user = store.users.find(u => u.username === username && u.password === password);
    if (!user) throw new Error("Invalid username or password");
    return simulateNetwork(user);
  }

  // --- Users ---
  getUsers = () => simulateNetwork(store.users);
  async addUser(user: Omit<User, 'id'>, role: UserRole): Promise<User> {
    if (role !== UserRole.SUPER_ADMIN) throw new Error("Permission denied");
    const newUser = { ...user, id: generateId('user-') };
    store.users.push(newUser);
    store.saveAll();
    return simulateNetwork(newUser);
  }
  async updateUser(user: User, role: UserRole): Promise<User> {
    if (role !== UserRole.SUPER_ADMIN) throw new Error("Permission denied");
    const index = store.users.findIndex(u => u.id === user.id);
    if (index === -1) throw new Error("User not found");
    const existingUser = store.users[index];
    store.users[index] = { ...existingUser, ...user };
    store.saveAll();
    return simulateNetwork(store.users[index]);
  }
  async deleteUser(userId: string, currentUserId: string, role: UserRole): Promise<void> {
    if (role !== UserRole.SUPER_ADMIN) throw new Error("Permission denied");
    if (userId === currentUserId) throw new Error("Cannot delete self");
    store.users = store.users.filter(u => u.id !== userId);
    store.saveAll();
    return simulateNetwork(undefined);
  }

  // --- Distributors ---
  getDistributors = () => simulateNetwork(store.distributors);
  getDistributorById = (id: string) => simulateNetwork(store.distributors.find(d => d.id === id) || null);
  async addDistributor(data: Omit<Distributor, 'id' | 'walletBalance' | 'dateAdded'> & { agreementFile: File | null }): Promise<Distributor> {
    const newDistributor: Distributor = {
        ...data,
        id: generateId('dist-'),
        walletBalance: 0,
        dateAdded: new Date().toISOString(),
        agreementUrl: data.agreementFile ? URL.createObjectURL(data.agreementFile) : undefined,
    };
    store.distributors.push(newDistributor);
    this.addNotification(NotificationType.DISTRIBUTOR_ADDED, `New distributor added: ${newDistributor.name}`);
    store.saveAll();
    return simulateNetwork(newDistributor);
  }
  
  // --- SKUs ---
  getSKUs = () => simulateNetwork(store.skus);
  async addSKU(sku: Omit<SKU, 'id'>, role: UserRole): Promise<SKU> {
    if (role !== UserRole.SUPER_ADMIN) throw new Error("Permission denied");
    const newSku: SKU = { ...sku, id: generateId('sku-') };
    store.skus.push(newSku);
    store.saveAll();
    return simulateNetwork(newSku);
  }
  async updateSKU(sku: SKU, role: UserRole): Promise<SKU> {
    if (role !== UserRole.SUPER_ADMIN) throw new Error("Permission denied");
    const index = store.skus.findIndex(s => s.id === sku.id);
    if (index === -1) throw new Error("SKU not found");
    store.skus[index] = sku;
    store.saveAll();
    return simulateNetwork(sku);
  }

  // --- Schemes ---
  getSchemes = () => simulateNetwork(store.schemes);
  getGlobalSchemes = () => simulateNetwork(store.schemes.filter(s => s.isGlobal));
  getSchemesByDistributor = (distributorId: string) => simulateNetwork(store.schemes.filter(s => s.distributorId === distributorId && !s.isGlobal));
  async addScheme(scheme: Omit<Scheme, 'id'>, role: UserRole): Promise<Scheme> {
      if (role !== UserRole.SUPER_ADMIN) throw new Error("Permission denied");
      const newScheme: Scheme = { ...scheme, id: generateId('scheme-') };
      store.schemes.push(newScheme);
      if(scheme.isGlobal) this.addNotification(NotificationType.NEW_SCHEME, `New global scheme added: ${scheme.description}`);
      store.saveAll();
      return simulateNetwork(newScheme);
  }
  async updateScheme(scheme: Scheme, role: UserRole): Promise<Scheme> {
      if (role !== UserRole.SUPER_ADMIN) throw new Error("Permission denied");
      const index = store.schemes.findIndex(s => s.id === scheme.id);
      if (index === -1) throw new Error("Scheme not found");
      store.schemes[index] = scheme;
      store.saveAll();
      return simulateNetwork(scheme);
  }
  async deleteScheme(schemeId: string, role: UserRole): Promise<void> {
      if (role !== UserRole.SUPER_ADMIN) throw new Error("Permission denied");
      store.schemes = store.schemes.filter(s => s.id !== schemeId);
      store.saveAll();
      return simulateNetwork(undefined);
  }

  // --- Special Prices ---
  getAllSpecialPrices = () => simulateNetwork(store.specialPrices);
  getSpecialPricesByDistributor = (distributorId: string) => simulateNetwork(store.specialPrices.filter(p => p.distributorId === distributorId));
  async addSpecialPrice(price: Omit<SpecialPrice, 'id'>): Promise<SpecialPrice> {
      const newPrice: SpecialPrice = { ...price, id: generateId('sp-') };
      store.specialPrices.push(newPrice);
      store.saveAll();
      return simulateNetwork(newPrice);
  }
  async updateSpecialPrice(price: SpecialPrice): Promise<SpecialPrice> {
      const index = store.specialPrices.findIndex(p => p.id === price.id);
      if (index === -1) throw new Error("Special price not found");
      store.specialPrices[index] = price;
      store.saveAll();
      return simulateNetwork(price);
  }
  async deleteSpecialPrice(priceId: string): Promise<void> {
      store.specialPrices = store.specialPrices.filter(p => p.id !== priceId);
      store.saveAll();
      return simulateNetwork(undefined);
  }

  // --- Wallet ---
  async rechargeWallet(distributorId: string, amount: number, addedBy: string): Promise<void> {
    const distributor = store.distributors.find(d => d.id === distributorId);
    if (!distributor) throw new Error("Distributor not found");
    
    distributor.walletBalance += amount;

    const transaction: WalletTransaction = {
        id: generateId('txn-'), distributorId, amount, type: TransactionType.RECHARGE,
        date: new Date().toISOString(), addedBy,
    };
    store.walletTransactions.push(transaction);

    store.saveAll();
    return simulateNetwork(undefined);
  }
  getWalletTransactionsByDistributor = (distributorId: string): Promise<EnrichedWalletTransaction[]> => {
      let currentBalance = store.distributors.find(d => d.id === distributorId)?.walletBalance || 0;
      const distTxs = store.walletTransactions
          .filter(tx => tx.distributorId === distributorId)
          .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      const enriched = distTxs.map(tx => {
          const balanceAfter = currentBalance;
          currentBalance -= tx.amount;
          return { ...tx, balanceAfter };
      });

      return simulateNetwork(enriched);
  }

  // --- Orders ---
  getOrders = () => simulateNetwork(store.orders);
  getAllOrderItems = () => simulateNetwork(store.orderItems);
  getOrdersByDistributor = (distributorId: string) => simulateNetwork(store.orders.filter(o => o.distributorId === distributorId));
  getOrderItems = (orderId: string): Promise<EnrichedOrderItem[]> => {
    const items = store.orderItems.filter(i => i.orderId === orderId);
    const enriched = items.map(item => {
        const sku = store.skus.find(s => s.id === item.skuId);
        return { 
            ...item, 
            skuName: sku?.name || 'Unknown SKU',
            hsnCode: sku?.hsnCode || 'N/A',
        };
    });
    return simulateNetwork(enriched);
  }
  
  async placeOrder(distributorId: string, items: { skuId: string, quantity: number }[], placedByExecId: string): Promise<Order> {
    const distributor = store.distributors.find(d => d.id === distributorId);
    if (!distributor) throw new Error("Distributor not found");

    const today = new Date().toISOString().split('T')[0];
    const activePrices = store.specialPrices.filter(p => p.distributorId === distributorId && p.startDate <= today && p.endDate >= today);
    const distributorSchemes = store.schemes.filter(s => s.distributorId === distributorId && !s.isGlobal && s.startDate <= today && s.endDate >= today);
    const globalSchemes = store.schemes.filter(s => s.isGlobal && s.startDate <= today && s.endDate >= today);
    const applicableSchemes = distributorSchemes.length > 0 ? distributorSchemes : globalSchemes;

    let subtotal = 0;
    const finalOrderItems: OrderItem[] = [];
    const freebies = new Map<string, number>();

    items.forEach(item => {
        const sku = store.skus.find(s => s.id === item.skuId);
        if (!sku) return;
        const specialPrice = activePrices.find(p => p.skuId === item.skuId);
        const unitPrice = specialPrice ? specialPrice.price : sku.price;
        subtotal += item.quantity * unitPrice;
        finalOrderItems.push({ orderId: '', skuId: item.skuId, quantity: item.quantity, freeQuantity: 0, unitPrice, isFreebie: false });
    });
    
    applicableSchemes.forEach(scheme => {
        const boughtItem = items.find(i => i.skuId === scheme.buySkuId);
        if (boughtItem && boughtItem.quantity >= scheme.buyQuantity) {
            const timesApplied = Math.floor(boughtItem.quantity / scheme.buyQuantity);
            const freeQty = timesApplied * scheme.getQuantity;
            freebies.set(scheme.getSkuId, (freebies.get(scheme.getSkuId) || 0) + freeQty);
        }
    });

    freebies.forEach((quantity, skuId) => {
        finalOrderItems.push({ orderId: '', skuId, quantity, freeQuantity: 0, unitPrice: 0, isFreebie: true });
    });

    if (subtotal > distributor.walletBalance) {
        this.addNotification(NotificationType.ORDER_FAILED, `Order failed for ${distributor.name} due to insufficient funds.`);
        throw new Error("Insufficient wallet balance.");
    }

    const newOrder: Order = {
        id: generateId('ord-'), distributorId, totalAmount: subtotal, coveredByWallet: subtotal,
        date: new Date().toISOString(), placedByExecId, status: OrderStatus.PENDING,
    };

    finalOrderItems.forEach(item => item.orderId = newOrder.id);
    store.orders.push(newOrder);
    store.orderItems.push(...finalOrderItems);
    
    distributor.walletBalance -= subtotal;
    const transaction: WalletTransaction = {
        id: generateId('txn-'), distributorId, amount: -subtotal, type: TransactionType.ORDER_DEBIT,
        date: newOrder.date, addedBy: placedByExecId, orderId: newOrder.id
    };
    store.walletTransactions.push(transaction);

    this.addNotification(NotificationType.ORDER_PLACED, `Order #${newOrder.id} for ₹${subtotal.toLocaleString('en-IN')} placed for ${distributor.name}.`);
    if(distributor.walletBalance < 10000) {
        this.addNotification(NotificationType.WALLET_LOW, `${distributor.name}'s wallet is low: ₹${distributor.walletBalance.toFixed(2)}`, distributorId);
    }
    
    store.saveAll();
    return simulateNetwork(newOrder);
  }

  async updateOrderStatus(orderId: string, status: OrderStatus, updatedBy: string): Promise<Order> {
      const order = store.orders.find(o => o.id === orderId);
      if (!order) throw new Error("Order not found");
      
      const previousStatus = order.status;
      order.status = status;
      
      if(previousStatus === OrderStatus.PENDING && status === OrderStatus.DELIVERED) {
          const debitTx = store.walletTransactions.find(t => t.orderId === orderId && t.type === TransactionType.ORDER_DEBIT);
          if(debitTx) {
            // This logic is flawed. A real system would not add money back.
            // This is just to make the mock balance history look correct.
            const distributor = store.distributors.find(d => d.id === order.distributorId);
            if(distributor) distributor.walletBalance += Math.abs(debitTx.amount);
          }
      }
      
      store.saveAll();
      return simulateNetwork(order);
  }
  
  async updateOrderItems(orderId: string, items: { skuId: string, quantity: number }[], updatedBy: string): Promise<Order> {
    const order = store.orders.find(o => o.id === orderId);
    const distributor = store.distributors.find(d => d.id === order?.distributorId);
    if (!order || !distributor) throw new Error("Order or distributor not found");
    if(order.status !== OrderStatus.PENDING) throw new Error("Only pending orders can be edited.");

    const originalTotal = order.totalAmount;
    
    store.orderItems = store.orderItems.filter(i => i.orderId !== orderId);
    
    const today = new Date().toISOString().split('T')[0];
    const activePrices = store.specialPrices.filter(p => p.distributorId === distributor.id && p.startDate <= today && p.endDate >= today);
    const distributorSchemes = store.schemes.filter(s => s.distributorId === distributor.id && !s.isGlobal && s.startDate <= today && s.endDate >= today);
    const globalSchemes = store.schemes.filter(s => s.isGlobal && s.startDate <= today && s.endDate >= today);
    const applicableSchemes = distributorSchemes.length > 0 ? distributorSchemes : globalSchemes;

    let newSubtotal = 0;
    const finalOrderItems: OrderItem[] = [];
    const freebies = new Map<string, number>();

    items.forEach(item => {
        const sku = store.skus.find(s => s.id === item.skuId);
        if (!sku) return;
        const specialPrice = activePrices.find(p => p.skuId === item.skuId);
        const unitPrice = specialPrice ? specialPrice.price : sku.price;
        newSubtotal += item.quantity * unitPrice;
        finalOrderItems.push({ orderId, skuId: item.skuId, quantity: item.quantity, freeQuantity: 0, unitPrice, isFreebie: false });
    });
    
    applicableSchemes.forEach(scheme => {
        const boughtItem = items.find(i => i.skuId === scheme.buySkuId);
        if (boughtItem && boughtItem.quantity >= scheme.buyQuantity) {
            const timesApplied = Math.floor(boughtItem.quantity / scheme.buyQuantity);
            const freeQty = timesApplied * scheme.getQuantity;
            freebies.set(scheme.getSkuId, (freebies.get(scheme.getSkuId) || 0) + freeQty);
        }
    });

    freebies.forEach((quantity, skuId) => {
        finalOrderItems.push({ orderId, skuId, quantity, freeQuantity: 0, unitPrice: 0, isFreebie: true });
    });
    
    const delta = newSubtotal - originalTotal;
    const availableBalance = distributor.walletBalance + originalTotal; // Add back original amount before checking
    
    if (newSubtotal > availableBalance) {
        throw new Error("Distributor has insufficient funds to cover the order increase.");
    }
    
    order.totalAmount = newSubtotal;
    order.coveredByWallet = newSubtotal;
    distributor.walletBalance = availableBalance - newSubtotal;

    store.orderItems.push(...finalOrderItems);
    
    const transaction: WalletTransaction = {
        id: generateId('txn-'), distributorId: distributor.id, amount: -delta, 
        type: TransactionType.ORDER_ADJUSTMENT,
        date: new Date().toISOString(), addedBy: updatedBy, orderId: order.id
    };
    const debitTxIndex = store.walletTransactions.findIndex(t => t.orderId === orderId && t.type === TransactionType.ORDER_DEBIT);
    if(debitTxIndex > -1) store.walletTransactions[debitTxIndex].amount = -newSubtotal;
    store.walletTransactions.push(transaction);

    store.saveAll();
    return simulateNetwork(order);
  }

  // --- Notifications ---
  getNotifications = () => simulateNetwork(store.notifications.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  async addNotification(type: NotificationType, message: string, distributorId?: string) {
      const notification: Notification = {
          id: generateId('notif-'), type, message, distributorId, isRead: false,
          date: new Date().toISOString(),
      };
      store.notifications.unshift(notification);
      store.saveAll();
  }
  async markNotificationAsRead(id: string): Promise<void> {
      const notif = store.notifications.find(n => n.id === id);
      if (notif) notif.isRead = true;
      store.saveAll();
      return simulateNetwork(undefined);
  }
  async markAllNotificationsAsRead(): Promise<void> {
      store.notifications.forEach(n => n.isRead = true);
      store.saveAll();
      return simulateNetwork(undefined);
  }

  // --- Invoice ---
  async getInvoiceData(orderId: string): Promise<InvoiceData | null> {
    const order = store.orders.find(o => o.id === orderId);
    if (!order) return simulateNetwork(null);
    
    const distributor = store.distributors.find(d => d.id === order.distributorId);
    if (!distributor) return simulateNetwork(null);
    
    const items = await this.getOrderItems(orderId);
    
    return simulateNetwork({ order, distributor, items });
  }

}

export const api = new ApiService();