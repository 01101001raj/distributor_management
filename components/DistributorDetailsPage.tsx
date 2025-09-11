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
          setOrders(ordersData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
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
      const baseClasses = "px-2.5 py-1 text-xs font-medium rounded-full inline-block";
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
          <div className={`p-3 rounded-lg flex items-center ${statusMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {statusMessage.type === 'success' ? <CheckCircle className="mr-2" /> : <XCircle className="mr-2" />}
              {statusMessage.text}
          </div>
      )}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center sm:justify-between gap-4">
        <Button onClick={() => navigate("/dashboard")} variant="secondary" size="sm">
          <ArrowLeft size={16} className="mr-2" />
          Back to Dashboard
        </Button>
        {canEdit && (
            <div className="flex flex-col sm:flex-row items-stretch gap-2">
                <Button onClick={() => navigate('/recharge-wallet', { state: { distributorId: distributor.id } })} variant="secondary">
                    <Wallet size={16} className="mr-2" />
                    Recharge Wallet
                </Button>
                <Button onClick={() => navigate('/place-order', { state: { distributorId: distributor.id } })}>
                    <ShoppingCart size={16} className="mr-2" />
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
                        <span className="flex items-center gap-1 bg-blue-100 text-primary text-xs font-medium px-2.5 py-0.5 rounded-full">
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
      {distributor.hasSpecialSchemes && <SpecialSchemesManager distributorId={distributor.id} initialSchemes={schemes} skus={skus} onUpdate={fetchData} canEdit={canEdit} />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="flex items-center text-lg font-semibold mb-4 text-text-primary"><Wallet size={20} className="mr-3" />Wallet Transactions</h3>
          <div className="overflow-y-auto max-h-96 overflow-x-auto">
            {transactions.length > 0 ? (
                <table className="w-full text-left min-w-[400px]">
                  <thead className="bg-background text-xs uppercase sticky top-0">
                    <tr className="border-b border-border">
                      <th className="p-2 font-semibold text-text-secondary">Date</th>
                      <th className="p-2 font-semibold text-text-secondary">Type</th>
                      <th className="p-2 font-semibold text-text-secondary text-right">Amount</th>
                      <th className="p-2 font-semibold text-text-secondary text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map(t => (
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
            {orders.length > 0 ? (
                <table className="w-full text-left min-w-[600px]">
                  <thead className="border-b border-border bg-background sticky top-0">
                      <tr>
                          <th className="p-2 w-10"></th>
                          <th className="p-2 text-xs font-semibold text-text-secondary uppercase tracking-wider">Order ID</th>
                          <th className="p-2 text-xs font-semibold text-text-secondary uppercase tracking-wider">Date</th>
                          <th className="p-2 text-xs font-semibold text-text-secondary uppercase tracking-wider">Status</th>
                          <th className="p-2 text-xs font-semibold text-text-secondary uppercase tracking-wider text-right">Amount</th>
                      </tr>
                  </thead>
                  <tbody>
                      {orders.map(o => (
                          <React.Fragment key={o.id}>
                              <tr className="border-b border-border last:border-0 hover:bg-background">
                                  <td className="p-2 text-center">
                                      <button onClick={() => toggleExpand(o.id)} className="hover:bg-gray-200 rounded-full p-1 disabled:opacity-50" disabled={!!updatingOrderId}>
                                        {expandedOrderId === o.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                      </button>
                                  </td>
                                  <td className="p-2 font-mono text-xs cursor-pointer" onClick={() => toggleExpand(o.id)}>{o.id}</td>
                                  <td className="p-2 text-sm cursor-pointer" onClick={() => toggleExpand(o.id)}>{new Date(o.date).toLocaleDateString()}</td>
                                  <td className="p-2 cursor-pointer" onClick={() => toggleExpand(o.id)}>{getStatusChip(o.status)}</td>
                                  <td className="p-2 font-semibold text-right cursor-pointer" onClick={() => toggleExpand(o.id)}>{formatIndianCurrency(o.totalAmount)}</td>
                              </tr>
                               {o.status === OrderStatus.PENDING && (
                                  <tr className="border-b border-border last:border-0">
                                      <td colSpan={5} className="py-2 px-4 text-right bg-background">
                                          <div className="flex justify-end gap-2">
                                              <Button size="sm" variant="secondary" onClick={() => setEditingOrder(o)} disabled={!!updatingOrderId}><Edit size={14} className="mr-1"/> Edit</Button>
                                              <Button size="sm" variant="primary" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleMarkDelivered(o.id)} isLoading={updatingOrderId === o.id} disabled={!!updatingOrderId}><CheckCircle size={14} className="mr-1"/> Deliver</Button>
                                          </div>
                                      </td>
                                  </tr>
                               )}
                              {expandedOrderId === o.id && (
                                  <tr className="bg-blue-50/50">
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
        const hasPrice = price !== undefined && String(price).length > 0;
        const hasStartDate = startDate && startDate.length > 0;
        const hasEndDate = endDate && endDate.length > 0;

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

    const handleEditClick = () => {
        const priceMap = initialPrices.reduce((acc, price) => {
            acc[price.skuId] = { price: price.price, startDate: price.startDate, endDate: price.endDate, skuId: price.skuId };
            return acc;
        }, {} as Record<string, Partial<Omit<SpecialPrice, 'id' | 'distributorId'>>>);
        setEditedPrices(priceMap);
        setIsEditing(true);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditedPrices({});
        setErrors({});
    };

    const handleSave = async () => {
        let isFormValid = true;
        skus.forEach(sku => {
            const data = editedPrices[sku.id] || {};
            if (Object.values(data).some(v => v !== undefined && v !== '')) {
                if (!validateRow(sku.id, data)) {
                    isFormValid = false;
                }
            }
        });
        
        if (!isFormValid) {
            return;
        }
        
        const promises: Promise<any>[] = [];
        const initialPriceMap = new Map(initialPrices.map(p => [p.skuId, p]));

        for (const sku of skus) {
            const edited = editedPrices[sku.id];
            if (!edited) continue;

            const hasData = edited.price && edited.startDate && edited.endDate;

            if (hasData) {
                 const initial = initialPriceMap.get(sku.id);
                 if (initial) { // It's an update
                     promises.push(api.updateSpecialPrice({ ...initial, ...edited, price: edited.price! }));
                 } else { // It's a new entry
                     promises.push(api.addSpecialPrice({ distributorId, skuId: sku.id, price: edited.price!, startDate: edited.startDate!, endDate: edited.endDate! }));
                 }
            } else {
                 const initial = initialPriceMap.get(sku.id);
                 if (initial) { // It needs to be deleted
                     promises.push(api.deleteSpecialPrice(initial.id));
                 }
            }
        }
        
        await Promise.all(promises);
        onUpdate();
        setIsEditing(false);
    };

    const handleInputChange = (skuId: string, field: 'price' | 'startDate' | 'endDate', value: string) => {
        const updatedRowData = {
            ...editedPrices[skuId],
            skuId: skuId,
            [field]: field === 'price' ? (value === '' ? undefined : parseFloat(value)) : value,
        };
        setEditedPrices(prev => ({ ...prev, [skuId]: updatedRowData }));
        validateRow(skuId, updatedRowData);
    };

    const hasErrors = Object.values(errors).some(err => Object.keys(err).length > 0);
    
    return (
        <Card>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                <h3 className="flex items-center text-lg font-semibold text-text-primary"><Star size={20} className="mr-3 text-yellow-500" />Special Pricing</h3>
                {canEdit && !isEditing && <Button onClick={handleEditClick}><Edit size={16} className="mr-2"/> Manage Prices</Button>}
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[600px]">
                    <thead className="bg-background">
                        <tr className="border-b border-border">
                            <th className="p-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Product</th>
                            <th className="p-3 text-xs font-semibold text-text-secondary uppercase tracking-wider text-center">Default Price</th>
                            <th className="p-3 text-xs font-semibold text-text-secondary uppercase tracking-wider text-center">{isEditing ? 'Special Price' : 'Special Price'}</th>
                            {isEditing && <>
                                <th className="p-3 text-xs font-semibold text-text-secondary uppercase tracking-wider text-center">Start Date</th>
                                <th className="p-3 text-xs font-semibold text-text-secondary uppercase tracking-wider text-center">End Date</th>
                            </>}
                        </tr>
                    </thead>
                    <tbody>
                        {skus.map(sku => {
                            if (isEditing) {
                                const edited = editedPrices[sku.id] || {};
                                const error = errors[sku.id] || {};
                                return (
                                    <tr key={sku.id} className="border-b border-border last:border-b-0">
                                        <td className="p-2 font-medium">{sku.name}</td>
                                        <td className="p-2 text-center text-text-secondary">{formatIndianCurrency(sku.price)}</td>
                                        <td className="p-2 min-w-[120px]"><Input type="number" placeholder="Default" value={edited.price ?? ''} onChange={(e) => handleInputChange(sku.id, 'price', e.target.value)} error={error.price} /></td>
                                        <td className="p-2 min-w-[160px]"><Input type="date" value={edited.startDate ?? ''} onChange={(e) => handleInputChange(sku.id, 'startDate', e.target.value)} error={error.startDate} /></td>
                                        <td className="p-2 min-w-[200px]"><Input type="date" value={edited.endDate ?? ''} onChange={(e) => handleInputChange(sku.id, 'endDate', e.target.value)} error={error.endDate} /></td>
                                    </tr>
                                );
                            } else {
                                const special = initialPrices.find(p => p.skuId === sku.id);
                                return (
                                    <tr key={sku.id} className="border-b border-border last:border-b-0">
                                        <td className="p-3 font-medium">{sku.name}</td>
                                        <td className="p-3 text-center text-text-secondary">{formatIndianCurrency(sku.price)}</td>
                                        <td className={`p-3 font-semibold text-center ${special ? 'text-text-primary' : 'text-text-secondary opacity-60'}`}>
                                            {special ? formatIndianCurrency(special.price) : 'N/A'}
                                            {special && <p className="text-xs font-normal text-text-secondary">({special.startDate} to {special.endDate})</p>}
                                        </td>
                                    </tr>
                                )
                            }
                        })}
                    </tbody>
                </table>
            </div>
            {isEditing && (
                <div className="flex justify-end gap-2 mt-4">
                    <Button onClick={handleSave} size="sm" disabled={hasErrors}>Save Changes</Button>
                    <Button onClick={handleCancel} variant="secondary" size="sm">Cancel</Button>
                </div>
            )}
        </Card>
    );
};

// --- SpecialSchemesManager Sub-component ---
type SchemeFormInputs = Omit<Scheme, 'id' | 'isGlobal' | 'distributorId'>;

const SpecialSchemesManager: React.FC<{ distributorId: string; initialSchemes: Scheme[]; skus: SKU[]; onUpdate: () => void; canEdit: boolean }> = ({ distributorId, initialSchemes, skus, onUpdate, canEdit }) => {
    const { userRole } = useAuth();
    const [editingSchemeId, setEditingSchemeId] = useState<string | null>(null);

    const { register, handleSubmit, formState: { errors, isValid }, reset, watch } = useForm<SchemeFormInputs>({
        mode: 'onBlur',
    });
    const watchStartDate = watch('startDate');

    const handleAddNew = () => {
        reset({ 
            buySkuId: skus[0]?.id || '', 
            getSkuId: skus[0]?.id || '', 
            buyQuantity: 1, 
            getQuantity: 1, 
            description: '',
            startDate: new Date().toISOString().split('T')[0],
            endDate: '',
        });
        setEditingSchemeId('new');
    };

    const handleEdit = (scheme: Scheme) => {
        reset(scheme);
        setEditingSchemeId(scheme.id);
    };

    const handleCancel = () => {
        setEditingSchemeId(null);
        reset({});
    };

    const onSave: SubmitHandler<SchemeFormInputs> = async (data) => {
        if (!userRole) return;
        const isAdding = editingSchemeId === 'new';

        try {
             if (isAdding) {
                const payload = { ...data, isGlobal: false, distributorId };
                await api.addScheme(payload, userRole);
            } else {
                await api.updateScheme({ ...data, id: editingSchemeId!, isGlobal: false, distributorId }, userRole);
            }
            onUpdate();
            handleCancel();
        } catch (err) {
            console.error(err);
        }
    };
    
     const handleDelete = async (id: string) => {
        if (userRole && window.confirm('Delete this special scheme?')) {
            await api.deleteScheme(id, userRole);
            onUpdate();
        }
    };

    const getSkuName = (id?: string) => skus.find(sku => sku.id === id)?.name || 'N/A';

    const renderEditRow = () => (
        <tr className="bg-blue-50">
            <td className="p-2 min-w-[200px]"><Input placeholder="e.g., Monsoon Bonanza" {...register('description', { required: 'Description is required' })} error={errors.description?.message} /></td>
            <td className="p-2 min-w-[250px]">
                <div className="flex gap-2 items-center">
                    <Input type="number" className="w-20" {...register('buyQuantity', { required: true, valueAsNumber: true, min: 1 })} />
                    <span>x</span>
                    <Select {...register('buySkuId', { required: true })}>{skus.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</Select>
                </div>
            </td>
            <td className="p-2 min-w-[250px]">
                <div className="flex gap-2 items-center">
                    <Input type="number" className="w-20" {...register('getQuantity', { required: true, valueAsNumber: true, min: 1 })} />
                    <span>x</span>
                    <Select {...register('getSkuId', { required: true })}>{skus.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</Select>
                </div>
            </td>
            <td className="p-2 min-w-[160px]">
                <Input type="date" {...register('startDate', { required: true })} error={errors.startDate?.message} />
            </td>
            <td className="p-2 min-w-[160px]">
                <Input type="date" {...register('endDate', { 
                    required: true, 
                    validate: (value) => !watchStartDate || value >= watchStartDate || 'End date must be on or after start date' 
                })} error={errors.endDate?.message} />
            </td>
            <td className="p-2 text-right space-x-2">
                <Button onClick={handleSubmit(onSave)} size="sm" className="p-2" disabled={!isValid}><Save size={16} /></Button>
                <Button onClick={handleCancel} variant="secondary" size="sm" className="p-2"><X size={16} /></Button>
            </td>
        </tr>
    );

    return (
        <Card>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                <h3 className="flex items-center text-lg font-semibold text-text-primary"><Sparkles size={20} className="mr-3 text-primary" />Special Schemes</h3>
                {canEdit && <Button onClick={handleAddNew} disabled={!!editingSchemeId}><PlusCircle size={16} className="mr-2"/> Add Scheme</Button>}
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[1000px]">
                    <thead className="bg-background">
                        <tr className="border-b border-border">
                            <th className="p-3 w-1/4 text-xs font-semibold text-text-secondary uppercase tracking-wider">Description</th>
                            <th className="p-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Buy</th>
                            <th className="p-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Get Free</th>
                            <th className="p-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Start Date</th>
                            <th className="p-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">End Date</th>
                            {canEdit && <th className="p-3 text-xs font-semibold text-text-secondary uppercase tracking-wider text-right">Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {editingSchemeId === 'new' && renderEditRow()}
                        {initialSchemes.map(s => (
                             editingSchemeId === s.id
                             ? renderEditRow()
                             : (
                                <tr key={s.id} className="border-b border-border last:border-b-0">
                                    <td className="p-3">{s.description}</td>
                                    <td className="p-3">{s.buyQuantity} x {getSkuName(s.buySkuId)}</td>
                                    <td className="p-3">{s.getQuantity} x {getSkuName(s.getSkuId)}</td>
                                    <td className="p-3">{s.startDate}</td>
                                    <td className="p-3">{s.endDate}</td>
                                    {canEdit && 
                                        <td className="p-3 text-right space-x-2">
                                            <Button onClick={() => handleEdit(s)} variant="secondary" size="sm" className="p-2" disabled={!!editingSchemeId}><Edit size={16}/></Button>
                                            <Button onClick={() => handleDelete(s.id)} variant="danger" size="sm" className="p-2" disabled={!!editingSchemeId}><Trash2 size={16}/></Button>
                                        </td>
                                    }
                                </tr>
                            )
                        ))}
                        {initialSchemes.length === 0 && editingSchemeId !== 'new' && (
                            <tr><td colSpan={canEdit ? 6 : 5} className="text-center p-4 text-gray-500">No special schemes assigned to this distributor.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}

export default DistributorDetailsPage;