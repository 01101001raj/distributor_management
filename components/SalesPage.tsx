import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/mockApiService';
import { Order, Distributor, OrderStatus } from '../types';
import Card from './common/Card';
import Select from './common/Select';
import { DollarSign } from 'lucide-react';
import DateRangePicker from './common/DateRangePicker';

const SalesPage: React.FC = () => {
    const getInitialDateRange = () => {
        const to = new Date();
        const from = new Date(to.getFullYear(), to.getMonth(), 1);
        to.setHours(0,0,0,0);
        from.setHours(0,0,0,0);
        return { from, to };
    };
    
    const [orders, setOrders] = useState<Order[]>([]);
    const [distributors, setDistributors] = useState<Distributor[]>([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState(getInitialDateRange());
    const [selectedDistributorId, setSelectedDistributorId] = useState<string>('all');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [orderData, distributorData] = await Promise.all([
                    api.getOrders(),
                    api.getDistributors(),
                ]);
                setOrders(orderData);
                setDistributors(distributorData);
            } catch (error) {
                console.error("Failed to fetch sales data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const { totalSales, salesByDistributor } = useMemo(() => {
        const { from, to } = dateRange;
        if (!from) {
            return { totalSales: 0, salesByDistributor: [] };
        }

        const start = from;
        start.setHours(0, 0, 0, 0);

        const end = to || from; // If 'to' is null, it's a single-day range
        end.setHours(23, 59, 59, 999);

        const filtered = orders.filter(order => {
            if (order.status !== OrderStatus.DELIVERED) return false;
            
            const orderDate = new Date(order.date);
            if (!(orderDate >= start && orderDate <= end)) return false;

            if (selectedDistributorId !== 'all' && order.distributorId !== selectedDistributorId) return false;

            return true;
        });

        const total = filtered.reduce((sum, order) => sum + order.totalAmount, 0);

        const byDistributor = filtered.reduce((acc, order) => {
            if (!acc[order.distributorId]) {
                const distributor = distributors.find(d => d.id === order.distributorId);
                acc[order.distributorId] = {
                    distributorName: distributor?.name || 'Unknown',
                    orderCount: 0,
                    totalAmount: 0,
                };
            }
            acc[order.distributorId].orderCount += 1;
            acc[order.distributorId].totalAmount += order.totalAmount;
            return acc;
        }, {} as Record<string, { distributorName: string, orderCount: number, totalAmount: number }>);
        
        const salesArray = Object.values(byDistributor).sort((a,b) => b.totalAmount - a.totalAmount);

        return { totalSales: total, salesByDistributor: salesArray };
    }, [orders, distributors, dateRange, selectedDistributorId]);
    
    if (loading) {
        return <div className="text-center p-8">Loading sales data...</div>;
    }
    
    const selectedDistributorName = distributors.find(d => d.id === selectedDistributorId)?.name;
    const salesTableTitle = selectedDistributorId === 'all' 
        ? "Sales Breakdown by Distributor" 
        : `Sales for ${selectedDistributorName}`;

    return (
        <div className="space-y-6">
            <Card>
                <h2 className="text-xl font-bold mb-4">Sales Report</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div className="lg:col-span-2">
                       <DateRangePicker 
                            label="Select Date Range"
                            value={dateRange}
                            onChange={(newRange) => setDateRange(newRange)}
                       />
                    </div>
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
                     <div className="bg-background border border-border rounded-xl p-4 flex items-center">
                        <div className="p-3 rounded-full bg-blue-100 text-primary mr-4">
                            <DollarSign />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-text-secondary">Total Sales</p>
                            <p className="text-2xl font-bold">₹{totalSales.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </Card>

            <Card>
                <h3 className="text-lg font-semibold mb-4 text-text-primary">{salesTableTitle}</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[600px]">
                        <thead className="bg-background">
                            <tr className="border-b border-border">
                                <th className="p-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Distributor</th>
                                <th className="p-3 text-xs font-semibold text-text-secondary uppercase tracking-wider text-center">Delivered Orders</th>
                                <th className="p-3 text-xs font-semibold text-text-secondary uppercase tracking-wider text-right">Total Sales</th>
                            </tr>
                        </thead>
                        <tbody>
                            {salesByDistributor.map(sale => (
                                <tr key={sale.distributorName} className="border-b border-border last:border-b-0 hover:bg-background">
                                    <td className="p-3 font-medium text-text-primary">{sale.distributorName}</td>
                                    <td className="p-3 text-center">{sale.orderCount}</td>
                                    <td className="p-3 font-semibold text-right">₹{sale.totalAmount.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {salesByDistributor.length === 0 && (
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