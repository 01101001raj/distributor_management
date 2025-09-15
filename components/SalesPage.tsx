import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/mockApiService';
import { Order, Distributor, OrderStatus, OrderItem, SKU, Scheme } from '../types';
import Card from './common/Card';
import Select from './common/Select';
import { DollarSign, Package, Gift, Download, TrendingUp, BarChart, Table } from 'lucide-react';
import DateRangePicker from './common/DateRangePicker';
import Button from './common/Button';
import { ResponsiveContainer, LineChart, BarChart as RechartsBarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line, Bar } from 'recharts';
import { formatIndianCurrency, formatIndianNumber, formatIndianCurrencyShort } from '../utils/formatting';
import { useSortableData } from '../hooks/useSortableData';
import SortableTableHeader from './common/SortableTableHeader';

interface StatCardProps {
    title: string;
    value: string;
    icon: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon }) => (
    <Card className="p-4">
        <div className="flex justify-between items-start">
            <div>
                <p className="text-sm font-medium text-text-secondary">{title}</p>
                <p className="text-2xl font-bold text-text-primary mt-1">{value}</p>
            </div>
            <div className="p-2 bg-primary-lightest rounded-md text-primary">
                {icon}
            </div>
        </div>
    </Card>
);

const PRODUCT_ORDER = [
    'Normal 2L',
    'Normal 1L',
    'Normal 500ml',
    'Normal 250ml',
    'Premium 1L',
];

type ChartGranularity = 'daily' | 'monthly' | 'quarterly' | 'yearly';

const CustomStateTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        const total = data.value;
        return (
            <div className="bg-white p-3 border rounded-lg shadow-lg text-sm max-w-xs">
                <p className="font-bold mb-2 text-text-primary">{label}: {formatIndianCurrency(total)}</p>
                <div className="space-y-1">
                    {data.areas.slice(0, 5).map((area: any) => (
                        <div key={area.name} className="flex justify-between items-center text-text-secondary">
                            <span>{area.name}</span>
                            <span className="ml-4 font-medium text-text-primary">({((area.value / total) * 100).toFixed(1)}%)</span>
                        </div>
                    ))}
                    {data.areas.length > 5 && <p className="text-xs text-text-secondary mt-1">...and {data.areas.length - 5} more</p>}
                </div>
            </div>
        );
    }
    return null;
};

const CustomSalesTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-card p-3 border rounded-lg shadow-md text-sm">
                <p className="font-bold mb-1 text-text-primary">{label}</p>
                <p className="text-primary">{`Sales: ${formatIndianCurrency(payload[0].value)}`}</p>
            </div>
        );
    }
    return null;
};


