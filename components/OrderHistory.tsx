import React, { useEffect, useState } from 'react';
import Card from './common/Card';
import { api } from '../services/mockApiService';
import { Order, Distributor, EnrichedOrderItem } from '../types';
import { ChevronDown, ChevronRight, Gift } from 'lucide-react';

const OrderHistory: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
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
    };
    fetchData();
  }, []);

  const getDistributorName = (id: string) => distributors.find(d => d.id === id)?.name || 'Unknown';
  
  const toggleExpand = (orderId: string) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };
  
  if (loading) {
    return <div className="text-center p-8">Loading order history...</div>;
  }
  
  return (
    <Card>
      <h2 className="text-2xl font-bold mb-4">Order History</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3"></th>
              <th className="p-3 text-sm font-semibold text-black">Order ID</th>
              <th className="p-3 text-sm font-semibold text-black">Distributor</th>
              <th className="p-3 text-sm font-semibold text-black">Date</th>
              <th className="p-3 text-sm font-semibold text-black">Total Amount</th>
              <th className="p-3 text-sm font-semibold text-black">From Wallet</th>
              <th className="p-3 text-sm font-semibold text-black">From Credit</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <React.Fragment key={order.id}>
                <tr className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => toggleExpand(order.id)}>
                  <td className="p-3 text-center">
                    {expandedOrderId === order.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </td>
                  <td className="p-3 font-mono text-xs">{order.id}</td>
                  <td className="p-3 font-medium">{getDistributorName(order.distributorId)}</td>
                  <td className="p-3">{new Date(order.date).toLocaleDateString()}</td>
                  <td className="p-3 font-semibold">₹{order.totalAmount.toLocaleString()}</td>
                  <td className="p-3 text-black">₹{order.coveredByWallet.toLocaleString()}</td>
                  <td className="p-3 text-black">₹{order.coveredByCredit.toLocaleString()}</td>
                </tr>
                {expandedOrderId === order.id && (
                  <tr className="bg-blue-50/50">
                    <td colSpan={7} className="p-4">
                      <OrderDetails orderId={order.id} />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && <p className="text-center p-4 text-black">No orders have been placed yet.</p>}
      </div>
    </Card>
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
        <div>
            <h4 className="font-bold mb-2 text-black">Order Items</h4>
            <table className="w-full bg-white rounded-md">
                <thead>
                    <tr className="text-left border-b">
                        <th className="p-2">Product</th>
                        <th className="p-2 text-center">Quantity</th>
                        <th className="p-2 text-right">Unit Price</th>
                        <th className="p-2 text-right">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, index) => (
                        <tr key={index} className={`border-b last:border-none ${item.isFreebie ? 'bg-green-50' : ''}`}>
                            <td className="p-2">{item.skuName} {item.isFreebie && <Gift size={12} className="inline ml-1 text-green-700"/>}</td>
                            <td className="p-2 text-center">{item.quantity}</td>
                            <td className="p-2 text-right">₹{item.unitPrice.toLocaleString()}</td>
                            <td className="p-2 font-semibold text-right">₹{(item.quantity * item.unitPrice).toLocaleString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default OrderHistory;