import React, { useEffect, useState, useMemo } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { api } from '../services/mockApiService';
import { Distributor, Order, OrderStatus, SKU, OrderItem } from '../types';
import Card from './common/Card';
import Button from './common/Button';
import { DollarSign, Users, Package, Clock, TrendingUp, BarChart, UserPlus, ShoppingCart, Wallet } from 'lucide-react';
import { formatIndianCurrency, formatIndianCurrencyShort } from '../utils/formatting';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line, BarChart as RechartsBarChart, Bar } from 'recharts';

// Bento Item Wrapper
const BentoItem: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => (
    <div className={`bg-card rounded-lg p-4 md:p-6 border border-border shadow-sm flex flex-col transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${className}`}>
        {children}
    </div>
);

// Stat Card for top row
const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; className?: string; }> = ({ title, value, icon, className }) => (
    <BentoItem className={`justify-center ${className || ''}`}>
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-primary-lightest rounded-lg text-primary">{icon}</div>
                <div>
                    <p className="text-sm font-medium text-text-secondary">{title}</p>
                    <p className="text-2xl font-bold text-text-primary mt-1">{value}</p>
                </div>
            </div>
        </div>
    </BentoItem>
);

// Custom Tooltip for charts
const CustomSalesTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-card/80 backdrop-blur-sm p-3 border rounded-lg shadow-lg text-sm">
                <p className="font-bold mb-1 text-text-primary">{label}</p>
                <p className="text-primary">{`Sales: ${formatIndianCurrency(payload[0].value)}`}</p>
            </div>
        );
    }
    return null;
};

