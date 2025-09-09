import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/mockApiService';
import { Distributor, Order, UserRole } from '../types';
import Card from './common/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DollarSign, Package, Users, AlertTriangle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

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

  const totalWalletBalance = distributors.reduce((sum, d) => sum + d.walletBalance, 0);
  const totalOrders = orders.length;
  
  const chartData = distributors.map(d => ({
    name: d.name.split(' ')[0],
    Wallet: d.walletBalance,
    'Outstanding Credit': d.creditUsed,
  }));
  
  const highCreditDistributors = distributors.filter(d => 
    d.creditLimit > 0 && (d.creditUsed / d.creditLimit) >= 0.8
  ).sort((a,b) => (b.creditUsed / b.creditLimit) - (a.creditUsed / a.creditLimit));


  if (loading) {
    return <div className="flex justify-center items-center h-full"><p>Loading dashboard...</p></div>;
  }
  
  return (
    <div className="space-y-6">
      {/* High Credit Alert Widget */}
      {userRole !== UserRole.USER && highCreditDistributors.length > 0 && (
        <Card className="bg-orange-50 border border-orange-200">
          <div className="flex items-center mb-4">
            <AlertTriangle className="text-orange-500 mr-3" />
            <h3 className="text-lg font-semibold text-orange-800">High Credit Usage Alerts</h3>
          </div>
          <div className="space-y-3">
            {highCreditDistributors.map(d => {
              const usagePercent = (d.creditUsed / d.creditLimit) * 100;
              return (
                <div 
                  key={d.id} 
                  onClick={() => navigate(`/distributors/${d.id}`)}
                  className="p-3 rounded-lg bg-white hover:shadow-md cursor-pointer transition-shadow"
                >
                  <div className="flex justify-between items-center">
                    <p className="font-semibold text-text-primary">{d.name}</p>
                    <p className="text-sm font-bold text-orange-600">{usagePercent.toFixed(0)}% Used</p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-orange-500 h-2 rounded-full" 
                      style={{ width: `${usagePercent}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-right text-text-secondary mt-1">
                    ₹{d.creditUsed.toLocaleString()} / ₹{d.creditLimit.toLocaleString()}
                  </p>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-black mr-4">
              <DollarSign />
            </div>
            <div>
              <p className="text-sm font-medium text-text-secondary">Total Wallet Balance</p>
              <p className="text-2xl font-bold">₹{totalWalletBalance.toLocaleString()}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-black mr-4">
              <Users />
            </div>
            <div>
              <p className="text-sm font-medium text-text-secondary">Active Distributors</p>
              <p className="text-2xl font-bold">{distributors.length}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-black mr-4">
              <Package />
            </div>
            <div>
              <p className="text-sm font-medium text-text-secondary">Total Orders Placed</p>
              <p className="text-2xl font-bold">{totalOrders}</p>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
            <h3 className="text-lg font-semibold mb-4 text-black">Distributor Balances</h3>
             <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
                  <Legend />
                  <Bar dataKey="Wallet" fill="#22C55E" />
                  <Bar dataKey="Outstanding Credit" fill="#F97316" />
                </BarChart>
            </ResponsiveContainer>
        </Card>
        
        <Card>
          <h3 className="text-lg font-semibold mb-4 text-black">Distributor Financials</h3>
          <div className="overflow-y-auto max-h-80">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b">
                  <th className="py-2 text-black">Name</th>
                  <th className="py-2 text-black">Wallet Balance</th>
                  <th className="py-2 text-black">Outstanding Credit</th>
                </tr>
              </thead>
              <tbody>
                {distributors.map(d => (
                  <tr key={d.id} className="border-b border-gray-100">
                    <td className="py-2 font-medium text-black">{d.name}</td>
                    <td className="py-2 font-semibold text-black">₹{d.walletBalance.toLocaleString()}</td>
                    <td className="py-2 font-semibold text-black">₹{d.creditUsed.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="text-lg font-semibold mb-4 text-black">Distributor Details</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="p-3 text-sm font-semibold text-black">Unique ID</th>
                <th className="p-3 text-sm font-semibold text-black">Firm Name</th>
                <th className="p-3 text-sm font-semibold text-black">State</th>
                <th className="p-3 text-sm font-semibold text-black">Area</th>
                <th className="p-3 text-sm font-semibold text-black">Phone Number</th>
              </tr>
            </thead>
            <tbody>
              {distributors.map(d => (
                <tr key={d.id} onClick={() => navigate(`/distributors/${d.id}`)} className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer">
                  <td className="p-3 font-mono text-xs text-black">{d.id}</td>
                  <td className="p-3 font-medium text-black">{d.name}</td>
                  <td className="p-3 text-black">{d.state}</td>
                  <td className="p-3 text-black">{d.area}</td>
                  <td className="p-3 text-black">{d.phone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;