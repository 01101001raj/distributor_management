import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/mockApiService';
import { Order, Distributor, OrderStatus, OrderItem, SKU, Scheme } from '../types';
import Card from './common/Card';
import Select from './common/Select';
import { DollarSign, Package, Gift, TrendingUp, BarChart, Download } from 'lucide-react';
import DateRangePicker from './common/DateRangePicker';
import Button from './common/Button';

interface StatCardProps {
    title: string;
    value: string;
    icon: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon }) => (
    <div className="bg-background border border-border rounded-xl p-4 flex items-center">
        <div className="p-3 rounded-full bg-blue-100 text-primary mr-4">
            {icon}
        </div>
        <div>
            <p className="text-sm font-medium text-text-secondary">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
        </div>
    </div>
);

// Define the exact product display order as requested.
// We use the product names from the mock data to ensure consistency.
const PRODUCT_ORDER = [
    'normal 2L',    // SKU003
    'normal 1L',    // SKU001
    'normal 500ml', // SKU002
    'normal 250ml', // SKU004
    '1L premium',     // SKU005
];


const SalesPage: React.FC = () => {
    const getInitialDateRange = () => {
        const to = new Date();
        const from = new Date(to.getFullYear(), to.getMonth(), 1);
        to.setHours(0,0,0,0);
        from.setHours(0,0,0,0);
        return { from, to };
    };
    
    const [orders, setOrders] = useState<Order[]>([]);
    const [allOrderItems, setAllOrderItems] = useState<OrderItem[]>([]);
    const [distributors, setDistributors] = useState<Distributor[]>([]);
    const [skus, setSkus] = useState<SKU[]>([]);
    const [schemes, setSchemes] = useState<Scheme[]>([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState(getInitialDateRange());
    const [selectedDistributorId, setSelectedDistributorId] = useState<string>('all');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [orderData, distributorData, skuData, orderItemData, schemeData] = await Promise.all([
                    api.getOrders(),
                    api.getDistributors(),
                    api.getSKUs(),
                    api.getAllOrderItems(),
                    api.getSchemes(),
                ]);
                setOrders(orderData);
                setDistributors(distributorData);
                setSkus(skuData);
                setAllOrderItems(orderItemData);
                setSchemes(schemeData);
            } catch (error) {
                console.error("Failed to fetch sales data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const salesData = useMemo(() => {
        const { from, to } = dateRange;
        if (!from) {
            return {
                totalSalesValue: 0,
                schemeSales: [],
                totalSchemePaidQty: 0,
                totalSchemeFreeQty: 0,
                totalNonSchemeQty: 0,
                productSalesSummary: [],
                schemeTotals: {},
                filteredOrders: [],
                filteredOrderItems: [],
            };
        }

        const start = from;
        start.setHours(0, 0, 0, 0);
        const end = to || from;
        end.setHours(23, 59, 59, 999);

        const filteredOrders = orders.filter(order => {
            if (order.status !== OrderStatus.DELIVERED) return false;
            const orderDate = new Date(order.date);
            if (!(orderDate >= start && orderDate <= end)) return false;
            if (selectedDistributorId !== 'all' && order.distributorId !== selectedDistributorId) return false;
            return true;
        });

        const totalSalesValue = filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0);
        const filteredOrderIds = new Set(filteredOrders.map(o => o.id));
        const filteredOrderItems = allOrderItems.filter(item => filteredOrderIds.has(item.orderId));
        
        const allSchemeSkuIds = new Set(schemes.flatMap(s => [s.buySkuId, s.getSkuId]));

        const skuMap = new Map(skus.map(s => [s.id, s.name]));
        const distributorMap = new Map(distributors.map(d => [d.id, d.name]));

        const schemeData: Record<string, any> = {};
        let totalSchemePaidQty = 0;
        let totalSchemeFreeQty = 0;
        let totalNonSchemeQty = 0;
        
        filteredOrderItems.forEach(item => {
            const order = orders.find(o => o.id === item.orderId);
            if (!order) return;

            const distId = order.distributorId;
            const skuName = skuMap.get(item.skuId);
            if (!skuName) return;

            const isSchemeProduct = allSchemeSkuIds.has(item.skuId);

            if (isSchemeProduct) {
                if (!schemeData[distId]) schemeData[distId] = { amount: 0 };
                if (item.isFreebie) {
                    schemeData[distId][`${skuName} free`] = (schemeData[distId][`${skuName} free`] || 0) + item.quantity;
                    totalSchemeFreeQty += item.quantity;
                } else {
                    schemeData[distId][skuName] = (schemeData[distId][skuName] || 0) + item.quantity;
                    schemeData[distId].amount += item.quantity * item.unitPrice;
                    totalSchemePaidQty += item.quantity;
                }
            } else {
                if (!item.isFreebie) {
                    totalNonSchemeQty += item.quantity;
                }
            }
        });
        
        const schemeSales = Object.entries(schemeData).map(([distId, data]) => ({
            distributorName: distributorMap.get(distId) || 'Unknown',
            ...data
        })).sort((a,b) => a.distributorName.localeCompare(b.distributorName));
        
        const productSummary = new Map<string, number>();
        filteredOrderItems.forEach(item => {
            if (!item.isFreebie) {
                 const skuName = skuMap.get(item.skuId);
                 if(skuName) {
                    productSummary.set(skuName, (productSummary.get(skuName) || 0) + item.quantity);
                 }
            }
        });

        const productSalesSummary = Array.from(productSummary, ([skuName, totalQuantity]) => ({
            skuName,
            totalQuantity
        })).sort((a, b) => b.totalQuantity - a.totalQuantity);
        
        const schemeTotals: Record<string, any> = { amount: 0 };
        schemeSales.forEach(sale => {
            PRODUCT_ORDER.forEach(name => {
                schemeTotals[name] = (schemeTotals[name] || 0) + (sale[name] || 0);
                schemeTotals[`${name} free`] = (schemeTotals[`${name} free`] || 0) + (sale[`${name} free`] || 0);
            });
            schemeTotals.amount += sale.amount || 0;
        });

        return { totalSalesValue, schemeSales, totalSchemePaidQty, totalSchemeFreeQty, totalNonSchemeQty, productSalesSummary, schemeTotals, filteredOrders, filteredOrderItems };
    }, [orders, allOrderItems, distributors, skus, schemes, dateRange, selectedDistributorId]);
    
    const handleExportCsv = () => {
        if (loading) return;

        const { filteredOrders, filteredOrderItems } = salesData;

        const allSchemeSkuIds = new Set(schemes.flatMap(s => [s.buySkuId, s.getSkuId]));
        const skuMap = new Map(skus.map(s => [s.id, s.name]));
        const distributorMap = new Map(distributors.map(d => [d.id, d.name]));

        const headers = [
            'Order ID', 'Order Date', 'Distributor Name', 'Sale Type', 
            'Product Name', 'Item Type', 'Quantity', 'Unit Price', 'Total Amount'
        ];

        const escapeCsvCell = (cell: any): string => {
            const str = String(cell ?? '');
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };

        const rows = filteredOrderItems.map(item => {
            const order = filteredOrders.find(o => o.id === item.orderId);
            if (!order) return null;

            const distributorName = distributorMap.get(order.distributorId) || 'Unknown';
            const skuName = skuMap.get(item.skuId) || 'Unknown SKU';
            const isSchemeProduct = allSchemeSkuIds.has(item.skuId);

            return [
                order.id,
                new Date(order.date).toLocaleDateString(),
                distributorName,
                isSchemeProduct ? 'Scheme' : 'Non-Scheme',
                skuName,
                item.isFreebie ? 'Free' : 'Paid',
                item.quantity,
                item.unitPrice,
                item.quantity * item.unitPrice
            ].map(escapeCsvCell);
        }).filter((row): row is string[] => row !== null);

        const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            const filename = `sales_report_${new Date().toISOString().split('T')[0]}.csv`;
            link.setAttribute("href", url);
            link.setAttribute("download", filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    if (loading) {
        return <div className="text-center p-8">Loading sales data...</div>;
    }

    return (
        <div className="space-y-6">
            <Card>
                <h2 className="text-xl font-bold mb-4">Sales Report</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <DateRangePicker 
                        label="Select Date Range"
                        value={dateRange}
                        onChange={(newRange) => setDateRange(newRange)}
                    />
                    <Select
                        label="Filter by Distributor"
                        value={selectedDistributorId}
                        onChange={e => setSelectedDistributorId(e.target.value)}
                    >
                        <option value="all">All Distributors</option>
                        {distributors.map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                    </Select>
                    <Button onClick={handleExportCsv} variant="secondary">
                        <Download size={16} className="mr-2" />
                        Export CSV
                    </Button>
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Sales Value" value={`₹${salesData.totalSalesValue.toLocaleString()}`} icon={<DollarSign />} />
                <StatCard title="Scheme: Paid Items" value={salesData.totalSchemePaidQty.toLocaleString()} icon={<Package />} />
                <StatCard title="Scheme: Free Items" value={salesData.totalSchemeFreeQty.toLocaleString()} icon={<Gift />} />
                <StatCard title="Non-Scheme Items" value={salesData.totalNonSchemeQty.toLocaleString()} icon={<TrendingUp />} />
            </div>
            
            <Card>
                <h3 className="flex items-center text-lg font-semibold mb-4 text-text-primary">
                    <BarChart size={20} className="mr-2"/>
                    Total Quantity Sold Per Product
                </h3>
                <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-left min-w-[400px]">
                        <thead className="bg-background sticky top-0">
                            <tr className="border-b border-border">
                                <th className="p-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Product</th>
                                <th className="p-3 text-xs font-semibold text-text-secondary uppercase tracking-wider text-right">Total Quantity Sold</th>
                            </tr>
                        </thead>
                        <tbody>
                            {salesData.productSalesSummary.map((product, index) => (
                                <tr key={index} className="border-b border-border last:border-b-0 hover:bg-background">
                                    <td className="p-3 font-medium text-text-primary">{product.skuName}</td>
                                    <td className="p-3 text-right font-semibold">{product.totalQuantity.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {salesData.productSalesSummary.length === 0 && (
                        <div className="text-center p-6 text-text-secondary">
                            <p>No products sold in the selected period.</p>
                        </div>
                    )}
                </div>
            </Card>

            <Card>
                <h3 className="text-lg font-semibold mb-4 text-text-primary">Scheme Sales Details</h3>
                <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-left min-w-[1200px]">
                        <thead className="bg-background sticky top-0">
                            <tr className="border-b border-border">
                                <th className="p-3 text-xs font-semibold text-text-secondary uppercase tracking-wider whitespace-nowrap">Distributor</th>
                                {PRODUCT_ORDER.map(name => (
                                    <React.Fragment key={name}>
                                        <th className="p-3 text-xs font-semibold text-text-secondary uppercase tracking-wider text-center whitespace-nowrap">{name}</th>
                                        <th className="p-3 text-xs font-semibold text-text-secondary uppercase tracking-wider text-center whitespace-nowrap bg-green-50">{name} Free</th>
                                    </React.Fragment>
                                ))}
                                <th className="p-3 text-xs font-semibold text-text-secondary uppercase tracking-wider text-right whitespace-nowrap">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {salesData.schemeSales.map((sale, index) => (
                                <tr key={index} className="border-b border-border last:border-b-0 hover:bg-background">
                                    <td className="p-3 font-medium text-text-primary whitespace-nowrap">{sale.distributorName}</td>
                                    {PRODUCT_ORDER.map(name => (
                                        <React.Fragment key={name}>
                                            <td className="p-3 text-center font-semibold">{sale[name]?.toLocaleString() || '-'}</td>
                                            <td className="p-3 text-center font-semibold text-green-600 bg-green-50">{sale[`${name} free`]?.toLocaleString() || '-'}</td>
                                        </React.Fragment>
                                    ))}
                                    <td className="p-3 text-right font-bold">₹{sale.amount.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-background border-t-2 border-border">
                            <tr className="font-bold text-text-primary">
                                <td className="p-3 whitespace-nowrap">Total</td>
                                {PRODUCT_ORDER.map(name => (
                                    <React.Fragment key={name}>
                                        <td className="p-3 text-center whitespace-nowrap">{salesData.schemeTotals[name]?.toLocaleString() || '0'}</td>
                                        <td className="p-3 text-center whitespace-nowrap bg-green-50 text-green-700">{salesData.schemeTotals[`${name} free`]?.toLocaleString() || '0'}</td>
                                    </React.Fragment>
                                ))}
                                <td className="p-3 text-right whitespace-nowrap">₹{salesData.schemeTotals.amount.toLocaleString()}</td>
                            </tr>
                        </tfoot>
                    </table>
                    {salesData.schemeSales.length === 0 && (
                        <div className="text-center p-6 text-text-secondary">
                            <p>No scheme-based sales recorded for the selected period and filter.</p>
                        </div>
                    )}
                </div>
            </Card>
            
        </div>
    );
};

export default SalesPage;