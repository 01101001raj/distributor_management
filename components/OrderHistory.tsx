import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Card from './common/Card';
import Button from './common/Button';
import { api } from '../services/mockApiService';
import { Order, Distributor, EnrichedOrderItem, OrderStatus } from '../types';
import { ChevronDown, ChevronRight, Gift, Edit, CheckCircle, XCircle, Search, FileText } from 'lucide-react';
import EditOrderModal from './EditOrderModal';
import { useAuth } from '../hooks/useAuth';
import Input from './common/Input';
import Select from './common/Select';
import { formatIndianCurrency } from '../utils/formatting';
import { useSortableData } from '../hooks/useSortableData';
import SortableTableHeader from './common/SortableTableHeader';
import { Link } from 'react-router-dom';

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

  const getDistributorName = useCallback((id: string) => distributors.find(d => d.id === id)?.name || 'Unknown', [distributors]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [orderData, distributorData] = await Promise.all([
        api.getOrders(),
        api.getDistributors(),
      ]);
      setOrders(orderData);
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

  const toggleExpand = (orderId: string) => {
    if (updatingOrderId) return;
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };
  
  const filteredOrders = useMemo(() => {
    return orders
      .map(order => ({
        ...order,
        distributorName: getDistributorName(order.distributorId),
      }))
      .filter(order => {
        const search = searchTerm.toLowerCase().trim();
        const matchesSearch = order.id.toLowerCase().includes(search) || order.distributorName.toLowerCase().includes(search);
        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
        return matchesSearch && matchesStatus;
      });
  }, [orders, searchTerm, statusFilter, getDistributorName]);

  const { items: sortedOrders, requestSort, sortConfig } = useSortableData(filteredOrders, { key: 'date', direction: 'descending' });
  
  if (loading && orders.length === 0) {
    return <div className="text-center p-8">Loading order history...</div>;
  }
  
  const getStatusChip = (status: OrderStatus) => {
      const baseClasses = "px-2.5 py-1 text-xs font-semibold rounded-full inline-block";
      if (status === OrderStatus.DELIVERED) {
          return <span className={`${baseClasses} bg-green-100 text-green-700`}>{status}</span>;
      }
      return <span className={`${baseClasses} bg-yellow-100 text-yellow-700`}>{status}</span>;
  }
  
  return (
    <>
      {statusMessage && (
        <div className={`mb-4 flex items-center p-3 rounded-lg text-sm ${statusMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
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
                        icon={<Search size={16} />}
                    />
                </div>
            </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[700px] text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-3 w-12"></th>
                <SortableTableHeader label="Order ID" sortKey="id" requestSort={requestSort} sortConfig={sortConfig} />
                <SortableTableHeader label="Distributor" sortKey="distributorName" requestSort={requestSort} sortConfig={sortConfig} />
                <SortableTableHeader label="Date" sortKey="date" requestSort={requestSort} sortConfig={sortConfig} />
                <SortableTableHeader label="Status" sortKey="status" requestSort={requestSort} sortConfig={sortConfig} />
                <SortableTableHeader label="Total Amount" sortKey="totalAmount" requestSort={requestSort} sortConfig={sortConfig} />
                <th className="p-3 font-semibold text-text-secondary">Invoice</th>
                <th className="p-3 font-semibold text-text-secondary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedOrders.map(order => (
                <React.Fragment key={order.id}>
                  <tr className="border-b border-border last:border-b-0">
                    <td className="p-3 text-center">
                      <button onClick={() => toggleExpand(order.id)} className="hover:bg-slate-100 rounded-full p-1 disabled:opacity-50" disabled={!!updatingOrderId}>
                        {expandedOrderId === order.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </button>
                    </td>
                    <td className="p-3 font-mono text-xs">{order.id}</td>
                    <td className="p-3 font-medium">{order.distributorName}</td>
                    <td className="p-3">{new Date(order.date).toLocaleDateString()}</td>
                    <td className="p-3">{getStatusChip(order.status)}</td>
                    <td className="p-3 font-semibold">{formatIndianCurrency(order.totalAmount)}</td>
                    <td className="p-3">
                        <Link to={`/invoice/${order.id}`} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="secondary"><FileText size={14}/> View</Button>
                        </Link>
                    </td>
                    <td className="p-3">
                        {order.status === OrderStatus.PENDING && (
                            <div className="flex gap-2">
                                <Button size="sm" variant="secondary" onClick={() => setEditingOrder(order)} disabled={!!updatingOrderId}><Edit size={14}/> Edit</Button>
                                <Button size="sm" variant="primary" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleMarkDelivered(order.id)} isLoading={updatingOrderId === order.id} disabled={!!updatingOrderId}><CheckCircle size={14}/> Deliver</Button>
                            </div>
                        )}
                    </td>
                  </tr>
                  {expandedOrderId === order.id && (
                    <tr className="bg-slate-50">
                      <td colSpan={8} className="p-0">
                        <div className="p-4">
                          <OrderDetails orderId={order.id} />
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
          {loading && orders.length === 0 ? null : (
              sortedOrders.length === 0 ? (
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

    if (loading) return <div className="p-2 text-sm">Loading items...</div>

    return (
        <div className="bg-card p-4 rounded-lg border border-border">
            <h4 className="font-bold mb-2 text-text-primary">Order Items</h4>
            <div className="overflow-x-auto">
                <table className="w-full bg-white rounded-md min-w-[400px] text-sm">
                    <thead>
                        <tr className="text-left border-b border-border">
                            <th className="p-2 font-semibold text-text-secondary">Product</th>
                            <th className="p-2 font-semibold text-text-secondary text-center">Quantity</th>
                            <th className="p-2 font-semibold text-text-secondary text-right">Unit Price</th>
                            <th className="p-2 font-semibold text-text-secondary text-right">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, index) => (
                            <tr key={index} className={`border-b border-border last:border-none ${item.isFreebie ? 'bg-green-50' : ''}`}>
                                <td className="p-2">{item.skuName} {item.isFreebie && <Gift size={12} className="inline ml-1 text-green-700"/>}</td>
                                <td className="p-2 text-center">{item.quantity}</td>
                                <td className="p-2 text-right">{formatIndianCurrency(item.unitPrice)}</td>
                                <td className="p-2 font-semibold text-right">{formatIndianCurrency(item.quantity * item.unitPrice)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default OrderHistory;