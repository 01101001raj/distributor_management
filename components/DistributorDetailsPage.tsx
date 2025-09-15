import React, { useEffect, useState, useCallback, useMemo } from 'react';
// FIX: Use namespace import for react-router-dom to resolve export errors.
import * as ReactRouterDOM from 'react-router-dom';
import { api } from '../services/mockApiService';
import { Distributor, Order, WalletTransaction, SpecialPrice, Scheme, SKU, UserRole, EnrichedOrderItem, EnrichedWalletTransaction, OrderStatus } from '../types';
import Card from './common/Card';
import { ArrowLeft, Wallet, ShoppingCart, Star, Sparkles, PlusCircle, Save, X, Trash2, ChevronDown, ChevronRight, Gift, Edit, CheckCircle, XCircle, FileText, ListOrdered, Tag } from 'lucide-react';
import Button from './common/Button';
import Input from './common/Input';
import Select from './common/Select';
import { useAuth } from '../hooks/useAuth';
import { useForm, SubmitHandler } from 'react-hook-form';
import { formatIndianCurrency } from '../utils/formatting';
import { useSortableData } from '../hooks/useSortableData';
import SortableTableHeader from './common/SortableTableHeader';
import Tabs from './common/Tabs';

const DetailItem = ({ label, value }: { label: string, value: React.ReactNode }) => (
    <div className="border-b border-border py-3 first:pt-0 last:border-b-0 last:pb-0">
        <p className="text-sm text-text-secondary">{label}</p>
        <p className="text-base font-semibold text-text-primary mt-1">{value}</p>
    </div>
);