const BentoPage: React.FC = () => {
    const navigate = ReactRouterDOM.useNavigate();
    const [distributors, setDistributors] = useState<Distributor[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [allOrderItems, setAllOrderItems] = useState<OrderItem[]>([]);
    const [skus, setSkus] = useState<SKU[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [distributorData, orderData, orderItemData, skuData] = await Promise.all([
                    api.getDistributors(),
                    api.getOrders(),
                    api.getAllOrderItems(),
                    api.getSKUs(),
                ]);
                setDistributors(distributorData);
                setOrders(orderData);
                setAllOrderItems(orderItemData);
                setSkus(skuData);
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const dashboardData = useMemo(() => {
        const deliveredOrders = orders.filter(o => o.status === OrderStatus.DELIVERED);
        const pendingOrders = orders.filter(o => o.status === OrderStatus.PENDING);
        
        const totalSales = deliveredOrders.reduce((sum, order) => sum + order.totalAmount, 0);
        const totalWalletBalance = distributors.reduce((sum, d) => sum + d.walletBalance, 0);

        // Sales Trend (Last 30 days of data)
        const salesByDate = new Map<string, number>();
        deliveredOrders.forEach(order => {
            const date = new Date(order.date).toLocaleDateString('en-CA');
            salesByDate.set(date, (salesByDate.get(date) || 0) + order.totalAmount);
        });
        const salesTrendData = Array.from(salesByDate.entries())
            .map(([date, sales]) => ({ date, sales }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(-30);

        // Top 5 Products
        const productSales = new Map<string, number>();
        const deliveredOrderIds = new Set(deliveredOrders.map(o => o.id));
        allOrderItems.forEach(item => {
            if (deliveredOrderIds.has(item.orderId) && !item.isFreebie) {
                const skuName = skus.find(s => s.id === item.skuId)?.name || 'Unknown';
                productSales.set(skuName, (productSales.get(skuName) || 0) + item.quantity * item.unitPrice);
            }
        });
        const topProductsData = Array.from(productSales.entries())
            .map(([name, sales]) => ({ name, sales }))
            .sort((a, b) => b.sales - a.sales)
            .slice(0, 5);

        // Recent Orders
        const recentOrders = orders
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5)
            .map(o => ({
                ...o,
                distributorName: distributors.find(d => d.id === o.distributorId)?.name || 'Unknown',
            }));

        return {
            totalSales,
            totalWalletBalance,
            totalDistributors: distributors.length,
            pendingOrdersCount: pendingOrders.length,
            salesTrendData,
            topProductsData,
            recentOrders,
        };
    }, [orders, distributors, allOrderItems, skus]);

    if (loading) {
        return <div className="flex justify-center items-center h-full"><p>Loading dashboard...</p></div>;
    }

    const getStatusChip = (status: OrderStatus) => {
        const baseClasses = "px-2 py-0.5 text-xs font-semibold rounded-full inline-block";
        if (status === OrderStatus.DELIVERED) {
            return <span className={`${baseClasses} bg-green-100 text-green-800`}>{status}</span>;
        }
        return <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>{status}</span>;
    }

    return (
        <div className="grid grid-cols-12 auto-rows-min gap-6">
            {/* Stats */}
            <StatCard title="Total Sales" value={formatIndianCurrency(dashboardData.totalSales)} icon={<TrendingUp size={24} />} className="col-span-12 md:col-span-6 lg:col-span-3"/>
            <StatCard title="Total Wallet Balance" value={formatIndianCurrency(dashboardData.totalWalletBalance)} icon={<DollarSign size={24} />} className="col-span-12 md:col-span-6 lg:col-span-3"/>
            <StatCard title="Active Distributors" value={dashboardData.totalDistributors.toString()} icon={<Users size={24} />} className="col-span-12 md:col-span-6 lg:col-span-3"/>
            <StatCard title="Pending Orders" value={dashboardData.pendingOrdersCount.toString()} icon={<Clock size={24} />} className="col-span-12 md:col-span-6 lg:col-span-3"/>
            
            {/* Sales Trend Chart */}
            <BentoItem className="col-span-12 lg:col-span-6 lg:row-span-3">
                <h3 className="text-base font-semibold mb-2 text-text-primary">Sales Trend</h3>
                <p className="text-xs text-text-secondary mb-4">Last 30 days of sales activity.</p>
                <div className="flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={dashboardData.salesTrendData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                            <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => formatIndianCurrencyShort(Number(value))} />
                            <Tooltip content={<CustomSalesTooltip />} cursor={{ fill: 'var(--color-background)' }} />
                            <Line type="monotone" dataKey="sales" stroke="var(--color-primary)" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </BentoItem>

            {/* Top Products Chart */}
            <BentoItem className="col-span-12 lg:col-span-6 lg:row-span-3">
                <h3 className="text-base font-semibold mb-2 text-text-primary">Top 5 Products by Sales</h3>
                <p className="text-xs text-text-secondary mb-4">Highest revenue-generating products.</p>
                <div className="flex-1">
                     <ResponsiveContainer width="100%" height="100%">
                        <RechartsBarChart data={dashboardData.topProductsData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                            <XAxis type="number" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => formatIndianCurrencyShort(Number(value))} />
                            <YAxis type="category" dataKey="name" width={80} fontSize={10} tickLine={false} axisLine={false} interval={0} />
                            <Tooltip formatter={(value) => [formatIndianCurrency(Number(value)), 'Sales']} cursor={{fill: 'var(--color-background)'}}/>
                            <Bar dataKey="sales" fill="var(--color-primary)" barSize={15} />
                        </RechartsBarChart>
                    </ResponsiveContainer>
                </div>
            </BentoItem>

            {/* Recent Orders */}
            <BentoItem className="col-span-12 lg:col-span-8 lg:row-span-3">
                 <h3 className="text-base font-semibold mb-4 text-text-primary">Recent Orders</h3>
                 <div className="flex-1 space-y-3 overflow-y-auto">
                    {dashboardData.recentOrders.map(order => (
                        <div key={order.id} className="flex items-center justify-between p-2 rounded-md hover:bg-slate-50">
                            <div>
                                <p className="font-semibold text-sm">{order.distributorName}</p>
                                <p className="text-xs text-text-secondary">
                                    {new Date(order.date).toLocaleDateString()} &bull; <span className="font-mono">{order.id}</span>
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-sm">{formatIndianCurrency(order.totalAmount)}</p>
                                {getStatusChip(order.status)}
                            </div>
                        </div>
                    ))}
                 </div>
            </BentoItem>

            {/* Quick Actions */}
            <BentoItem className="col-span-12 lg:col-span-4 lg:row-span-3">
                 <h3 className="text-base font-semibold mb-4 text-text-primary">Quick Actions</h3>
                 <div className="flex-1 flex flex-col justify-center space-y-4">
                    <Button onClick={() => navigate('/place-order')} className="w-full justify-start text-base py-3" variant="secondary"><ShoppingCart size={18}/><span>Place a New Order</span></Button>
                    <Button onClick={() => navigate('/add-distributor')} className="w-full justify-start text-base py-3" variant="secondary"><UserPlus size={18}/><span>Onboard Distributor</span></Button>
                    <Button onClick={() => navigate('/recharge-wallet')} className="w-full justify-start text-base py-3" variant="secondary"><Wallet size={18}/><span>Recharge a Wallet</span></Button>
                 </div>
            </BentoItem>
        </div>
    );
};

export default BentoPage;