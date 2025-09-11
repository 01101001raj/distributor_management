import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/mockApiService';
import { Distributor, Order, WalletTransaction, SpecialPrice, Scheme, SKU, UserRole, EnrichedOrderItem, EnrichedWalletTransaction, OrderStatus } from '../types';
import Card from './common/Card';
import { ArrowLeft, User, Phone, MapPin, Wallet, ShoppingCart, Star, Sparkles, PlusCircle, Save, X, Trash2, ChevronDown, ChevronRight, Gift, Edit, CheckCircle, XCircle, FileText } from 'lucide-react';
import Button from './common/Button';
import Input from './common/Input';
import Select from './common/Select';
import { useAuth } from '../hooks/useAuth';
import EditOrderModal from './EditOrderModal';
import { useForm, SubmitHandler } from 'react-hook-form';
import { formatIndianCurrency } from '../utils/formatting';
import { useSortableData } from '../hooks/useSortableData';
import SortableTableHeader from './common/SortableTableHeader';

const DistributorDetailsPage: React.FC = () => {
  const { distributorId } = useParams<{ distributorId: string }>();
  const navigate = useNavigate();
  const [distributor, setDistributor] = useState<Distributor | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [transactions, setTransactions] = useState<EnrichedWalletTransaction[]>([]);
  const [specialPrices, setSpecialPrices] = useState<SpecialPrice[]>([]);
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [skus, setSkus] = useState<SKU[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { userRole, currentUser } = useAuth();
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);


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
  
  const { items: sortedTransactions, requestSort: requestTxSort, sortConfig: txSortConfig } = useSortableData(transactions, { key: 'date', direction: 'descending' });
  const { items: sortedOrders, requestSort: requestOrderSort, sortConfig: orderSortConfig } = useSortableData(orders, { key: 'date', direction: 'descending' });

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
            await fetchData();
          } catch (error) {
              console.error("Failed to mark as delivered:", error);
              setStatusMessage({ type: 'error', text: "Could not update order status. Please try again." });
          } finally {
              setUpdatingOrderId(null);
          }
      }
  };

  const toggleExpand = (orderId: string) => {
    if (updatingOrderId) return;
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };
  
  const getStatusChip = (status: OrderStatus) => {
      const baseClasses = "px-2.5 py-1 text-xs font-semibold rounded-full inline-block";
      if (status === OrderStatus.DELIVERED) {
          return <span className={`${baseClasses} bg-green-100 text-green-700`}>{status}</span>;
      }
      return <span className={`${baseClasses} bg-yellow-100 text-yellow-700`}>{status}</span>;
  }
  
  if (loading) return <div className="flex justify-center items-center h-full"><p>Loading distributor details...</p></div>;
  if (error) return <Card className="text-center text-red-500">{error}</Card>;
  if (!distributor) return <Card className="text-center">Distributor not found.</Card>;

  const canEdit = userRole === UserRole.SUPER_ADMIN || userRole === UserRole.EXECUTIVE;

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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <h2 className="text-2xl font-bold text-text-primary">{distributor.name}</h2>
                <div className="flex items-center gap-2">
                    {distributor.hasSpecialPricing && (
                        <span className="flex items-center gap-1 bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                            <Star size={12} /> Special Pricing
                        </span>
                    )}
                    {distributor.hasSpecialSchemes && (
                        <span className="flex items-center gap-1 bg-primary/10 text-primary text-xs font-medium px-2.5 py-0.5 rounded-full">
                            <Sparkles size={12} /> Special Schemes
                        </span>
                    )}
                </div>
              </div>
              <p className="font-mono text-xs text-text-secondary mt-1">{distributor.id}</p>
            </div>
            <div className="mt-4 sm:mt-0 text-left sm:text-right">
                <p className="text-sm font-medium text-text-secondary">Date Added</p>
                <p className="font-semibold">{new Date(distributor.dateAdded).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-text-primary">
            <div className="flex items-center"><User size={16} className="mr-3 text-text-secondary" /><span>{distributor.name}</span></div>
            <div className="flex items-center"><Phone size={16} className="mr-3 text-text-secondary" /><span>{distributor.phone}</span></div>
            <div className="flex items-center"><MapPin size={16} className="mr-3 text-text-secondary" /><span>{distributor.area}, {distributor.state}</span></div>
            {distributor.agreementUrl && <a href={distributor.agreementUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center"><FileText size={16} className="mr-3 text-text-secondary" />View Agreement</a>}
          </div>
        </Card>

        <Card>
           <h3 className="text-lg font-semibold mb-4 text-text-primary">Financial Summary</h3>
            <div className="space-y-4">
                 <div>
                    <div className="flex items-center text-sm text-text-secondary"><Wallet size={16} className="mr-2"/> Wallet Balance</div>
                    <p className="text-2xl font-bold text-text-primary">{formatIndianCurrency(distributor.walletBalance)}</p>
                </div>
            </div>
        </Card>
      </div>
      
      {distributor.hasSpecialPricing && <SpecialPricesManager distributorId={distributor.id} initialPrices={specialPrices} skus={skus} onUpdate={fetchData} canEdit={canEdit} />}
      {distributor.hasSpecialSchemes && <SpecialSchemesManager distributorId={distributor.id} initialSchemes={schemes} skus={skus} onUpdate={fetchData} canEdit={canEdit} userRole={userRole} />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="flex items-center text-lg font-semibold mb-4 text-text-primary"><Wallet size={20} className="mr-3" />Wallet Transactions</h3>
          <div className="overflow-y-auto max-h-96 overflow-x-auto">
            {sortedTransactions.length > 0 ? (
                <table className="w-full text-left min-w-[400px]">
                  <thead className="bg-slate-50 text-xs uppercase sticky top-0">
                    <tr>
                      <SortableTableHeader label="Date" sortKey="date" requestSort={requestTxSort} sortConfig={txSortConfig} />
                      <SortableTableHeader label="Type" sortKey="type" requestSort={requestTxSort} sortConfig={txSortConfig} />
                      <SortableTableHeader label="Amount" sortKey="amount" requestSort={requestTxSort} sortConfig={txSortConfig} className="text-right" />
                      <SortableTableHeader label="Balance" sortKey="balanceAfter" requestSort={requestTxSort} sortConfig={txSortConfig} className="text-right" />
                    </tr>
                  </thead>
                  <tbody>
                    {sortedTransactions.map(t => (
                      <tr key={t.id} className="border-b border-border last:border-0 text-sm">
                        <td className="p-2 text-xs text-text-secondary whitespace-nowrap">{new Date(t.date).toLocaleString()}</td>
                        <td className="p-2 capitalize font-medium">{t.type.replace('_', ' ').toLowerCase()}</td>
                        <td className={`p-2 font-semibold text-right ${t.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {t.amount >= 0 ? `+${formatIndianCurrency(t.amount)}` : formatIndianCurrency(t.amount)}
                        </td>
                        <td className="p-2 font-bold text-right text-text-primary">
                          {formatIndianCurrency(t.balanceAfter)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            ) : <p className="text-center text-text-secondary py-4">No wallet transactions found.</p>}
          </div>
        </Card>
        
        <Card>
          <h3 className="flex items-center text-lg font-semibold mb-4 text-text-primary"><ShoppingCart size={20} className="mr-3" />Order History</h3>
           <div className="overflow-y-auto max-h-96 overflow-x-auto">
            {sortedOrders.length > 0 ? (
                <table className="w-full text-left min-w-[600px] text-sm">
                  <thead className="border-b border-border bg-slate-50 sticky top-0">
                      <tr>
                          <th className="p-2 w-10"></th>
                          <SortableTableHeader label="Order ID" sortKey="id" requestSort={requestOrderSort} sortConfig={orderSortConfig} />
                          <SortableTableHeader label="Date" sortKey="date" requestSort={requestOrderSort} sortConfig={orderSortConfig} />
                          <SortableTableHeader label="Status" sortKey="status" requestSort={requestOrderSort} sortConfig={orderSortConfig} />
                          <SortableTableHeader label="Amount" sortKey="totalAmount" requestSort={requestOrderSort} sortConfig={orderSortConfig} className="text-right" />
                      </tr>
                  </thead>
                  <tbody>
                      {sortedOrders.map(o => (
                          <React.Fragment key={o.id}>
                              <tr className="border-b border-border last:border-0 hover:bg-slate-50">
                                  <td className="p-2 text-center">
                                      <button onClick={() => toggleExpand(o.id)} className="hover:bg-slate-100 rounded-full p-1 disabled:opacity-50" disabled={!!updatingOrderId}>
                                        {expandedOrderId === o.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                      </button>
                                  </td>
                                  <td className="p-2 font-mono text-xs cursor-pointer" onClick={() => toggleExpand(o.id)}>{o.id}</td>
                                  <td className="p-2 cursor-pointer" onClick={() => toggleExpand(o.id)}>{new Date(o.date).toLocaleDateString()}</td>
                                  <td className="p-2 cursor-pointer" onClick={() => toggleExpand(o.id)}>{getStatusChip(o.status)}</td>
                                  <td className="p-2 font-semibold text-right cursor-pointer" onClick={() => toggleExpand(o.id)}>{formatIndianCurrency(o.totalAmount)}</td>
                              </tr>
                               {o.status === OrderStatus.PENDING && (
                                  <tr className="border-b border-border last:border-0">
                                      <td colSpan={5} className="py-2 px-4 text-right bg-slate-50">
                                          <div className="flex justify-end gap-2">
                                              <Button size="sm" variant="secondary" onClick={() => setEditingOrder(o)} disabled={!!updatingOrderId}><Edit size={14}/> Edit</Button>
                                              <Button size="sm" variant="primary" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleMarkDelivered(o.id)} isLoading={updatingOrderId === o.id} disabled={!!updatingOrderId}><CheckCircle size={14}/> Deliver</Button>
                                          </div>
                                      </td>
                                  </tr>
                               )}
                              {expandedOrderId === o.id && (
                                  <tr className="bg-primary/5">
                                      <td colSpan={5} className="p-4">
                                          <OrderDetails orderId={o.id} />
                                      </td>
                                  </tr>
                              )}
                          </React.Fragment>
                      ))}
                  </tbody>
              </table>
            ) : <p className="text-center text-text-secondary py-4">No orders found.</p>}
          </div>
        </Card>
      </div>
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
    </div>
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

    if (loading) return <div className="p-2">Loading items...</div>;

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
    <Card>
        <div className="flex justify-between items-center mb-4">
            <h3 className="flex items-center text-lg font-semibold text-text-primary"><Star size={20} className="mr-3" />Special Prices</h3>
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
                        <th className="p-2 font-semibold text-text-secondary">Product (Default Price)</th>
                        <th className="p-2 font-semibold text-text-secondary">Special Price</th>
                        <th className="p-2 font-semibold text-text-secondary">Start Date</th>
                        <th className="p-2 font-semibold text-text-secondary">End Date</th>
                    </tr>
                </thead>
                <tbody>
                    {skus.map(sku => {
                        const price = initialPrices.find(p => p.skuId === sku.id);
                        const edited = editedPrices[sku.id] || {};
                        const error = errors[sku.id] || {};

                        return (
                            <tr key={sku.id} className="border-b border-border last:border-0">
                                <td className="p-2 font-medium">{sku.name} <span className="text-xs text-text-secondary">({formatIndianCurrency(sku.price)})</span></td>
                                {isEditing ? (
                                    <>
                                        <td className="p-2"><Input type="number" placeholder="e.g., 85" value={edited.price ?? ''} onChange={e => handlePriceChange(sku.id, 'price', e.target.value)} error={error.price}/></td>
                                        <td className="p-2"><Input type="date" value={edited.startDate ?? ''} onChange={e => handlePriceChange(sku.id, 'startDate', e.target.value)} error={error.startDate}/></td>
                                        <td className="p-2"><Input type="date" value={edited.endDate ?? ''} onChange={e => handlePriceChange(sku.id, 'endDate', e.target.value)} error={error.endDate}/></td>
                                    </>
                                ) : (
                                    <>
                                        <td className={`p-2 font-semibold ${price ? 'text-green-600' : 'text-text-secondary'}`}>{price ? formatIndianCurrency(price.price) : 'Default'}</td>
                                        <td className="p-2">{price?.startDate}</td>
                                        <td className="p-2">{price?.endDate}</td>
                                    </>
                                )}
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    </Card>
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

    const { register, handleSubmit, formState: { errors, isValid }, reset, watch } = useForm<SchemeFormInputs>({mode: 'onBlur'});
    const watchStartDate = watch('startDate');
    
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
        <Card className="mt-4 border-t-2 border-primary">
            <form onSubmit={handleSubmit(onSave)}>
                <h4 className="text-md font-bold mb-4">{editingScheme?.id === 'new' ? 'New Special Scheme' : 'Edit Special Scheme'}</h4>
                <div className="space-y-4">
                    <Input label="Description" {...register('description', { required: "Description is required" })} error={errors.description?.message} />
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Start Date" type="date" {...register('startDate', { required: "Start date is required" })} error={errors.startDate?.message} />
                        <Input label="End Date" type="date" {...register('endDate', { required: "End date is required", validate: v => !watchStartDate || v >= watchStartDate || 'Must be after start' })} error={errors.endDate?.message} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-2 border rounded-md bg-background">
                            <p className="font-semibold text-sm mb-1">Condition (Buy)</p>
                            <div className="flex gap-2">
                                <Input label="Qty" type="number" {...register('buyQuantity', { required: true, valueAsNumber: true, min: 1 })} error={errors.buyQuantity?.message} />
                                <Select label="Product" {...register('buySkuId', { required: true })}>
                                    {skus.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </Select>
                            </div>
                        </div>
                         <div className="p-2 border rounded-md bg-green-50">
                            <p className="font-semibold text-sm mb-1">Reward (Get)</p>
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
        </Card>
    );

    return (
        <Card>
            <div className="flex justify-between items-center mb-4">
                <h3 className="flex items-center text-lg font-semibold text-text-primary"><Sparkles size={20} className="mr-3" />Special Schemes</h3>
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
                                <p className="text-xs text-text-secondary mt-1">Active: {scheme.startDate} to {scheme.endDate}</p>
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
                {initialSchemes.length === 0 && <p className="text-sm text-center text-text-secondary py-4">No special schemes assigned.</p>}
            </div>
            {editingScheme && renderEditor()}
        </Card>
    );
};

export default DistributorDetailsPage;