const DistributorDetailsPage: React.FC = () => {
  const { distributorId } = ReactRouterDOM.useParams<{ distributorId: string }>();
  const navigate = ReactRouterDOM.useNavigate();
  const [distributor, setDistributor] = useState<Distributor | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [transactions, setTransactions] = useState<EnrichedWalletTransaction[]>([]);
  const [specialPrices, setSpecialPrices] = useState<SpecialPrice[]>([]);
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [skus, setSkus] = useState<SKU[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { userRole, currentUser } = useAuth();
  
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  const fetchData = useCallback(async () => {
      if (!distributorId) {
        setError("No distributor ID provided.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const [distributorData, ordersData, transactionsData, specialPricesData, schemesData, skusData] = await Promise.all([
          api.getDistributorById(distributorId),
          api.getOrdersByDistributor(distributorId),
          api.getWalletTransactionsByDistributor(distributorId),
          api.getSpecialPricesByDistributor(distributorId),
          api.getSchemesByDistributor(distributorId),
          api.getSKUs(),
        ]);
        
        if (!distributorData) {
          setError("Distributor not found.");
        } else {
          setDistributor(distributorData);
          setOrders(ordersData);
          setTransactions(transactionsData); 
          setSpecialPrices(specialPricesData);
          setSchemes(schemesData);
          setSkus(skusData);
        }
      } catch (e) {
        setError("Failed to fetch distributor details.");
        console.error(e);
      } finally {
        setLoading(false);
      }
    }, [distributorId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  if (loading) return <div className="flex justify-center items-center h-full"><p>Loading distributor details...</p></div>;
  if (error) return <Card className="text-center text-red-700">{error}</Card>;
  if (!distributor) return <Card className="text-center">Distributor not found.</Card>;

  const canEdit = userRole === UserRole.SUPER_ADMIN || userRole === UserRole.EXECUTIVE;
  
  const tabItems = [
    { 
      label: 'Order History', 
      icon: <ListOrdered size={16}/>,
      content: <OrderHistoryTab orders={orders} skus={skus} onUpdate={fetchData} currentUser={currentUser} setStatusMessage={setStatusMessage}/>
    },
    { 
      label: 'Wallet Transactions',
      icon: <Wallet size={16}/>,
      content: <WalletTransactionsTab transactions={transactions} />
    },
    { 
      label: 'Special Prices',
      icon: <Tag size={16}/>,
      content: distributor.hasSpecialPricing ? <SpecialPricesManager distributorId={distributor.id} initialPrices={specialPrices} skus={skus} onUpdate={fetchData} canEdit={canEdit} /> : <NoSpecialAssignment type="Pricing"/>
    },
    { 
      label: 'Special Schemes',
      icon: <Sparkles size={16}/>,
      content: distributor.hasSpecialSchemes ? <SpecialSchemesManager distributorId={distributor.id} initialSchemes={schemes} skus={skus} onUpdate={fetchData} canEdit={canEdit} userRole={userRole} /> : <NoSpecialAssignment type="Schemes"/>
    }
  ];

  return (
    <div className="space-y-6">
       {statusMessage && (
          <div className={`p-3 rounded-lg flex items-center text-sm ${statusMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {statusMessage.type === 'success' ? <CheckCircle className="mr-2" /> : <XCircle className="mr-2" />}
              {statusMessage.text}
          </div>
      )}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center sm:justify-between gap-4">
        <Button onClick={() => navigate("/dashboard")} variant="secondary" size="sm">
          <ArrowLeft size={16}/>
          Back to Dashboard
        </Button>
        {canEdit && (
            <div className="flex flex-col sm:flex-row items-stretch gap-2">
                <Button onClick={() => navigate('/recharge-wallet', { state: { distributorId: distributor.id } })} variant="secondary">
                    <Wallet size={16}/>
                    Recharge Wallet
                </Button>
                <Button onClick={() => navigate('/place-order', { state: { distributorId: distributor.id } })}>
                    <ShoppingCart size={16}/>
                    Place Order
                </Button>
            </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-text-primary">{distributor.name}</h2>
                    <p className="font-mono text-xs text-text-secondary mt-1">{distributor.id}</p>
                </div>
                 <div className="flex items-center gap-2 mt-2 sm:mt-0">
                    {distributor.hasSpecialPricing && (
                        <span className="flex items-center gap-1 bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                            <Star size={12} /> Special Pricing
                        </span>
                    )}
                    {distributor.hasSpecialSchemes && (
                        <span className="flex items-center gap-1 bg-primary-lightest text-primary text-xs font-medium px-2.5 py-0.5 rounded-full">
                            <Sparkles size={12} /> Special Schemes
                        </span>
                    )}
                </div>
            </div>
            <div className="mt-6 border-t border-border pt-4 grid grid-cols-1 md:grid-cols-2 gap-x-8">
                <DetailItem label="Phone Number" value={distributor.phone} />
                <DetailItem label="Location" value={`${distributor.area}, ${distributor.state}`} />
                <DetailItem label="Date Added" value={new Date(distributor.dateAdded).toLocaleDateString()} />
                <DetailItem label="Added By" value={distributor.addedByExecId} />
                 <DetailItem label="Agreement" value={
                    distributor.agreementUrl ? (
                        <a href={distributor.agreementUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline flex items-center gap-1.5">
                            <FileText size={14} /> View Document
                        </a>
                    ) : <span className="italic text-text-secondary font-normal">Not available</span>
                } />
            </div>
        </Card>

        <Card className="flex flex-col justify-center text-center">
           <h3 className="text-sm font-medium text-text-secondary mb-1">Current Wallet Balance</h3>
            <p className="text-4xl font-bold text-text-primary">{formatIndianCurrency(distributor.walletBalance)}</p>
        </Card>
      </div>
      
      <Card>
        <Tabs tabs={tabItems} />
      </Card>

    </div>
  );
};

const NoSpecialAssignment: React.FC<{type: 'Pricing' | 'Schemes'}> = ({type}) => (
    <div className="text-center p-8">
        <p className="text-text-secondary">This distributor is not eligible for Special {type}.</p>
    </div>
);

// --- TAB SUB-COMPONENTS ---

interface OrderHistoryTabProps {
    orders: Order[];
    skus: SKU[];
    onUpdate: () => void;
    currentUser: any;
    setStatusMessage: (msg: {type: 'success' | 'error', text: string} | null) => void;
}
const OrderHistoryTab: React.FC<OrderHistoryTabProps> = ({ orders, skus, onUpdate, currentUser, setStatusMessage }) => {
    const { items: sortedOrders, requestSort, sortConfig } = useSortableData(orders, { key: 'date', direction: 'descending' });
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
    const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

    const handleMarkDelivered = async (orderId: string) => {
        if (window.confirm("Mark this order as delivered? It cannot be edited further.")) {
            if (!currentUser) {
                setStatusMessage({ type: 'error', text: 'You must be logged in to perform this action.' });
                return;
            }
            setStatusMessage(null);
            setUpdatingOrderId(orderId);

            try {
                await api.updateOrderStatus(orderId, OrderStatus.DELIVERED, currentUser.username);
                setStatusMessage({ type: 'success', text: `Order ${orderId} has been marked as delivered.` });
                setTimeout(() => setStatusMessage(null), 4000);
                await onUpdate();
            } catch (error) {
                console.error("Failed to mark as delivered:", error);
                setStatusMessage({ type: 'error', text: "Could not update order status. Please try again." });
            } finally {
                setUpdatingOrderId(null);
            }
        }
    };
    
    const getStatusChip = (status: OrderStatus) => {
      const baseClasses = "px-2.5 py-1 text-xs font-semibold rounded-full inline-block";
      if (status === OrderStatus.DELIVERED) {
          return <span className={`${baseClasses} bg-green-100 text-green-800`}>{status}</span>;
      }
      return <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>{status}</span>;
    }

    return (
        <div className="overflow-x-auto">
            {sortedOrders.length > 0 ? (
                <table className="w-full text-left min-w-[600px] text-sm">
                  <thead className="border-b border-border bg-slate-50">
                      <tr>
                          <th className="p-3 w-10"></th>
                          <SortableTableHeader label="Order ID" sortKey="id" requestSort={requestSort} sortConfig={sortConfig} />
                          <SortableTableHeader label="Date" sortKey="date" requestSort={requestSort} sortConfig={sortConfig} />
                          <SortableTableHeader label="Status" sortKey="status" requestSort={requestSort} sortConfig={sortConfig} />
                          <SortableTableHeader label="Amount" sortKey="totalAmount" requestSort={requestSort} sortConfig={sortConfig} className="text-right" />
                          <th className="p-3"></th>
                      </tr>
                  </thead>
                  <tbody>
                      {sortedOrders.map(o => (
                          <React.Fragment key={o.id}>
                              <tr className="border-b border-border last:border-0 hover:bg-slate-50">
                                  <td className="p-3 text-center">
                                      <button onClick={() => setExpandedOrderId(expandedOrderId === o.id ? null : o.id)} className="hover:bg-slate-100 rounded-full p-1 disabled:opacity-50" disabled={!!updatingOrderId}>
                                        {expandedOrderId === o.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                      </button>
                                  </td>
                                  <td className="p-3 font-mono text-xs">{o.id}</td>
                                  <td className="p-3">{new Date(o.date).toLocaleDateString()}</td>
                                  <td className="p-3">{getStatusChip(o.status)}</td>
                                  <td className="p-3 font-semibold text-right">{formatIndianCurrency(o.totalAmount)}</td>
                                  <td className="p-3">
                                      {o.status === OrderStatus.PENDING && (
                                          <div className="flex justify-end gap-2">
                                              <Button size="sm" variant="primary" className="bg-green-500 hover:bg-green-600 text-white" onClick={() => handleMarkDelivered(o.id)} isLoading={updatingOrderId === o.id} disabled={!!updatingOrderId}><CheckCircle size={14}/></Button>
                                          </div>
                                      )}
                                  </td>
                              </tr>
                              {expandedOrderId === o.id && (
                                  <tr className="bg-slate-50">
                                      <td colSpan={6} className="p-4">
                                         <OrderDetails 
                                              order={o} 
                                              skus={skus}
                                              onUpdate={() => {
                                                  onUpdate();
                                                  setExpandedOrderId(null);
                                              }} 
                                              onCancel={() => setExpandedOrderId(null)}
                                              setStatusMessage={setStatusMessage}
                                          />
                                      </td>
                                  </tr>
                              )}
                          </React.Fragment>
                      ))}
                  </tbody>
              </table>
            ) : <p className="text-center text-text-secondary py-8">No orders found.</p>}
        </div>
    );
};


const WalletTransactionsTab: React.FC<{transactions: EnrichedWalletTransaction[]}> = ({transactions}) => {
    const { items: sortedTransactions, requestSort, sortConfig } = useSortableData(transactions, { key: 'date', direction: 'descending' });
    return (
        <div className="overflow-x-auto">
            {sortedTransactions.length > 0 ? (
                <table className="w-full text-left min-w-[400px]">
                  <thead className="bg-slate-50 text-xs uppercase sticky top-0">
                    <tr>
                      <SortableTableHeader label="Date" sortKey="date" requestSort={requestSort} sortConfig={sortConfig} />
                      <SortableTableHeader label="Type" sortKey="type" requestSort={requestSort} sortConfig={sortConfig} />
                      <SortableTableHeader label="Amount" sortKey="amount" requestSort={requestSort} sortConfig={sortConfig} className="text-right" />
                      <SortableTableHeader label="Balance" sortKey="balanceAfter" requestSort={requestSort} sortConfig={sortConfig} className="text-right" />
                    </tr>
                  </thead>
                  <tbody>
                    {sortedTransactions.map(t => (
                      <tr key={t.id} className="border-b border-border last:border-0 text-sm">
                        <td className="p-3 text-xs text-text-secondary whitespace-nowrap">{new Date(t.date).toLocaleString()}</td>
                        <td className="p-3 capitalize font-medium">{t.type.replace('_', ' ').toLowerCase()}</td>
                        <td className={`p-3 font-semibold text-right ${t.amount >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                          {t.amount >= 0 ? `+${formatIndianCurrency(t.amount)}` : formatIndianCurrency(t.amount)}
                        </td>
                        <td className="p-3 font-bold text-right text-text-primary">
                          {formatIndianCurrency(t.balanceAfter)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            ) : <p className="text-center text-text-secondary py-8">No wallet transactions found.</p>}
        </div>
    );
};

interface EditableItem {
  id: string; 
  skuId: string;
  quantity: number;
  unitPrice: number;
}

const OrderDetails: React.FC<{ order: Order; skus: SKU[]; onUpdate: () => void; onCancel: () => void; setStatusMessage: (msg: { type: 'success'|'error', text: string } | null) => void; }> = ({ order, skus, onUpdate, onCancel, setStatusMessage }) => {
    const [initialItems, setInitialItems] = useState<EnrichedOrderItem[]>([]);
    const [editableItems, setEditableItems] = useState<EditableItem[]>([]);
    const [loading, setLoading] = useState(true);
    const { currentUser } = useAuth();

    useEffect(() => {
        const fetchItems = async () => {
            setLoading(true);
            const data = await api.getOrderItems(order.id);
            setInitialItems(data);
            const editable = data
                .filter(item => !item.isFreebie)
                .map(item => ({
                    id: `${item.skuId}-${Math.random()}`,
                    skuId: item.skuId,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice
                }));
            setEditableItems(editable);
            setLoading(false);
        };
        fetchItems();
    }, [order.id]);

    const newSubtotal = useMemo(() => {
        return editableItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
    }, [editableItems]);

    const handleItemChange = (itemId: string, field: 'skuId' | 'quantity' | 'unitPrice', value: string) => {
        setEditableItems(prev => prev.map(item => {
            if (item.id === itemId) {
                if(field === 'skuId') return { ...item, [field]: value };
                return { ...item, [field]: Number(value) >= 0 ? Number(value) : 0 };
            }
            return item;
        }));
    };
    
    const handleAddItem = () => {
        if (skus.length > 0) {
            const firstSku = skus[0];
            setEditableItems(prev => [...prev, {
                id: `new-${Date.now()}`,
                skuId: firstSku.id,
                quantity: 1,
                unitPrice: firstSku.price,
            }]);
        }
    };

    const handleRemoveItem = (itemId: string) => {
        setEditableItems(prev => prev.filter(item => item.id !== itemId));
    };
    
    const handleSaveChanges = async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            const itemsToSubmit = editableItems
                .filter(item => item.quantity > 0)
                .map(({ skuId, quantity, unitPrice }) => ({ skuId, quantity, unitPrice }));
            
            await api.updateOrderItems(order.id, itemsToSubmit, currentUser.username);
            setStatusMessage({ type: 'success', text: `Order ${order.id} updated successfully.`});
            onUpdate();
        } catch (error) {
            setStatusMessage({ type: 'error', text: `Failed to update order: ${(error as Error).message}` });
        } finally {
            setLoading(false);
        }
    }

    if (loading) return <div className="p-2 text-sm">Loading items...</div>;

    const renderReadOnlyView = () => (
        <div className="bg-slate-100 p-4 rounded-lg border border-border">
            <h4 className="font-bold mb-2 text-text-primary">Order Items</h4>
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
                    {initialItems.map((item, index) => (
                        <tr key={index} className={`border-b border-border last:border-none ${item.isFreebie ? 'bg-green-100/50' : ''}`}>
                            <td className="p-2">{item.skuName} {item.isFreebie && <Gift size={12} className="inline ml-1 text-green-700"/>}</td>
                            <td className="p-2 text-center">{item.quantity}</td>
                            <td className="p-2 text-right">{formatIndianCurrency(item.unitPrice)}</td>
                            <td className="p-2 font-semibold text-right">{formatIndianCurrency(item.quantity * item.unitPrice)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
    
    if (order.status !== OrderStatus.PENDING) {
        return renderReadOnlyView();
    }
    
    return (
        <div className="bg-slate-100 p-4 rounded-lg border border-primary/20">
             <h4 className="font-bold mb-2 text-text-primary">Edit Order Items</h4>
             <div className="overflow-x-auto">
                <table className="w-full bg-white rounded-md min-w-[600px] text-sm">
                     <thead className="bg-slate-200">
                        <tr className="text-left">
                            <th className="p-2 font-semibold text-text-secondary w-2/5">Product</th>
                            <th className="p-2 font-semibold text-text-secondary w-1/5 text-center">Quantity</th>
                            <th className="p-2 font-semibold text-text-secondary w-1/5 text-right">Unit Price</th>
                            <th className="p-2 font-semibold text-text-secondary w-1/5 text-right">Subtotal</th>
                            <th className="p-2"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {editableItems.map(item => (
                             <tr key={item.id}>
                                <td>
                                    <Select value={item.skuId} onChange={(e) => handleItemChange(item.id, 'skuId', e.target.value)}>
                                        {skus.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </Select>
                                </td>
                                <td><Input type="number" value={item.quantity} onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)} /></td>
                                <td><Input type="number" value={item.unitPrice} onChange={(e) => handleItemChange(item.id, 'unitPrice', e.target.value)} /></td>
                                <td className="p-2 text-right font-semibold">{formatIndianCurrency(item.quantity * item.unitPrice)}</td>
                                <td><Button size="sm" variant="danger" className="p-2" onClick={() => handleRemoveItem(item.id)}><Trash2 size={14} /></Button></td>
                             </tr>
                        ))}
                    </tbody>
                </table>
             </div>
              <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                <Button size="sm" variant="secondary" onClick={handleAddItem}><PlusCircle size={14}/> Add Item</Button>
                <div className="text-right font-bold">
                    New Total: {formatIndianCurrency(newSubtotal)}
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2 border-t pt-4">
                  <Button variant="secondary" onClick={onCancel}>Cancel</Button>
                  <Button onClick={handleSaveChanges} isLoading={loading}><Save size={14}/> Save Changes</Button>
              </div>
        </div>
    )
};


// --- SpecialPricesManager Sub-component ---
const SpecialPricesManager: React.FC<{ distributorId: string; initialPrices: SpecialPrice[]; skus: SKU[]; onUpdate: () => void; canEdit: boolean }> = ({ distributorId, initialPrices, skus, onUpdate, canEdit }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedPrices, setEditedPrices] = useState<Record<string, Partial<Omit<SpecialPrice, 'id' | 'distributorId'>>>>({});
    const [errors, setErrors] = useState<Record<string, Record<string, string>>>({});

    const validateRow = (skuId: string, currentData: Partial<Omit<SpecialPrice, 'id' | 'distributorId'>>) => {
        const newErrors: Record<string, string> = {};
        const { price, startDate, endDate } = currentData;
        const hasPrice = price !== undefined && String(price).length > 0 && price > 0;
        const hasStartDate = startDate && startDate.length > 0;
        const hasEndDate = endDate && endDate.length > 0;

        // A row is valid if it's completely empty OR completely full and logically correct.
        if ([hasPrice, hasStartDate, hasEndDate].some(Boolean) && ![hasPrice, hasStartDate, hasEndDate].every(Boolean)) {
            if (!hasPrice) newErrors.price = 'Required';
            if (!hasStartDate) newErrors.startDate = 'Required';
            if (!hasEndDate) newErrors.endDate = 'Required';
        } else if (hasStartDate && hasEndDate && new Date(startDate) > new Date(endDate)) {
            newErrors.endDate = 'End date must be after start date.';
        }
        
        setErrors(prev => ({...prev, [skuId]: newErrors}));
        return Object.keys(newErrors).length === 0;
    };

    const handlePriceChange = (skuId: string, field: keyof Omit<SpecialPrice, 'id'|'distributorId'|'skuId'>, value: string | number) => {
        const updatedPrice = { ...editedPrices[skuId], [field]: value };
        validateRow(skuId, updatedPrice);
        setEditedPrices(prev => ({ ...prev, [skuId]: updatedPrice }));
    };
    
    const setDuration = (skuId: string, months: number) => {
        setEditedPrices(prev => {
            const currentData = prev[skuId] || {};
            const startDateStr = currentData.startDate || new Date().toISOString().split('T')[0];
            const startDate = new Date(startDateStr);
            const endDate = new Date(startDate);
            endDate.setMonth(endDate.getMonth() + months);
            const endDateStr = endDate.toISOString().split('T')[0];

            const updatedPrice = {
                ...currentData,
                startDate: startDateStr,
                endDate: endDateStr,
            };

            validateRow(skuId, updatedPrice);
            
            return {
                ...prev,
                [skuId]: updatedPrice
            };
        });
    };

    const handleSave = async () => {
        let allValid = true;
        for (const skuId of Object.keys(editedPrices)) {
            if (!validateRow(skuId, editedPrices[skuId])) {
                allValid = false;
            }
        }

        if (!allValid) {
            alert("Please fix the errors before saving.");
            return;
        }

        try {
            for (const skuId of skus.map(s => s.id)) {
                const originalPrice = initialPrices.find(p => p.skuId === skuId);
                const editedPrice = editedPrices[skuId];

                if (editedPrice) {
                    const hasData = editedPrice.price || editedPrice.startDate || editedPrice.endDate;
                    if (originalPrice && !hasData) {
                        await api.deleteSpecialPrice(originalPrice.id);
                    } else if (originalPrice && hasData) {
                        await api.updateSpecialPrice({ ...originalPrice, ...editedPrice });
                    } else if (!originalPrice && hasData) {
                        await api.addSpecialPrice({
                            distributorId,
                            skuId,
                            price: Number(editedPrice.price!),
                            startDate: editedPrice.startDate!,
                            endDate: editedPrice.endDate!,
                        });
                    }
                }
            }
            onUpdate();
            setIsEditing(false);
        } catch (err) {
            console.error("Failed to save special prices", err);
            alert("Failed to save. Please check console for details.");
        }
    };
    
    const handleCancel = () => {
        setIsEditing(false);
        setErrors({});
        // Reset editedPrices to initial state
        const initialEdits: Record<string, Partial<Omit<SpecialPrice, 'id' | 'distributorId'>>> = {};
        initialPrices.forEach(p => {
            initialEdits[p.skuId] = { price: p.price, startDate: p.startDate, endDate: p.endDate };
        });
        setEditedPrices(initialEdits);
    }

    useEffect(() => {
        handleCancel();
    }, [initialPrices]);

    return (
    <div>
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-text-primary">Special Price Settings</h3>
            {canEdit && (
                <div className="flex gap-2">
                    {isEditing ? (
                        <>
                            <Button onClick={handleSave} size="sm"><Save size={16}/> Save</Button>
                            <Button onClick={handleCancel} variant="secondary" size="sm"><X size={16}/> Cancel</Button>
                        </>
                    ) : (
                        <Button onClick={() => setIsEditing(true)} variant="secondary" size="sm"><Edit size={16}/> Edit</Button>
                    )}
                </div>
            )}
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[600px] text-sm">
                <thead>
                    <tr className="bg-slate-50">
                        <th className="p-3 font-semibold text-text-secondary">Product (Default Price)</th>
                        <th className="p-3 font-semibold text-text-secondary">Special Price</th>
                        <th colSpan={2} className="p-3 font-semibold text-text-secondary">Effective Dates & Duration</th>
                    </tr>
                </thead>
                <tbody>
                    {skus.map(sku => {
                        const price = initialPrices.find(p => p.skuId === sku.id);
                        const edited = editedPrices[sku.id] || {};
                        const error = errors[sku.id] || {};

                        return (
                            <tr key={sku.id} className="border-b border-border last:border-0">
                                <td className="p-3 font-medium">{sku.name} <span className="text-xs text-text-secondary">({formatIndianCurrency(sku.price)})</span></td>
                                {isEditing ? (
                                    <>
                                        <td className="p-3"><Input type="number" placeholder="e.g., 85" value={edited.price ?? ''} onChange={e => handlePriceChange(sku.id, 'price', e.target.value)} error={error.price}/></td>
                                        <td className="p-3" colSpan={2}>
                                            <div className="flex flex-wrap items-end gap-2">
                                                <div className="flex-1 min-w-[150px]">
                                                    <Input 
                                                        type="date" 
                                                        label="Start Date"
                                                        value={edited.startDate ?? ''} 
                                                        onChange={e => handlePriceChange(sku.id, 'startDate', e.target.value)} 
                                                        error={error.startDate}
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-[150px]">
                                                    <label className="block text-sm font-medium text-text-secondary mb-1.5">Set Duration</label>
                                                    <div className="flex gap-1">
                                                        <Button type="button" size="sm" variant="secondary" onClick={() => setDuration(sku.id, 3)}>3M</Button>
                                                        <Button type="button" size="sm" variant="secondary" onClick={() => setDuration(sku.id, 6)}>6M</Button>
                                                        <Button type="button" size="sm" variant="secondary" onClick={() => setDuration(sku.id, 12)}>1Y</Button>
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-[150px]">
                                                    <Input 
                                                        type="date" 
                                                        label="End Date"
                                                        value={edited.endDate ?? ''} 
                                                        readOnly 
                                                        className="bg-slate-100 cursor-not-allowed"
                                                        error={error.endDate}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        <td className={`p-3 font-semibold ${price ? 'text-green-700' : 'text-text-secondary'}`}>{price ? formatIndianCurrency(price.price) : 'Default'}</td>
                                        <td className="p-3">{price?.startDate ? new Date(price.startDate).toLocaleDateString() : '-'}</td>
                                        <td className="p-3">{price?.endDate ? new Date(price.endDate).toLocaleDateString() : '-'}</td>
                                    </>
                                )}
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    </div>
    );
};

// --- SpecialSchemesManager Sub-component ---
type SchemeFormInputs = Omit<Scheme, 'id' | 'isGlobal' | 'distributorId'>;

interface SpecialSchemesManagerProps {
    distributorId: string;
    initialSchemes: Scheme[];
    skus: SKU[];
    onUpdate: () => void;
    canEdit: boolean;
    userRole: UserRole | null;
}

const SpecialSchemesManager: React.FC<SpecialSchemesManagerProps> = ({ distributorId, initialSchemes, skus, onUpdate, canEdit, userRole }) => {
    const [editingScheme, setEditingScheme] = useState<Partial<Scheme> | null>(null);

    const { register, handleSubmit, formState: { errors, isValid }, reset, watch, setValue } = useForm<SchemeFormInputs>({mode: 'onBlur'});
    const watchStartDate = watch('startDate');
    
    const setSchemeDuration = (months: number) => {
        const startDateStr = watch('startDate');
        if (!startDateStr) {
            const today = new Date().toISOString().split('T')[0];
            setValue('startDate', today, { shouldValidate: true, shouldDirty: true });
            
            const endDate = new Date(today);
            endDate.setMonth(endDate.getMonth() + months);
            setValue('endDate', endDate.toISOString().split('T')[0], { shouldValidate: true, shouldDirty: true });
        } else {
            const startDate = new Date(startDateStr);
            const endDate = new Date(startDate);
            endDate.setMonth(endDate.getMonth() + months);
            setValue('endDate', endDate.toISOString().split('T')[0], { shouldValidate: true, shouldDirty: true });
        }
    };

    const handleAddNew = () => {
        reset({
          description: '',
          buySkuId: skus[0]?.id || '',
          buyQuantity: 10,
          getSkuId: skus[0]?.id || '',
          getQuantity: 1,
          startDate: new Date().toISOString().split('T')[0],
          endDate: '',
        });
        setEditingScheme({ id: 'new' });
    };
    
    const handleEdit = (scheme: Scheme) => {
        reset(scheme);
        setEditingScheme(scheme);
    };

    const handleCancel = () => {
        setEditingScheme(null);
        reset({});
    };

    const handleDelete = async (schemeId: string) => {
        if (userRole && window.confirm('Are you sure you want to delete this special scheme?')) {
            try {
                await api.deleteScheme(schemeId, userRole);
                onUpdate();
            } catch (err) {
                alert((err as Error).message);
            }
        }
    }

    const onSave: SubmitHandler<SchemeFormInputs> = async (data) => {
        if (!userRole) return;
        try {
            if (editingScheme?.id === 'new') {
                await api.addScheme({ ...data, distributorId, isGlobal: false }, userRole);
            } else {
                await api.updateScheme({ ...data, id: editingScheme!.id!, distributorId, isGlobal: false }, userRole);
            }
            onUpdate();
            handleCancel();
        } catch (err) {
            console.error("Failed to save scheme:", err);
            alert("Failed to save scheme.");
        }
    };
    
    const getSkuName = (id?: string) => skus.find(s => s.id === id)?.name || 'N/A';
    
    const renderEditor = () => (
        <div className="mt-4 p-4 border-t-2 border-primary bg-background rounded-lg">
            <form onSubmit={handleSubmit(onSave)}>
                <h4 className="text-md font-bold mb-4">{editingScheme?.id === 'new' ? 'New Special Scheme' : 'Edit Special Scheme'}</h4>
                <div className="space-y-4">
                    <Input label="Description" {...register('description', { required: "Description is required" })} error={errors.description?.message} />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div className="md:col-span-1">
                            <Input 
                                label="Start Date" 
                                type="date" 
                                {...register('startDate', { required: "Start date is required" })} 
                                error={errors.startDate?.message} 
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-text-secondary mb-1.5">Set End Date by Duration</label>
                            <div className="flex gap-2">
                                <Button type="button" size="sm" variant="secondary" onClick={() => setSchemeDuration(3)}>3 Months</Button>
                                <Button type="button" size="sm" variant="secondary" onClick={() => setSchemeDuration(6)}>6 Months</Button>
                                <Button type="button" size="sm" variant="secondary" onClick={() => setSchemeDuration(12)}>1 Year</Button>
                            </div>
                        </div>
                    </div>
                    <Input 
                        label="End Date" 
                        type="date" 
                        {...register('endDate', { required: "End date is required", validate: v => !watchStartDate || v >= watchStartDate || 'Must be on or after start' })} 
                        error={errors.endDate?.message} 
                        readOnly
                        className="bg-slate-100 cursor-not-allowed"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3 border rounded-lg bg-card">
                            <p className="font-semibold text-sm mb-2">Condition (Buy)</p>
                            <div className="flex gap-2">
                                <Input label="Qty" type="number" {...register('buyQuantity', { required: true, valueAsNumber: true, min: 1 })} error={errors.buyQuantity?.message} />
                                <Select label="Product" {...register('buySkuId', { required: true })}>
                                    {skus.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </Select>
                            </div>
                        </div>
                         <div className="p-3 border rounded-lg bg-green-100">
                            <p className="font-semibold text-sm mb-2">Reward (Get)</p>
                            <div className="flex gap-2">
                                <Input label="Qty" type="number" {...register('getQuantity', { required: true, valueAsNumber: true, min: 1 })} error={errors.getQuantity?.message} />
                                <Select label="Product" {...register('getSkuId', { required: true })}>
                                    {skus.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </Select>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" onClick={handleCancel} variant="secondary"><X size={16}/> Cancel</Button>
                        <Button type="submit" disabled={!isValid}><Save size={16}/> Save</Button>
                    </div>
                </div>
            </form>
        </div>
    );

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-text-primary">Special Scheme Settings</h3>
                {canEdit && (
                    <Button onClick={handleAddNew} size="sm" variant="secondary" disabled={!!editingScheme}>
                        <PlusCircle size={16}/> Add Scheme
                    </Button>
                )}
            </div>
            <div className="space-y-3">
                {initialSchemes.map(scheme => (
                    <div key={scheme.id} className="p-3 bg-slate-50 rounded-lg">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-semibold">{scheme.description}</p>
                                <p className="text-sm text-text-secondary">
                                    Buy {scheme.buyQuantity} x {getSkuName(scheme.buySkuId)}, Get {scheme.getQuantity} x {getSkuName(scheme.getSkuId)} Free
                                </p>
                                <p className="text-xs text-text-secondary mt-1">Active: {new Date(scheme.startDate).toLocaleDateString()} to {new Date(scheme.endDate).toLocaleDateString()}</p>
                            </div>
                            {canEdit && !editingScheme && (
                                <div className="flex gap-2 flex-shrink-0 ml-4">
                                    <Button onClick={() => handleEdit(scheme)} size="sm" variant="secondary" className="p-1 h-7 w-7"><Edit size={14}/></Button>
                                    {userRole === UserRole.SUPER_ADMIN && <Button onClick={() => handleDelete(scheme.id)} size="sm" variant="danger" className="p-1 h-7 w-7"><Trash2 size={14}/></Button>}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {initialSchemes.length === 0 && <p className="text-sm text-center text-text-secondary py-8">No special schemes assigned.</p>}
            </div>
            {editingScheme && renderEditor()}
        </div>
    );
};

export default DistributorDetailsPage;