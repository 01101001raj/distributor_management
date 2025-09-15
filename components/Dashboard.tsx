import React, { useEffect, useState, useMemo } from 'react';
// FIX: Use namespace import for react-router-dom to resolve export errors.
import * as ReactRouterDOM from 'react-router-dom';
import { api } from '../services/mockApiService';
import { Distributor, Order, OrderStatus } from '../types';
import Card from './common/Card';
import { DollarSign, Search, Users, Package, TrendingUp } from 'lucide-react';
import Input from './common/Input';
import { formatIndianCurrency } from '../utils/formatting';
import { useSortableData } from '../hooks/useSortableData';
import SortableTableHeader from './common/SortableTableHeader';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line } from 'recharts';
import { formatIndianCurrencyShort } from '../utils/formatting';

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; }> = ({ title, value, icon }) => (
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


const Dashboard: React.FC = () => {
  const navigate = ReactRouterDOM.useNavigate();
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [distributorData, orderData] = await Promise.all([
          api.getDistributors(),
          api.getOrders(),
        ]);
        setDistributors(distributorData);
        setOrders(orderData);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const deliveredOrders = useMemo(() => orders.filter(o => o.status === OrderStatus.DELIVERED), [orders]);

  const totalSales = useMemo(() => deliveredOrders.reduce((sum, order) => sum + order.totalAmount, 0), [deliveredOrders]);

  const totalDistributors = distributors.length;
  
  const totalWalletBalance = useMemo(() => distributors.reduce((sum, d) => sum + d.walletBalance, 0), [distributors]);

  const salesTrendData = useMemo(() => {
    const salesByDate = new Map<string, number>();
    deliveredOrders.forEach(order => {
        const date = new Date(order.date).toLocaleDateString('en-CA'); // YYYY-MM-DD
        salesByDate.set(date, (salesByDate.get(date) || 0) + order.totalAmount);
    });
    return Array.from(salesByDate.entries())
        .map(([date, sales]) => ({ date, sales }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-30); // Last 30 days
  }, [deliveredOrders]);

  const filteredDistributors = useMemo(() => distributors.filter(d =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.area.toLowerCase().includes(searchTerm.toLowerCase())
  ), [distributors, searchTerm]);
  
  const { items: sortedDistributors, requestSort: requestDistributorSort, sortConfig: distributorSortConfig } = useSortableData(filteredDistributors, { key: 'name', direction: 'ascending' });


  if (loading) {
    return <div className="flex justify-center items-center h-full"><p>Loading dashboard...</p></div>;
  }
  
  return (
    <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard title="Total Sales" value={formatIndianCurrency(totalSales)} icon={<TrendingUp size={24} />} />
            <StatCard title="Total Wallet Balance" value={formatIndianCurrency(totalWalletBalance)} icon={<DollarSign size={24} />} />
            <StatCard title="Active Distributors" value={totalDistributors.toString()} icon={<Users size={24} />} />
        </div>
        
        <div className="grid grid-cols-1 gap-6">
            <Card>
                <h3 className="text-lg font-semibold mb-4 text-text-primary">Sales Trend (Last 30 Days)</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={salesTrendData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                        <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => formatIndianCurrencyShort(Number(value))} />
                        <Tooltip content={<CustomSalesTooltip />} cursor={{ fill: 'var(--color-background)' }} />
                        <Line type="monotone" dataKey="sales" stroke="var(--color-primary)" strokeWidth={2} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6, fill: 'var(--color-primary)' }} />
                    </LineChart>
                </ResponsiveContainer>
            </Card>

            <Card>
                <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                    <h3 className="text-lg font-semibold text-text-primary">All Distributors</h3>
                    <div className="w-full sm:w-auto sm:max-w-xs">
                    <Input
                        id="search-distributor"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        icon={<Search size={16} />}
                    />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[600px] text-sm">
                    <thead>
                        <tr className="border-b border-border">
                            <SortableTableHeader label="Firm Name" sortKey="name" requestSort={requestDistributorSort} sortConfig={distributorSortConfig} />
                            <SortableTableHeader label="Area" sortKey="area" requestSort={requestDistributorSort} sortConfig={distributorSortConfig} />
                            <SortableTableHeader label="Wallet Balance" sortKey="walletBalance" requestSort={requestDistributorSort} sortConfig={distributorSortConfig} className="text-right" />
                        </tr>
                    </thead>
                    <tbody>
                        {sortedDistributors.map((d) => (
                        <tr key={d.id} onClick={() => navigate(`/distributors/${d.id}`)} className="border-b border-border last:border-b-0 hover:bg-slate-50 cursor-pointer">
                            <td className="p-4 font-medium text-text-primary">{d.name}</td>
                            <td className="p-4 text-text-secondary">{d.area}, {d.state}</td>
                            <td className="p-4 text-text-primary font-semibold text-right">{formatIndianCurrency(d.walletBalance)}</td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                    {sortedDistributors.length === 0 && (
                    <div className="text-center p-6 text-text-secondary">
                        <p>No distributors found for "{searchTerm}".</p>
                    </div>
                    )}
                </div>
            </Card>

        </div>
    </div>
  );
};

export default Dashboard;