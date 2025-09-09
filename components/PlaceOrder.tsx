import React, { useState, useEffect, useMemo } from 'react';
import { Distributor, SKU, Scheme, SpecialPrice } from '../types';
import { api } from '../services/mockApiService';
import Card from './common/Card';
import Select from './common/Select';
import Button from './common/Button';
import { useAuth } from '../hooks/useAuth';
import { PlusCircle, Trash2, CheckCircle, XCircle, Gift, Star, FileText } from 'lucide-react';

interface OrderItemState {
  id: string; // to track items for updates
  skuId: string;
  quantity: number;
}

interface DisplayItem {
    skuId: string;
    skuName: string;
    quantity: number;
    unitPrice: number;
    isFreebie: boolean;
    schemeSource?: string;
    hasSpecialPrice: boolean;
}

interface StatusMessage {
    type: 'success' | 'error';
    text: string;
    orderId?: string;
}

const PlaceOrder: React.FC = () => {
  const { currentUser } = useAuth();
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [skus, setSkus] = useState<SKU[]>([]);
  const [globalSchemes, setGlobalSchemes] = useState<Scheme[]>([]);
  
  const [selectedDistributorId, setSelectedDistributorId] = useState<string>('');
  const [distributorSchemes, setDistributorSchemes] = useState<Scheme[]>([]);
  const [distributorPrices, setDistributorPrices] = useState<SpecialPrice[]>([]);

  const [orderItems, setOrderItems] = useState<OrderItemState[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);

  const selectedDistributor = distributors.find(d => d.id === selectedDistributorId);

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      const [distributorData, skuData, globalSchemeData] = await Promise.all([
        api.getDistributors(),
        api.getSKUs(),
        api.getGlobalSchemes(),
      ]);
      setDistributors(distributorData);
      setSkus(skuData);
      setGlobalSchemes(globalSchemeData);
      setIsLoading(false);
    };
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedDistributorId) {
        const fetchDistributorData = async () => {
            const [schemes, prices] = await Promise.all([
                api.getSchemesByDistributor(selectedDistributorId),
                api.getSpecialPricesByDistributor(selectedDistributorId),
            ]);
            setDistributorSchemes(schemes);
            setDistributorPrices(prices);
        };
        fetchDistributorData();
    } else {
        setDistributorSchemes([]);
        setDistributorPrices([]);
    }
  }, [selectedDistributorId]);
  
  const { displayItems, subtotal } = useMemo(() => {
    let currentSubtotal = 0;
    const itemsToDisplay: DisplayItem[] = [];
    const freebies = new Map<string, { quantity: number; source: string }>();

    const today = new Date().toISOString().split('T')[0];
    const activeSpecialPrices = distributorPrices.filter(p => p.startDate <= today && p.endDate >= today);
    const applicableSchemes = [...distributorSchemes, ...globalSchemes];

    // Calculate paid items and their prices
    orderItems.forEach(item => {
        const sku = skus.find(s => s.id === item.skuId);
        if (!sku || item.quantity <= 0) return;

        const specialPrice = activeSpecialPrices.find(p => p.skuId === item.skuId);
        const unitPrice = specialPrice ? specialPrice.price : sku.price;
        currentSubtotal += item.quantity * unitPrice;

        itemsToDisplay.push({
            skuId: sku.id,
            skuName: sku.name,
            quantity: item.quantity,
            unitPrice,
            isFreebie: false,
            hasSpecialPrice: !!specialPrice,
        });
    });

    // Calculate freebies from schemes
    applicableSchemes.forEach(scheme => {
        const buyItem = orderItems.find(oi => oi.skuId === scheme.buySkuId);
        if (buyItem && buyItem.quantity > 0) {
            const timesApplied = Math.floor(buyItem.quantity / scheme.buyQuantity);
            if (timesApplied > 0) {
                const totalFree = timesApplied * scheme.getQuantity;
                const existing = freebies.get(scheme.getSkuId) || { quantity: 0, source: scheme.description };
                freebies.set(scheme.getSkuId, { quantity: existing.quantity + totalFree, source: scheme.description });
            }
        }
    });
    
    // Add freebies to display list
    freebies.forEach((data, skuId) => {
        const sku = skus.find(s => s.id === skuId);
        if (sku) {
            itemsToDisplay.push({
                skuId: sku.id,
                skuName: sku.name,
                quantity: data.quantity,
                unitPrice: 0,
                isFreebie: true,
                schemeSource: data.source,
                hasSpecialPrice: false,
            });
        }
    });

    return { displayItems: itemsToDisplay, subtotal: currentSubtotal };
  }, [orderItems, skus, globalSchemes, distributorSchemes, distributorPrices]);


  const handleAddSku = () => {
    if (skus.length > 0) {
      const firstSku = skus[0];
       setOrderItems([...orderItems, { id: Date.now().toString(), skuId: firstSku.id, quantity: 1 }]);
    }
  };

  const handleItemChange = (itemId: string, field: 'skuId' | 'quantity', value: string | number) => {
      const newItems = orderItems.map(item => {
          if (item.id === itemId) {
              return { ...item, [field]: value };
          }
          return item;
      });
      setOrderItems(newItems);
  };

  const handleRemoveItem = (itemId: string) => {
    setOrderItems(orderItems.filter((item) => item.id !== itemId));
  };
  
  const handleViewInvoice = (orderId: string) => {
      window.open(`/#/invoice/${orderId}`, '_blank');
  };

  const handleSubmit = async () => {
    if (!selectedDistributorId || orderItems.length === 0) {
      setStatusMessage({ type: 'error', text: 'Please select a distributor and add items to the order.'});
      return;
    }
    
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const itemsToSubmit = orderItems.map(({ skuId, quantity }) => ({ skuId, quantity }));
      const newOrder = await api.placeOrder(selectedDistributorId, itemsToSubmit, currentUser!.username);
      setStatusMessage({ 
          type: 'success', 
          text: `Order placed successfully for ${selectedDistributor?.name}!`,
          orderId: newOrder.id,
      });
      
      const updatedDistributors = await api.getDistributors();
      setDistributors(updatedDistributors);
      
      setSelectedDistributorId('');
      setOrderItems([]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      setStatusMessage({ type: 'error', text: `Failed to place order: ${errorMessage}` });
    } finally {
      setIsLoading(false);
    }
  };

  if (currentUser?.role === 'User') {
    return <Card className="text-center"><p className="text-text-secondary">You do not have permission to place orders.</p></Card>;
  }
  
  const availableCredit = selectedDistributor ? selectedDistributor.creditLimit - selectedDistributor.creditUsed : 0;
  const totalAvailableForOrder = selectedDistributor ? selectedDistributor.walletBalance + availableCredit : 0;

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-xl font-bold mb-4">Place New Order</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <Select id="distributor" label="Select Distributor" value={selectedDistributorId} onChange={e => setSelectedDistributorId(e.target.value)} disabled={isLoading}>
            <option value="">-- Choose Distributor --</option>
            {distributors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </Select>
          {selectedDistributor && (
            <div className="border border-blue-200 rounded-lg p-4 grid grid-cols-2 gap-x-6 gap-y-4 bg-blue-50/50">
                <div>
                    <p className="text-xs text-text-secondary">Wallet Balance</p>
                    <p className="text-lg font-bold text-black">₹{selectedDistributor.walletBalance.toLocaleString()}</p>
                </div>
                <div>
                    <p className="text-xs text-text-secondary">Available Credit</p>
                    <p className="text-lg font-bold text-black">₹{availableCredit.toLocaleString()}</p>
                </div>
                <div className="col-span-2">
                    <p className="text-xs text-text-secondary">Credit Usage</p>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                        <div className="bg-orange-500 h-2.5 rounded-full" style={{ width: `${(selectedDistributor.creditUsed / selectedDistributor.creditLimit) * 100}%` }}></div>
                    </div>
                    <p className="text-xs text-right text-text-secondary mt-1">
                        ₹{selectedDistributor.creditUsed.toLocaleString()} used of ₹{selectedDistributor.creditLimit.toLocaleString()}
                    </p>
                </div>
                <div className="col-span-2 mt-2 pt-2 border-t border-blue-200">
                    <p className="text-sm font-semibold text-text-primary text-center">Total Available for Order</p>
                    <p className="text-xl font-bold text-black text-center">₹{totalAvailableForOrder.toLocaleString()}</p>
                </div>
            </div>
          )}
        </div>
      </Card>

      {selectedDistributorId && (
        <Card>
          <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Order Items</h3>
              <Button onClick={handleAddSku} variant="secondary" size="sm"><PlusCircle size={16} className="mr-2"/> Add Item</Button>
          </div>
          <div className="space-y-2">
            {orderItems.map((item, index) => (
              <div key={item.id} className="grid grid-cols-12 gap-2 items-center p-2 rounded-md bg-gray-50">
                <div className="col-span-8">
                  {/* FIX: Corrected typo in function call from handleItemchange to handleItemChange. */}
                  <Select id={`sku-${index}`} label="" value={item.skuId} onChange={(e) => handleItemChange(item.id, 'skuId', e.target.value)} className="text-sm">
                    {skus.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </Select>
                </div>
                <div className="col-span-3">
                    <input type="number" value={item.quantity} onChange={(e) => handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 0)} className="w-full p-2 border rounded-md" min="1"/>
                </div>
                <div className="col-span-1 text-right">
                  <button onClick={() => handleRemoveItem(item.id)} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={16}/></button>
                </div>
              </div>
            ))}
          </div>

          {displayItems.length > 0 && (
            <div className="mt-6 pt-4 border-t">
              <h4 className="font-semibold mb-2">Order Summary</h4>
              <table className="w-full">
                <tbody>
                  {displayItems.map((item, index) => (
                    <tr key={index} className={item.isFreebie ? 'bg-green-50' : ''}>
                      <td className="p-2 w-1/2">
                        {item.skuName}
                        {item.isFreebie && <Gift size={12} className="inline ml-2 text-green-600"/>}
                        {item.hasSpecialPrice && <Star size={12} className="inline ml-2 text-yellow-500"/>}
                      </td>
                      <td className="p-2 text-center">{item.quantity}</td>
                      <td className="p-2 text-center">₹{item.unitPrice.toLocaleString()}</td>
                      <td className="p-2 text-right font-semibold">₹{(item.quantity * item.unitPrice).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2">
                    <td colSpan={3} className="p-2 text-right font-bold">Total Amount:</td>
                    <td className="p-2 text-right font-bold text-black text-lg">₹{subtotal.toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
               <p className="text-sm text-red-500 text-right mt-2">{subtotal > totalAvailableForOrder ? "Order exceeds available balance!" : ""}</p>
            </div>
          )}
        </Card>
      )}

      {statusMessage && (
          <div className={`flex items-center justify-between p-3 rounded-md mt-4 ${statusMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              <div className="flex items-center">
                  {statusMessage.type === 'success' ? <CheckCircle className="mr-2" /> : <XCircle className="mr-2" />}
                  {statusMessage.text}
              </div>
              {statusMessage.type === 'success' && statusMessage.orderId && (
                  <Button onClick={() => handleViewInvoice(statusMessage.orderId!)} size="sm" variant="primary" className="bg-green-600 hover:bg-green-700">
                      <FileText size={16} className="mr-2"/> View Invoice
                  </Button>
              )}
          </div>
      )}

      <div className="flex justify-end">
        <Button onClick={handleSubmit} isLoading={isLoading} disabled={!selectedDistributorId || orderItems.length === 0 || subtotal > totalAvailableForOrder || subtotal <= 0}>
          Place Order
        </Button>
      </div>
    </div>
  );
};

export default PlaceOrder;