const SalesPage: React.FC = () => {
    const getInitialDateRange = () => {
        const to = new Date();
        const from = new Date();
        from.setMonth(to.getMonth() - 1);
        to.setHours(23, 59, 59, 999);
        from.setHours(0, 0, 0, 0);
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
    const [selectedState, setSelectedState] = useState<string>('all');
    const [selectedArea, setSelectedArea] = useState<string>('all');
    const [selectedSchemeId, setSelectedSchemeId] = useState<string>('all');
    const [topProductsCount, setTopProductsCount] = useState<5 | 10>(5);
    const [chartGranularity, setChartGranularity] = useState<ChartGranularity>('daily');


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

    const uniqueStates = useMemo(() => [...new Set(distributors.map(d => d.state))].sort(), [distributors]);

    const availableAreas = useMemo(() => {
        if (selectedState === 'all') {
            return [...new Set(distributors.map(d => d.area))].sort();
        }
        return [...new Set(distributors.filter(d => d.state === selectedState).map(d => d.area))].sort();
    }, [distributors, selectedState]);

    const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedState(e.target.value);
        setSelectedArea('all');
    };
    
    const salesData = useMemo(() => {
        const { from, to } = dateRange;
        if (!from) {
            return {
                totalSalesValue: 0,
                distributorSales: [],
                totalPaidQty: 0,
                totalFreeQty: 0,
                productSalesSummary: [],
                salesTotals: {},
                filteredOrders: [],
                filteredOrderItems: [],
                salesTrendData: [],
                topProductsData: [],
                salesByStateData: [],
                salesByDistributorData: [],
            };
        }

        const start = from;
        start.setHours(0, 0, 0, 0);
        const end = to || from;
        end.setHours(23, 59, 59, 999);

        const filteredDistributorIds = new Set(
            distributors
                .filter(d => (selectedState === 'all' || d.state === selectedState))
                .filter(d => (selectedArea === 'all' || d.area === selectedArea))
                .map(d => d.id)
        );

        const selectedScheme = selectedSchemeId !== 'all' ? schemes.find(s => s.id === selectedSchemeId) : null;

        const filteredOrders = orders.filter(order => {
            if (order.status !== OrderStatus.DELIVERED) return false;
            
            const orderDate = new Date(order.date);
            if (!(orderDate >= start && orderDate <= end)) return false;
            
            if (!filteredDistributorIds.has(order.distributorId)) return false;

            if (selectedDistributorId !== 'all' && order.distributorId !== selectedDistributorId) return false;

            if (selectedScheme) {
                const orderItemsForThisOrder = allOrderItems.filter(i => i.orderId === order.id && !i.isFreebie);
                const buySkuQuantity = orderItemsForThisOrder
                    .filter(i => i.skuId === selectedScheme.buySkuId)
                    .reduce((sum, item) => sum + item.quantity, 0);
                
                if (buySkuQuantity < selectedScheme.buyQuantity) {
                    return false;
                }
            }
            
            return true;
        });

        const totalSalesValue = filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0);
        const filteredOrderIds = new Set(filteredOrders.map(o => o.id));
        const filteredOrderItems = allOrderItems.filter(item => filteredOrderIds.has(item.orderId));
        
        const skuMap = new Map(skus.map(s => [s.id, s.name]));
        const distributorMap = new Map(distributors.map(d => [d.id, d]));

        const distributorData: Record<string, any> = {};
        let totalPaidQty = 0;
        let totalFreeQty = 0;
        
        filteredOrderItems.forEach(item => {
            const order = orders.find(o => o.id === item.orderId);
            if (!order) return;

            const distId = order.distributorId;
            const skuName = skuMap.get(item.skuId);
            if (!skuName) return;

            if (!distributorData[distId]) distributorData[distId] = { amount: 0 };
            
            if (item.isFreebie) {
                distributorData[distId][`${skuName} free`] = (distributorData[distId][`${skuName} free`] || 0) + item.quantity;
                totalFreeQty += item.quantity;
            } else {
                distributorData[distId][skuName] = (distributorData[distId][skuName] || 0) + item.quantity;
                distributorData[distId].amount += item.quantity * item.unitPrice;
                totalPaidQty += item.quantity;
            }
        });
        
        const distributorSales = Object.entries(distributorData).map(([distId, data]) => ({
            distributorName: distributorMap.get(distId)?.name || 'Unknown',
            ...data
        }));
        
        const productSummary = new Map<string, { paid: number, free: number }>();
        filteredOrderItems.forEach(item => {
            const skuName = skuMap.get(item.skuId);
             if(skuName) {
                const current = productSummary.get(skuName) || { paid: 0, free: 0 };
                if (item.isFreebie) {
                    current.free += item.quantity;
                } else {
                    current.paid += item.quantity;
                }
                productSummary.set(skuName, current);
             }
        });

        const productSalesSummary = Array.from(productSummary, ([skuName, data]) => ({
            skuName,
            paid: data.paid,
            free: data.free,
            total: data.paid + data.free,
        }));
        
        const salesTotals: Record<string, any> = { amount: 0 };
        distributorSales.forEach(sale => {
            PRODUCT_ORDER.forEach(name => {
                salesTotals[name] = (salesTotals[name] || 0) + (sale[name] || 0);
                salesTotals[`${name} free`] = (salesTotals[`${name} free`] || 0) + (sale[`${name} free`] || 0);
            });
            salesTotals.amount += sale.amount || 0;
        });
        
        // --- Data for Charts ---
        const salesByDateAggregation = new Map<string, number>();
        filteredOrders.forEach(order => {
            const date = new Date(order.date);
            let key = '';
            switch (chartGranularity) {
                case 'monthly':
                    key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    break;
                case 'quarterly':
                    const quarter = Math.floor(date.getMonth() / 3) + 1;
                    key = `${date.getFullYear()}-Q${quarter}`;
                    break;
                case 'yearly':
                    key = `${date.getFullYear()}`;
                    break;
                case 'daily':
                default:
                    key = date.toLocaleDateString('en-CA'); // YYYY-MM-DD
                    break;
            }
            salesByDateAggregation.set(key, (salesByDateAggregation.get(key) || 0) + order.totalAmount);
        });
        
        const salesTrendData = Array.from(salesByDateAggregation.entries())
            .map(([date, sales]) => ({ date, sales }))
            .sort((a, b) => a.date.localeCompare(b.date));
            
        const topProductsData = productSalesSummary.sort((a, b) => b.total - a.total);

        const salesByStateAndArea = new Map<string, { total: number; areas: Map<string, number> }>();
        const distributorDetailsMap = new Map(distributors.map(d => [d.id, { state: d.state, area: d.area }]));
        filteredOrders.forEach(order => {
            const details = distributorDetailsMap.get(order.distributorId);
            if (details) {
                const { state, area } = details;
                const stateData = salesByStateAndArea.get(state) || { total: 0, areas: new Map<string, number>() };
                stateData.total += order.totalAmount;
                stateData.areas.set(area, (stateData.areas.get(area) || 0) + order.totalAmount);
                salesByStateAndArea.set(state, stateData);
            }
        });

        const salesByStateData = Array.from(salesByStateAndArea.entries())
            .map(([name, { total, areas }]) => ({
                name,
                value: total,
                areas: Array.from(areas.entries())
                    .map(([areaName, areaValue]) => ({ name: areaName, value: areaValue }))
                    .sort((a,b) => b.value - a.value)
            }))
            .sort((a, b) => b.value - a.value);

        const salesByDistributor = new Map<string, number>();
        filteredOrders.forEach(order => {
            const distName = distributorMap.get(order.distributorId)?.name;
            if (distName) {
                salesByDistributor.set(distName, (salesByDistributor.get(distName) || 0) + order.totalAmount);
            }
        });

        const salesByDistributorData = Array.from(salesByDistributor.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);


        return { totalSalesValue, distributorSales, totalPaidQty, totalFreeQty, productSalesSummary, salesTotals, filteredOrders, filteredOrderItems, salesTrendData, topProductsData, salesByStateData, salesByDistributorData };
    }, [orders, allOrderItems, distributors, skus, schemes, dateRange, selectedDistributorId, selectedState, selectedArea, selectedSchemeId, chartGranularity]);
    
    const { items: sortedProductSummary, requestSort: requestProductSort, sortConfig: productSortConfig } = useSortableData(salesData.productSalesSummary, { key: 'total', direction: 'descending' });
    const { items: sortedDistributorSales, requestSort: requestDistributorSalesSort, sortConfig: distributorSalesSortConfig } = useSortableData(salesData.distributorSales, { key: 'amount', direction: 'descending' });

    const formatDateForFilename = (date: Date | null) => date ? date.toISOString().split('T')[0] : '';
    const sanitize = (str: string) => str.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const escapeCsvCell = (cell: any): string => {
        const str = String(cell ?? '');
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    };
    
    const getBaseFilename = () => {
        const distributorName = selectedDistributorId === 'all'
            ? 'All_Distributors'
            : sanitize(distributors.find(d => d.id === selectedDistributorId)?.name || 'Unknown');
        const stateName = selectedState === 'all' ? 'All_States' : sanitize(selectedState);
        const areaName = selectedArea === 'all' ? 'All_Areas' : sanitize(selectedArea);
        const schemeName = selectedSchemeId === 'all'
            ? 'All_Schemes'
            : sanitize(schemes.find(s => s.id === selectedSchemeId)?.description.substring(0, 30) || 'Unknown_Scheme');

        return `sales_${formatDateForFilename(dateRange.from)}_to_${formatDateForFilename(dateRange.to)}_${distributorName}_${stateName}_${areaName}_${schemeName}`;
    }

    const triggerCsvDownload = (content: string, filename: string) => {
         const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
    
    const handleExportDetailedCsv = () => {
        if (loading) return;

        const { filteredOrders, filteredOrderItems } = salesData;

        const skuMap = new Map(skus.map(s => [s.id, s]));
        const distributorMap = new Map(distributors.map(d => [d.id, d]));

        const filename = `detailed_report_${getBaseFilename()}.csv`;
        
        const filterSummary = [
            ['Sales Report Filters'],
            ['Date Range', `${dateRange.from ? formatDateForFilename(dateRange.from) : 'N/A'} to ${dateRange.to ? formatDateForFilename(dateRange.to) : 'N/A'}`],
            ['State', selectedState],
            ['Area', selectedArea],
            ['Distributor', distributors.find(d => d.id === selectedDistributorId)?.name || 'All'],
            ['Scheme', schemes.find(s => s.id === selectedSchemeId)?.description || 'All'],
            []
        ].map(row => row.map(escapeCsvCell).join(',')).join('\n');

        const headers = [
            'Order ID', 'Order Date', 'Distributor ID', 'Distributor Name', 'State', 'Area',
            'SKU ID', 'Product Name', 'Item Type', 'Quantity', 'Base Price',
            'Unit Price', 'Total Amount'
        ];

        const rows = filteredOrderItems.map(item => {
            const order = filteredOrders.find(o => o.id === item.orderId);
            if (!order) return null;

            const distributor = distributorMap.get(order.distributorId);
            const sku = skuMap.get(item.skuId);
            const skuName = sku ? sku.name : 'Unknown SKU';
            const basePrice = sku ? sku.price : 0;

            return [
                order.id,
                new Date(order.date).toLocaleDateString(),
                order.distributorId,
                distributor?.name || 'Unknown',
                distributor?.state || '',
                distributor?.area || '',
                item.skuId,
                skuName,
                item.isFreebie ? 'Free' : 'Paid',
                item.quantity,
                basePrice,
                item.unitPrice,
                item.quantity * item.unitPrice
            ].map(escapeCsvCell);
        }).filter((row): row is string[] => row !== null);

        const csvContent = filterSummary + '\n' + [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
        triggerCsvDownload(csvContent, filename);
    };

    const handleExportTableCsv = () => {
        const { salesTotals } = salesData;
        
        const filename = `summary_report_${getBaseFilename()}.csv`;
        
        const headers: string[] = ['Distributor'];
        PRODUCT_ORDER.forEach(name => {
            headers.push(name);
            headers.push(`${name} free`);
        });
        headers.push('Amount');

        const rows = sortedDistributorSales.map(sale => {
            const row: (string | number)[] = [sale.distributorName];
            PRODUCT_ORDER.forEach(name => {
                row.push(sale[name] || 0);
                row.push(sale[`${name} free`] || 0);
            });
            row.push(sale.amount);
            return row.map(escapeCsvCell);
        });

        const totalRow: (string | number)[] = ['Total'];
        PRODUCT_ORDER.forEach(name => {
            totalRow.push(salesTotals[name] || 0);
            totalRow.push(salesTotals[`${name} free`] || 0);
        });
        totalRow.push(salesTotals.amount);
        rows.push(totalRow.map(escapeCsvCell));

        const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
        triggerCsvDownload(csvContent, filename);
    };


    if (loading) {
        return <div className="text-center p-8">Loading sales data...</div>;
    }

    return (
        <div className="space-y-6">
            <Card>
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4">
                    <h2 className="text-xl font-bold">Sales Report Filters</h2>
                     <Button onClick={handleExportDetailedCsv} variant="secondary">
                        <Download size={16}/>
                        Export Detailed CSV
                    </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                    <DateRangePicker 
                        label="Select Date Range"
                        value={dateRange}
                        onChange={setDateRange}
                    />
                     <Select label="Filter by State" value={selectedState} onChange={handleStateChange}>
                        <option value="all">All States</option>
                        {uniqueStates.map(s => <option key={s} value={s}>{s}</option>)}
                    </Select>
                    <Select label="Filter by Area" value={selectedArea} onChange={e => setSelectedArea(e.target.value)}>
                        <option value="all">All Areas</option>
                        {availableAreas.map(a => <option key={a} value={a}>{a}</option>)}
                    </Select>
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
                     <Select label="Filter by Scheme" value={selectedSchemeId} onChange={e => setSelectedSchemeId(e.target.value)}>
                        <option value="all">All Schemes</option>
                        {schemes.map(s => <option key={s.id} value={s.id}>{s.description}</option>)}
                    </Select>
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Total Sales Value" value={formatIndianCurrency(salesData.totalSalesValue)} icon={<DollarSign />} />
                <StatCard title="Total Paid Items" value={formatIndianNumber(salesData.totalPaidQty)} icon={<Package />} />
                <StatCard title="Total Free Items" value={formatIndianNumber(salesData.totalFreeQty)} icon={<Gift />} />
            </div>
            
            <Card>
                <h3 className="text-lg font-semibold mb-4 text-text-primary">Sales Visualizations</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
                    <div>
                        <div className="flex justify-center items-center mb-2 gap-4">
                            <h4 className="font-semibold text-center text-text-secondary">Sales Trend</h4>
                            <div className="flex gap-1 p-0.5 bg-background rounded-md border border-border">
                                {(['daily', 'monthly', 'quarterly', 'yearly'] as ChartGranularity[]).map(gran => (
                                    <button
                                        key={gran}
                                        onClick={() => setChartGranularity(gran)}
                                        className={`px-2 py-0.5 text-xs rounded-md capitalize transition-colors ${chartGranularity === gran ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:bg-slate-200'}`}
                                    >
                                        {gran}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {salesData.salesTrendData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={salesData.salesTrendData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => formatIndianCurrencyShort(Number(value))} />
                                    <Tooltip content={<CustomSalesTooltip />} cursor={{ fill: '#f8f9fa' }} />
                                    <Line type="monotone" dataKey="sales" stroke="var(--color-primary)" strokeWidth={2} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6, fill: 'var(--color-primary)' }} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : <div className="flex items-center justify-center h-[300px] bg-background rounded-md text-text-secondary">No sales data for trend chart.</div>}
                    </div>
                     <div>
                        <div className="flex justify-center items-center mb-2 gap-4">
                            <h4 className="font-semibold text-center text-text-secondary">Top Selling Products</h4>
                            <div className="flex gap-1 p-0.5 bg-background rounded-md border border-border">
                                <button onClick={() => setTopProductsCount(5)} className={`px-2 py-0.5 text-xs rounded-md transition-colors ${topProductsCount === 5 ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:bg-slate-200'}`}>Top 5</button>
                                <button onClick={() => setTopProductsCount(10)} className={`px-2 py-0.5 text-xs rounded-md transition-colors ${topProductsCount === 10 ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:bg-slate-200'}`}>Top 10</button>
                            </div>
                        </div>
                         {salesData.topProductsData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <RechartsBarChart data={salesData.topProductsData.slice(0, topProductsCount).reverse()} layout="vertical" margin={{ top: 5, right: 30, left: 50, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis type="category" dataKey="skuName" width={100} fontSize={12} tickLine={false} axisLine={false} interval={0} />
                                    <Tooltip formatter={(value) => formatIndianNumber(Number(value))} cursor={{fill: '#f8f9fa'}} />
                                    <Legend wrapperStyle={{fontSize: "12px"}}/>
                                    <Bar dataKey="paid" name="Paid" stackId="a" fill="var(--color-primary)" barSize={20} />
                                    <Bar dataKey="free" name="Free" stackId="a" fill="#82ca9d" barSize={20} />
                                </RechartsBarChart>
                            </ResponsiveContainer>
                        ) : <div className="flex items-center justify-center h-[300px] bg-background rounded-md text-text-secondary">No product data for chart.</div>}
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8 pt-8 border-t border-border">
                    <div>
                        <h4 className="font-semibold text-center text-text-secondary mb-2">Sales by State</h4>
                         {salesData.salesByStateData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <RechartsBarChart data={salesData.salesByStateData.slice(0, 10).reverse()} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => formatIndianCurrencyShort(Number(value))} />
                                    <YAxis type="category" dataKey="name" width={80} fontSize={12} tickLine={false} axisLine={false} interval={0} />
                                    <Tooltip content={<CustomStateTooltip />} cursor={{fill: '#f8f9fa'}}/>
                                    <Bar dataKey="value" name="Sales" fill="#FFBB28" barSize={20} />
                                </RechartsBarChart>
                            </ResponsiveContainer>
                        ) : <div className="flex items-center justify-center h-[300px] bg-background rounded-md text-text-secondary">No data for state sales chart.</div>}
                    </div>
                     <div>
                        <h4 className="font-semibold text-center text-text-secondary mb-2">Top 10 Distributors by Sales</h4>
                         {salesData.salesByDistributorData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <RechartsBarChart data={salesData.salesByDistributorData.slice(0, 10)} margin={{ top: 5, right: 20, left: -10, bottom: 65 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} height={70} fontSize={10} />
                                    <YAxis fontSize={12} tickFormatter={(value) => formatIndianCurrencyShort(Number(value))} />
                                    <Tooltip formatter={(value) => [formatIndianCurrency(Number(value)), 'Sales']} />
                                    <Bar dataKey="value" name="Sales" fill="#8884d8" />
                                </RechartsBarChart>
                            </ResponsiveContainer>
                        ) : <div className="flex items-center justify-center h-[300px] bg-background rounded-md text-text-secondary">No distributor data for chart.</div>}
                    </div>
                </div>
            </Card>

            <Card>
                <h3 className="flex items-center text-lg font-semibold mb-4 text-text-primary">
                    <BarChart size={20} className="mr-2"/>
                    Total Quantity Sold Per Product
                </h3>
                <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-left min-w-[400px] text-sm">
                        <thead className="bg-slate-50 sticky top-0">
                            <tr>
                                <SortableTableHeader label="Product" sortKey="skuName" requestSort={requestProductSort} sortConfig={productSortConfig} />
                                <SortableTableHeader label="Total Quantity Sold" sortKey="total" requestSort={requestProductSort} sortConfig={productSortConfig} className="text-right" />
                            </tr>
                        </thead>
                        <tbody>
                            {sortedProductSummary.map((product, index) => (
                                <tr key={index} className="border-b border-border last:border-b-0 hover:bg-slate-50">
                                    <td className="p-3 font-medium text-text-primary">{product.skuName}</td>
                                    <td className="p-3 text-right font-semibold">{formatIndianNumber(product.total)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {sortedProductSummary.length === 0 && (
                        <div className="text-center p-6 text-text-secondary">
                            <p>No products sold in the selected period.</p>
                        </div>
                    )}
                </div>
            </Card>

            <Card>
                 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                    <h3 className="text-lg font-semibold text-text-primary">Distributor Sales Details</h3>
                    <Button onClick={handleExportTableCsv} variant="secondary" size="sm">
                        <Table size={16}/>
                        Export Table
                    </Button>
                </div>
                <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-left min-w-[1200px] text-sm">
                        <thead className="bg-slate-50 sticky top-0">
                            <tr>
                                <SortableTableHeader label="Distributor" sortKey="distributorName" requestSort={requestDistributorSalesSort as any} sortConfig={distributorSalesSortConfig} className="whitespace-nowrap"/>
                                {PRODUCT_ORDER.map(name => (
                                    <React.Fragment key={name}>
                                        <SortableTableHeader label={name} sortKey={name as any} requestSort={requestDistributorSalesSort} sortConfig={distributorSalesSortConfig} className="text-center whitespace-nowrap" />
                                        <th className="p-3 font-semibold text-text-secondary text-center whitespace-nowrap bg-green-100">{name} Free</th>
                                    </React.Fragment>
                                ))}
                                <SortableTableHeader label="Amount" sortKey="amount" requestSort={requestDistributorSalesSort as any} sortConfig={distributorSalesSortConfig} className="text-right whitespace-nowrap" />
                            </tr>
                        </thead>
                        <tbody>
                            {sortedDistributorSales.map((sale: any, index: number) => (
                                <tr key={index} className="border-b border-border last:border-b-0 hover:bg-slate-50">
                                    <td className="p-3 font-medium text-text-primary whitespace-nowrap">{sale.distributorName}</td>
                                    {PRODUCT_ORDER.map(name => (
                                        <React.Fragment key={name}>
                                            <td className="p-3 text-center font-semibold">{sale[name] ? formatIndianNumber(sale[name]) : '-'}</td>
                                            <td className="p-3 text-center font-semibold text-green-700 bg-green-100">{sale[`${name} free`] ? formatIndianNumber(sale[`${name} free`]) : '-'}</td>
                                        </React.Fragment>
                                    ))}
                                    <td className="p-3 text-right font-bold">{formatIndianCurrency(sale.amount)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-slate-100 border-t-2 border-border">
                            <tr className="font-bold text-text-primary">
                                <td className="p-3 whitespace-nowrap">Total</td>
                                {PRODUCT_ORDER.map(name => (
                                    <React.Fragment key={name}>
                                        <td className="p-3 text-center whitespace-nowrap">{formatIndianNumber(salesData.salesTotals[name])}</td>
                                        <td className="p-3 text-center whitespace-nowrap bg-green-100 text-green-800">{formatIndianNumber(salesData.salesTotals[`${name} free`])}</td>
                                    </React.Fragment>
                                ))}
                                <td className="p-3 text-right whitespace-nowrap">{formatIndianCurrency(salesData.salesTotals.amount)}</td>
                            </tr>
                        </tfoot>
                    </table>
                    {sortedDistributorSales.length === 0 && (
                        <div className="text-center p-6 text-text-secondary">
                            <p>No sales recorded for the selected period and filter.</p>
                        </div>
                    )}
                </div>
            </Card>
            
        </div>
    );
};

export default SalesPage;