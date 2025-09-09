import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/mockApiService';
import { Distributor, Order, OrderStatus } from '../types';
import Card from './common/Card';
import { DollarSign, Search, Users, Package } from 'lucide-react';
import Input from './common/Input';

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

  const filteredDistributors = distributors.filter(d =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.area.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const distributorFinancials = useMemo(() => {
    return distributors.map(distributor => {
        const pendingOrderTotal = orders
            .filter(order => order.distributorId === distributor.id && order.status === OrderStatus.PENDING)
            .reduce((sum, order) => sum + order.totalAmount, 0);
        return {
            ...distributor,
            pendingOrderTotal,
        };
    }).sort((a, b) => a.walletBalance - b.walletBalance);
  }, [distributors, orders]);


  if (loading) {
    return <div className="flex justify-center items-center h-full"><p>Loading dashboard...</p></div>;
  }
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-primary mr-4">
              <DollarSign />
            </div>
            <div>
              <p className="text-sm font-medium text-text-secondary">Total Sales (Delivered)</p>
              <p className="text-2xl font-bold">₹{totalSales.toLocaleString()}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
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
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600 mr-4">
              <Package />
            </div>
            <div>
              <p className="text-sm font-medium text-text-secondary">Pending Orders</p>
              <p className="text-2xl font-bold">{pendingOrders}</p>
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
                icon={<Search size={16} className="text-text-secondary" />}
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[600px]">
              <thead className="bg-background">
                <tr className="border-b border-border">
                  <th className="p-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Unique ID</th>
                  <th className="p-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Firm Name</th>
                  <th className="p-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">State</th>
                  <th className="p-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Area</th>
                </tr>
              </thead>
              <tbody>
                {filteredDistributors.map(d => (
                  <tr key={d.id} onClick={() => navigate(`/distributors/${d.id}`)} className="border-b border-border last:border-b-0 hover:bg-background cursor-pointer">
                    <td className="p-3 font-mono text-xs text-text-secondary">{d.id}</td>
                    <td className="p-3 font-medium text-text-primary">{d.name}</td>
                    <td className="p-3 text-text-primary">{d.state}</td>
                    <td className="p-3 text-text-primary">{d.area}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredDistributors.length === 0 && (
              <div className="text-center p-6 text-text-secondary">
                <p>No distributors found for "{searchTerm}".</p>
              </div>
            )}
          </div>
        </Card>
        <Card>
           <h3 className="text-lg font-semibold text-text-primary mb-4">Distributor Financials</h3>
           <div className="overflow-x-auto max-h-[400px]">
                <table className="w-full text-left">
                    <thead className="bg-background sticky top-0">
                        <tr className="border-b border-border">
                            <th className="p-2 text-xs font-semibold text-text-secondary uppercase tracking-wider">Distributor</th>
                            <th className="p-2 text-xs font-semibold text-text-secondary uppercase tracking-wider text-right">Balance</th>
                            <th className="p-2 text-xs font-semibold text-text-secondary uppercase tracking-wider text-right">Pending Orders</th>
                        </tr>
                    </thead>
                     <tbody>
                        {distributorFinancials.map(d => {
                            return (
                                <tr key={d.id} className="border-b border-border last:border-b-0 hover:bg-background cursor-pointer" onClick={() => navigate(`/distributors/${d.id}`)}>
                                    <td className="p-2">
                                        <p className="font-medium text-sm text-text-primary">{d.name}</p>
                                        <p className="font-mono text-xs text-text-secondary">{d.id}</p>
                                    </td>
                                    <td className="p-2 text-right">
                                        <p className="font-semibold text-text-primary">₹{d.walletBalance.toLocaleString()}</p>
                                    </td>
                                    <td className="p-2 text-right">
                                        <p className="text-text-secondary">₹{d.pendingOrderTotal.toLocaleString()}</p>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
           </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;