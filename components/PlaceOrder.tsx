import React, { useState, useEffect, useMemo, ChangeEvent } from 'react';
import { Distributor, SKU, Scheme, SpecialPrice } from '../types';
import { api } from '../services/mockApiService';
import Card from './common/Card';
import Select from './common/Select';
import Button from './common/Button';
import { useAuth } from '../hooks/useAuth';
import { PlusCircle, Trash2, CheckCircle, XCircle, Gift, Star, FileText } from 'lucide-react';
// FIX: Use namespace import for react-router-dom to resolve export errors.
import * as ReactRouterDOM from 'react-router-dom';
import { formatIndianCurrency } from '../utils/formatting';
import Input from './common/Input';

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
  const location = ReactRouterDOM.useLocation();
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [skus, setSkus] = useState<SKU[]>([]);
  const [globalSchemes, setGlobalSchemes] = useState<Scheme[]>([]);
  
  const [selectedDistributorId, setSelectedDistributorId] = useState<string>('');
  const [distributorSchemes, setDistributorSchemes] = useState<Scheme[]>([]);
  const [distributorPrices, setDistributorPrices] = useState<SpecialPrice[]>([]);

  const [orderItems, setOrderItems] = useState<OrderItemState[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);
  const [itemErrors, setItemErrors] = useState<Record<string, string>>({});

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

      if (location.state?.distributorId) {
        setSelectedDistributorId(location.state.distributorId);
      }

      setIsLoading(false);
    };
    loadInitialData();
  }, [location.state]);

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
    
    // If a distributor has their own schemes, only those apply. Otherwise, global schemes apply.
    const applicableSchemes = distributorSchemes.length > 0 ? distributorSchemes : globalSchemes;

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

    // --- REFACTORED SCHEME LOGIC ---
    // Group schemes by the product to buy and sort by buyQuantity descending to apply best deals first
    const schemesByBuySku = applicableSchemes.reduce((acc, scheme) => {
        if (!acc[scheme.buySkuId]) acc[scheme.buySkuId] = [];
        acc[scheme.buySkuId].push(scheme);
        return acc;
    }, {} as Record<string, Scheme[]>);

    for (const skuId in schemesByBuySku) {
        schemesByBuySku[skuId].sort((a, b) => b.buyQuantity - a.buyQuantity);
    }
    
    // Create a map of purchased quantities to process for schemes
    const purchasedQuantities = new Map<string, number>();
    orderItems.forEach(item => {
        if (item.quantity > 0) {
            purchasedQuantities.set(item.skuId, (purchasedQuantities.get(item.skuId) || 0) + item.quantity);
        }
    });

    // Iterate over purchased items and apply schemes greedily
    purchasedQuantities.forEach((quantity, skuId) => {
        const relevantSchemes = schemesByBuySku[skuId];
        if (relevantSchemes) {
            let remainingQuantity = quantity;
            relevantSchemes.forEach(scheme => {
                if (remainingQuantity >= scheme.buyQuantity) {
                    const timesApplied = Math.floor(remainingQuantity / scheme.buyQuantity);
                    const totalFree = timesApplied * scheme.getQuantity;
                    
                    const existing = freebies.get(scheme.getSkuId) || { quantity: 0, source: scheme.description };
                    freebies.set(scheme.getSkuId, { quantity: existing.quantity + totalFree, source: scheme.description });
                    
                    remainingQuantity %= scheme.buyQuantity;
                }
            });
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

      if (field === 'quantity') {
          const qty = Number(value);
          setItemErrors(prev => {
              const newErrors = {...prev};
              if (qty <= 0) {
                  newErrors[itemId] = 'Quantity must be positive.';
              } else {
                  delete newErrors[itemId];
              }
              return newErrors;
          });
      }
  };

  const handleRemoveItem = (itemId: string) => {
    setOrderItems(orderItems.filter((item) => item.id !== itemId));
    setItemErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[itemId];
        return newErrors;
    });
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
      const itemsToSubmit = orderItems
        .filter(i => i.quantity > 0)
        .map(({ skuId, quantity }) => ({ skuId, quantity }));
      
      const newOrder = await api.placeOrder(selectedDistributorId, itemsToSubmit, currentUser!.username);
      setStatusMessage({ 
          type: 'success', 
          text: `Order placed successfully for ${selectedDistributor?.name}!`,
          orderId: newOrder.id,
      });
      
      // refetch distributors to get updated wallet/credit balances
      const updatedDistributors = await api.getDistributors();
      setDistributors(updatedDistributors);
      
      setOrderItems([]);
      // Do not reset distributor selection, user might want to place another order
      // setSelectedDistributorId(''); 
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
  
  const totalAvailableForOrder = selectedDistributor ? selectedDistributor.walletBalance : 0;
  const hasErrors = Object.keys(itemErrors).length > 0;

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
            <div className="bg-primary-lightest border border-primary/20 rounded-lg p-4 text-center">
                <p className="text-sm font-semibold text-text-secondary">Available Wallet Balance</p>
                <p className="text-2xl font-bold text-text-primary mt-1">{formatIndianCurrency(totalAvailableForOrder)}</p>
            </div>
          )}
        </div>
      </Card>

      {selectedDistributorId && (
        <Card>
          <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
              <h3 className="text-lg font-semibold">Order Items</h3>
              <Button onClick={handleAddSku} variant="secondary" size="sm"><PlusCircle size={14}/> Add Item</Button>
          </div>
          <div className="space-y-2">
            {orderItems.map((item) => (
              <div key={item.id} className="grid grid-cols-12 gap-2 items-start p-2 rounded-md bg-slate-50">
                <div className="col-span-12 sm:col-span-8">
                  <Select id={`sku-${item.id}`} value={item.skuId} onChange={(e: ChangeEvent<HTMLSelectElement>) => handleItemChange(item.id, 'skuId', e.target.value)}>
                    {skus.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </Select>
                </div>
                <div className="col-span-9 sm:col-span-3">
                    <Input type="number" value={item.quantity} onChange={(e) => handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 0)} min="1" error={itemErrors[item.id]} />
                </div>
                <div className="col-span-3 sm:col-span-1 text-right self-center">
                  <button onClick={() => handleRemoveItem(item.id)} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={20}/></button>
                </div>
              </div>
            ))}
          </div>

          {displayItems.length > 0 && (
            <div className="mt-6 pt-4 border-t border-border">
              <h4 className="font-semibold mb-2">Order Summary</h4>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[500px] text-sm">
                  <thead className="bg-slate-50">
                      <tr>
                          <th className="p-2 font-semibold text-text-secondary">Product</th>
                          <th className="p-2 font-semibold text-text-secondary text-center">Qty</th>
                          <th className="p-2 font-semibold text-text-secondary text-right">Unit Price</th>
                          <th className="p-2 font-semibold text-text-secondary text-right">Total</th>
                      </tr>
                  </thead>
                  <tbody>
                    {displayItems.map((item, index) => (
                      <tr key={index} className={`border-b border-border last:border-b-0 ${item.isFreebie ? 'bg-green-100/50' : ''}`}>
                        <td className="p-2 w-1/2">
                          {item.skuName}
                          {item.isFreebie && <Gift size={12} className="inline ml-2 text-green-700"/>}
                          {item.hasSpecialPrice && <Star size={12} className="inline ml-2 text-yellow-700"/>}
                        </td>
                        <td className="p-2 text-center">{item.quantity}</td>
                        <td className="p-2 text-right">{formatIndianCurrency(item.unitPrice)}</td>
                        <td className="p-2 text-right font-semibold">{formatIndianCurrency(item.quantity * item.unitPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-border">
                      <td colSpan={3} className="p-2 pt-4 text-right font-bold text-text-primary">Total Amount:</td>
                      <td className="p-2 pt-4 text-right font-bold text-text-primary text-lg">{formatIndianCurrency(subtotal)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
               <p className="text-sm text-red-700 text-right mt-2">{subtotal > totalAvailableForOrder ? "Order exceeds available balance!" : ""}</p>
            </div>
          )}
        </Card>
      )}

      {statusMessage && (
          <div className={`flex flex-col sm:flex-row items-center justify-between p-3 rounded-lg mt-4 gap-2 text-sm ${statusMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              <div className="flex items-center">
                  {statusMessage.type === 'success' ? <CheckCircle className="mr-2" /> : <XCircle className="mr-2" />}
                  {statusMessage.text}
              </div>
              {statusMessage.type === 'success' && statusMessage.orderId && (
                  <Button onClick={() => handleViewInvoice(statusMessage.orderId!)} size="sm" variant="primary" className="bg-green-600 hover:bg-green-700">
                      <FileText size={14}/> View Invoice
                  </Button>
              )}
          </div>
      )}

      <div className="flex justify-end pt-4">
        <Button onClick={handleSubmit} isLoading={isLoading} disabled={!selectedDistributorId || orderItems.length === 0 || subtotal > totalAvailableForOrder || subtotal <= 0 || hasErrors}>
          Place Order
        </Button>
      </div>
    </div>
  );
};

export default PlaceOrder;