import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/mockApiService';
import { Distributor, Order, OrderStatus } from '../types';
import Card from './common/Card';
import { DollarSign, Search, Users, Package, CheckCircle } from 'lucide-react';
import Input from './common/Input';
import { formatIndianCurrency } from '../utils/formatting';
import { useSortableData } from '../hooks/useSortableData';
import SortableTableHeader from './common/SortableTableHeader';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
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

  const totalSales = orders
    .filter(o => o.status === OrderStatus.DELIVERED)
    .reduce((sum, order) => sum + order.totalAmount, 0);

  const totalDistributors = distributors.length;
  
  const pendingOrders = orders.filter(o => o.status === OrderStatus.PENDING).length;
  
  const deliveredOrders = orders.filter(o => o.status === OrderStatus.DELIVERED).length;

  const filteredDistributors = useMemo(() => distributors.filter(d =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.area.toLowerCase().includes(searchTerm.toLowerCase())
  ), [distributors, searchTerm]);
  
  const { items: sortedDistributors, requestSort: requestDistributorSort, sortConfig: distributorSortConfig } = useSortableData(filteredDistributors, { key: 'name', direction: 'ascending' });

  const distributorFinancials = useMemo(() => {
    return distributors.map(distributor => {
        const pendingOrderTotal = orders
            .filter(order => order.distributorId === distributor.id && order.status === OrderStatus.PENDING)
            .reduce((sum, order) => sum + order.totalAmount, 0);
        return {
            ...distributor,
            pendingOrderTotal,
        };
    });
  }, [distributors, orders]);
  
  const { items: sortedFinancials, requestSort: requestFinancialsSort, sortConfig: financialsSortConfig } = useSortableData(distributorFinancials, { key: 'walletBalance', direction: 'ascending' });

  const financialTotals = useMemo(() => {
    return distributorFinancials.reduce(
      (acc, curr) => {
        acc.totalBalance += curr.walletBalance;
        acc.totalPending += curr.pendingOrderTotal;
        return acc;
      },
      { totalBalance: 0, totalPending: 0 }
    );
  }, [distributorFinancials]);


  if (loading) {
    return <div className="flex justify-center items-center h-full"><p>Loading dashboard...</p></div>;
  }
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-primary/10 text-primary mr-4">
              <DollarSign />
            </div>
            <div>
              <p className="text-sm font-medium text-text-secondary">Total Sales (Delivered)</p>
              <p className="text-2xl font-bold">{formatIndianCurrency(totalSales)}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-500/10 text-green-600 mr-4">
              <Users />
            </div>
            <div>
              <p className="text-sm font-medium text-text-secondary">Active Distributors</p>
              <p className="text-2xl font-bold">{totalDistributors}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-500/10 text-yellow-600 mr-4">
              <Package />
            </div>
            <div>
              <p className="text-sm font-medium text-text-secondary">Pending Orders</p>
              <p className="text-2xl font-bold">{pendingOrders}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-500/10 text-blue-600 mr-4">
              <CheckCircle />
            </div>
            <div>
              <p className="text-sm font-medium text-text-secondary">Delivered Orders</p>
              <p className="text-2xl font-bold">{deliveredOrders}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
            <h3 className="text-lg font-semibold text-text-primary">Distributor Details</h3>
            <div className="w-full sm:w-auto sm:max-w-xs">
              <Input
                id="search-distributor"
                placeholder="Search by name, ID, area..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<Search size={16} />}
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[600px] text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <SortableTableHeader label="Unique ID" sortKey="id" requestSort={requestDistributorSort} sortConfig={distributorSortConfig} />
                  <SortableTableHeader label="Firm Name" sortKey="name" requestSort={requestDistributorSort} sortConfig={distributorSortConfig} />
                  <SortableTableHeader label="State" sortKey="state" requestSort={requestDistributorSort} sortConfig={distributorSortConfig} />
                  <SortableTableHeader label="Area" sortKey="area" requestSort={requestDistributorSort} sortConfig={distributorSortConfig} />
                </tr>
              </thead>
              <tbody>
                {sortedDistributors.map(d => (
                  <tr key={d.id} onClick={() => navigate(`/distributors/${d.id}`)} className="border-b border-border last:border-b-0 hover:bg-slate-50 cursor-pointer">
                    <td className="p-3 font-mono text-xs text-text-secondary">{d.id}</td>
                    <td className="p-3 font-semibold text-primary hover:underline">{d.name}</td>
                    <td className="p-3 text-text-primary">{d.state}</td>
                    <td className="p-3 text-text-primary">{d.area}</td>
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
        <Card>
           <h3 className="text-lg font-semibold text-text-primary mb-4">Distributor Financials</h3>
           <div className="overflow-x-auto max-h-[400px]">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 sticky top-0">
                        <tr>
                            <SortableTableHeader label="Distributor" sortKey="name" requestSort={requestFinancialsSort} sortConfig={financialsSortConfig} />
                            <SortableTableHeader label="Balance" sortKey="walletBalance" requestSort={requestFinancialsSort} sortConfig={financialsSortConfig} className="text-right" />
                            <SortableTableHeader label="Pending" sortKey="pendingOrderTotal" requestSort={requestFinancialsSort} sortConfig={financialsSortConfig} className="text-right" />
                        </tr>
                    </thead>
                     <tbody>
                        {sortedFinancials.map(d => {
                            return (
                                <tr key={d.id} className="border-b border-border last:border-b-0 hover:bg-slate-50 cursor-pointer" onClick={() => navigate(`/distributors/${d.id}`)}>
                                    <td className="p-2">
                                        <p className="font-medium text-primary hover:underline truncate">{d.name}</p>
                                        <p className="font-mono text-xs text-text-secondary">{d.id}</p>
                                    </td>
                                    <td className="p-2 text-right">
                                        <p className="font-semibold text-text-primary">{formatIndianCurrency(d.walletBalance)}</p>
                                    </td>
                                    <td className="p-2 text-right">
                                        <p className="text-text-secondary">{formatIndianCurrency(d.pendingOrderTotal)}</p>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                    <tfoot className="bg-slate-50 border-t-2 border-border">
                        <tr className="font-bold">
                            <td className="p-2">Total</td>
                            <td className="p-2 text-right">
                                {formatIndianCurrency(financialTotals.totalBalance)}
                            </td>
                            <td className="p-2 text-right">
                                {formatIndianCurrency(financialTotals.totalPending)}
                            </td>
                        </tr>
                    </tfoot>
                </table>
           </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
