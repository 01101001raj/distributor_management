

import React, { useEffect, useState, useCallback } from 'react';
import Card from './common/Card';
import Button from './common/Button';
import { api } from '../services/mockApiService';
import { Order, Distributor, EnrichedOrderItem, OrderStatus } from '../types';
import { ChevronDown, ChevronRight, Gift, Edit, CheckCircle, XCircle, Search } from 'lucide-react';
import EditOrderModal from './EditOrderModal';
import { useAuth } from '../hooks/useAuth';
import Input from './common/Input';
import Select from './common/Select';

const OrderHistory: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const { currentUser } = useAuth();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [orderData, distributorData] = await Promise.all([
        api.getOrders(),
        api.getDistributors(),
      ]);
      setOrders(orderData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setDistributors(distributorData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleMarkDelivered = async (orderId: string) => {
      if (window.confirm("Are you sure you want to mark this order as delivered? It cannot be edited further.")) {
          if (!currentUser) {
              setStatusMessage({ type: 'error', text: 'You must be logged in to perform this action.' });
              return;
          }
          setStatusMessage(null);
          setUpdatingOrderId(orderId);

          try {
              await api.updateOrderStatus(orderId, OrderStatus.DELIVERED, currentUser.username);
              setStatusMessage({ type: 'success', text: `Order ${orderId} has been marked as delivered.`});
              setTimeout(() => setStatusMessage(null), 4000);
              await fetchData();
          } catch (error) {
              console.error("Failed to update order status:", error);
              setStatusMessage({ type: 'error', text: 'Failed to update order. Please try again.' });
          } finally {
              setUpdatingOrderId(null);
          }
      }
  };

  const getDistributorName = (id: string) => distributors.find(d => d.id === id)?.name || 'Unknown';
  
  const toggleExpand = (orderId: string) => {
    if (updatingOrderId) return;
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };
  
  const filteredOrders = orders.filter(order => {
      const distributorName = getDistributorName(order.distributorId).toLowerCase();
      const search = searchTerm.toLowerCase();
      const matchesSearch = order.id.toLowerCase().includes(search) || distributorName.includes(search);
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      return matchesSearch && matchesStatus;
  });
  
  if (loading && orders.length === 0) {
    return <div className="text-center p-8">Loading order history...</div>;
  }
  
  const getStatusChip = (status: OrderStatus) => {
      const baseClasses = "px-2.5 py-1 text-xs font-medium rounded-full inline-block";
      if (status === OrderStatus.DELIVERED) {
          return <span className={`${baseClasses} bg-green-100 text-green-700`}>{status}</span>;
      }
      return <span className={`${baseClasses} bg-yellow-100 text-yellow-700`}>{status}</span>;
  }
  
  return (
    <>
      {statusMessage && (
        <div className={`mb-4 flex items-center p-3 rounded-lg ${statusMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {statusMessage.type === 'success' ? <CheckCircle className="mr-2" /> : <XCircle className="mr-2" />}
            {statusMessage.text}
        </div>
      )}
      <Card>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
            <h2 className="text-2xl font-bold">Order History</h2>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
                <div className="w-full sm:w-40">
                    <Select
                        id="status-filter"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')}
                    >
                        <option value="all">All Statuses</option>
                        <option value={OrderStatus.PENDING}>Pending</option>
                        <option value={OrderStatus.DELIVERED}>Delivered</option>
                    </Select>
                </div>
                <div className="w-full sm:w-auto sm:max-w-xs">
                    <Input
                        id="search-orders"
                        placeholder="Search by Order ID or Name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        icon={<Search size={16} className="text-text-secondary" />}
                    />
                </div>
            </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[700px]">
            <thead className="bg-background">
              <tr className="border-b border-border">
                <th className="p-3 w-12"></th>
                <th className="p-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Order ID</th>
                <th className="p-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Distributor</th>
                <th className="p-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Date</th>
                <th className="p-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Status</th>
                <th className="p-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Total Amount</th>
                <th className="p-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => (
                <React.Fragment key={order.id}>
                  <tr className="border-b border-border last:border-b-0">
                    <td className="p-3 text-center">
                      <button onClick={() => toggleExpand(order.id)} className="hover:bg-gray-200 rounded-full p-1 disabled:opacity-50" disabled={!!updatingOrderId}>
                        {expandedOrderId === order.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </button>
                    </td>
                    <td className="p-3 font-mono text-xs">{order.id}</td>
                    <td className="p-3 font-medium">{getDistributorName(order.distributorId)}</td>
                    <td className="p-3">{new Date(order.date).toLocaleDateString()}</td>
                    <td className="p-3">{getStatusChip(order.status)}</td>
                    <td className="p-3 font-semibold">₹{order.totalAmount.toLocaleString()}</td>
                    <td className="p-3">
                        {order.status === OrderStatus.PENDING && (
                            <div className="flex gap-2">
                                <Button size="sm" variant="secondary" onClick={() => setEditingOrder(order)} disabled={!!updatingOrderId}><Edit size={14} className="mr-1"/> Edit</Button>
                                <Button size="sm" variant="primary" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleMarkDelivered(order.id)} isLoading={updatingOrderId === order.id} disabled={!!updatingOrderId}><CheckCircle size={14} className="mr-1"/> Deliver</Button>
                            </div>
                        )}
                    </td>
                  </tr>
                  {expandedOrderId === order.id && (
                    <tr className="bg-background">
                      <td colSpan={7} className="p-4">
                        <OrderDetails orderId={order.id} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
          {loading && orders.length === 0 ? null : (
              filteredOrders.length === 0 ? (
                  <p className="text-center p-4 text-text-secondary">
                      {searchTerm || statusFilter !== 'all' ? `No orders found matching your filters.` : "No orders have been placed yet."}
                  </p>
              ) : null
          )}
        </div>
      </Card>
      {editingOrder && (
          <EditOrderModal
              order={editingOrder}
              onClose={() => setEditingOrder(null)}
              onSave={() => {
                  setEditingOrder(null);
                  fetchData(); // Refetch all data to reflect changes
              }}
          />
      )}
    </>
  );
};

const OrderDetails: React.FC<{ orderId: string }> = ({ orderId }) => {
    const [items, setItems] = useState<EnrichedOrderItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getOrderItems(orderId).then(data => {
            setItems(data);
            setLoading(false);
        });
    }, [orderId]);

    if (loading) return <div className="p-2">Loading items...</div>

    return (
        <div className="bg-card p-4 rounded-lg border border-border">
            <h4 className="font-bold mb-2 text-text-primary">Order Items</h4>
            <div className="overflow-x-auto">
                <table className="w-full bg-white rounded-md min-w-[400px]">
                    <thead>
                        <tr className="text-left border-b border-border">
                            <th className="p-2 text-sm text-text-secondary font-medium">Product</th>
                            <th className="p-2 text-sm text-text-secondary font-medium text-center">Quantity</th>
                            <th className="p-2 text-sm text-text-secondary font-medium text-right">Unit Price</th>
                            <th className="p-2 text-sm text-text-secondary font-medium text-right">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, index) => (
                            <tr key={index} className={`border-b border-border last:border-none ${item.isFreebie ? 'bg-green-50' : ''}`}>
                                <td className="p-2">{item.skuName} {item.isFreebie && <Gift size={12} className="inline ml-1 text-green-700"/>}</td>
                                <td className="p-2 text-center">{item.quantity}</td>
                                <td className="p-2 text-right">₹{item.unitPrice.toLocaleString()}</td>
                                <td className="p-2 font-semibold text-right">₹{(item.quantity * item.unitPrice).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default OrderHistory;