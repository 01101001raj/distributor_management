import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/mockApiService';
import { Distributor, Order, WalletTransaction, TransactionType, SpecialPrice, Scheme, SKU, UserRole, EnrichedOrderItem, EnrichedWalletTransaction } from '../types';
import Card from './common/Card';
import { ArrowLeft, User, Phone, MapPin, Wallet, CreditCard, ShoppingCart, TrendingUp, TrendingDown, Star, Sparkles, PlusCircle, Save, X, Trash2, ChevronDown, ChevronRight, Gift, Edit } from 'lucide-react';
import Button from './common/Button';
import Input from './common/Input';
import Select from './common/Select';
import { useAuth } from '../hooks/useAuth';

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
  const { userRole } = useAuth();
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);


  const fetchData = async () => {
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
          setTransactions(transactionsData); // API now returns sorted oldest to newest
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
    };

  useEffect(() => {
    fetchData();
  }, [distributorId]);
  
  const toggleExpand = (orderId: string) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };
  
  const creditUsagePercent = distributor ? (distributor.creditLimit > 0 ? (distributor.creditUsed / distributor.creditLimit) * 100 : 0) : 0;

  if (loading) return <div className="flex justify-center items-center h-full"><p>Loading distributor details...</p></div>;
  if (error) return <Card className="text-center text-red-500">{error}</Card>;
  if (!distributor) return <Card className="text-center">Distributor not found.</Card>;

  const canEdit = userRole === UserRole.SUPER_ADMIN || userRole === UserRole.EXECUTIVE;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button onClick={() => navigate("/dashboard")} variant="secondary" size="sm">
          <ArrowLeft size={16} className="mr-2" />
          Back to Dashboard
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-black">{distributor.name}</h2>
              <p className="font-mono text-xs text-text-secondary mt-1">{distributor.id}</p>
            </div>
            <div className="mt-4 sm:mt-0 text-left sm:text-right">
                <p className="text-sm font-medium text-text-secondary">Date Added</p>
                <p className="font-semibold">{new Date(distributor.dateAdded).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center"><User size={16} className="mr-3 text-black" /><span className="font-semibold">Contact:</span>&nbsp;{distributor.phone}</div>
            <div className="flex items-center"><Phone size={16} className="mr-3 text-black" /><span className="font-semibold">Phone:</span>&nbsp;{distributor.phone}</div>
            <div className="flex items-center"><MapPin size={16} className="mr-3 text-black" /><span className="font-semibold">Location:</span>&nbsp;{distributor.area}, {distributor.state}</div>
            {distributor.agreementUrl && <a href={distributor.agreementUrl} target="_blank" rel="noopener noreferrer" className="text-black hover:underline">View Agreement</a>}
          </div>
        </Card>

        <Card>
           <h3 className="text-lg font-semibold mb-4 text-black">Financial Summary</h3>
            <div className="space-y-4">
                 <div>
                    <div className="flex items-center text-text-secondary"><Wallet size={16} className="mr-2"/> Wallet Balance</div>
                    <p className="text-2xl font-bold text-black">₹{distributor.walletBalance.toLocaleString()}</p>
                </div>
                 <div>
                    <div className="flex items-center text-text-secondary"><CreditCard size={16} className="mr-2"/> Credit Usage</div>
                    <p className="text-lg font-bold text-black">₹{distributor.creditUsed.toLocaleString()} / <span className="text-sm font-normal text-text-secondary">₹{distributor.creditLimit.toLocaleString()}</span></p>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                        <div className="bg-orange-500 h-2.5 rounded-full" style={{ width: `${creditUsagePercent}%` }}></div>
                    </div>
                </div>
            </div>
        </Card>
      </div>
      
      {distributor.hasSpecialPricing && <SpecialPricesManager distributorId={distributor.id} initialPrices={specialPrices} skus={skus} onUpdate={fetchData} canEdit={canEdit} />}
      {distributor.hasSpecialSchemes && <SpecialSchemesManager distributorId={distributor.id} initialSchemes={schemes} skus={skus} onUpdate={fetchData} canEdit={canEdit} />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="flex items-center text-lg font-semibold mb-4 text-black"><Wallet size={20} className="mr-3 text-black" />Wallet Transactions</h3>
          <div className="overflow-y-auto max-h-96">
            {transactions.length > 0 ? (
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-xs uppercase">
                    <tr>
                      <th className="p-2 font-semibold text-black">Date</th>
                      <th className="p-2 font-semibold text-black">Type</th>
                      <th className="p-2 font-semibold text-black text-right">Wallet</th>
                      <th className="p-2 font-semibold text-black text-right">Credit</th>
                      <th className="p-2 font-semibold text-black text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map(t => (
                      <tr key={t.id} className="border-b last:border-0 text-sm">
                        <td className="p-2 text-xs text-text-secondary">{new Date(t.date).toLocaleString()}</td>
                        <td className="p-2 capitalize font-medium">{t.type.replace('_', ' ').toLowerCase()}</td>
                        <td className={`p-2 font-semibold text-right ${t.amount >= 0 ? 'text-black' : 'text-black'}`}>
                          {t.amount >= 0 ? '+' : ''}₹{t.amount.toLocaleString()}
                        </td>
                        <td className="p-2 font-semibold text-right text-black">
                          {t.creditAmount ? `₹${Math.abs(t.creditAmount).toLocaleString()}` : '-'}
                        </td>
                        <td className="p-2 font-bold text-right text-black">
                          ₹{t.balanceAfter.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            ) : <p className="text-center text-black py-4">No wallet transactions found.</p>}
          </div>
        </Card>
        
        <Card>
          <h3 className="flex items-center text-lg font-semibold mb-4 text-black"><ShoppingCart size={20} className="mr-3 text-black" />Order History</h3>
           <div className="overflow-y-auto max-h-96">
            {orders.length > 0 ? (
                <table className="w-full text-left">
                  <thead className="border-b bg-gray-50">
                      <tr>
                          <th className="p-2 w-10"></th>
                          <th className="p-2 text-sm font-semibold text-black">Order ID</th>
                          <th className="p-2 text-sm font-semibold text-black">Date</th>
                          <th className="p-2 text-sm font-semibold text-black text-right">Amount</th>
                      </tr>
                  </thead>
                  <tbody>
                      {orders.map(o => (
                          <React.Fragment key={o.id}>
                              <tr className="border-b last:border-0 hover:bg-gray-50 cursor-pointer" onClick={() => toggleExpand(o.id)}>
                                  <td className="p-2 text-center">
                                      {expandedOrderId === o.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                  </td>
                                  <td className="p-2 font-mono text-xs">{o.id}</td>
                                  <td className="p-2 text-sm">{new Date(o.date).toLocaleDateString()}</td>
                                  <td className="p-2 font-semibold text-right">₹{o.totalAmount.toLocaleString()}</td>
                              </tr>
                              {expandedOrderId === o.id && (
                                  <tr className="bg-blue-50/50">
                                      <td colSpan={4} className="p-4">
                                          <OrderDetails orderId={o.id} />
                                      </td>
                                  </tr>
                              )}
                          </React.Fragment>
                      ))}
                  </tbody>
              </table>
            ) : <p className="text-center text-black py-4">No orders found.</p>}
          </div>
        </Card>
      </div>
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

// --- SpecialPricesManager Sub-component ---
const SpecialPricesManager: React.FC<{ distributorId: string; initialPrices: SpecialPrice[]; skus: SKU[]; onUpdate: () => void; canEdit: boolean }> = ({ distributorId, initialPrices, skus, onUpdate, canEdit }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedPrices, setEditedPrices] = useState<Record<string, Partial<Omit<SpecialPrice, 'id' | 'distributorId'>>>>({});
    const [error, setError] = useState('');

    const handleEditClick = () => {
        const priceMap = initialPrices.reduce((acc, price) => {
            acc[price.skuId] = {
                price: price.price,
                startDate: price.startDate,
                endDate: price.endDate,
                skuId: price.skuId
            };
            return acc;
        }, {} as Record<string, Partial<Omit<SpecialPrice, 'id' | 'distributorId'>>>);
        setEditedPrices(priceMap);
        setIsEditing(true);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditedPrices({});
        setError('');
    };

    const handleSave = async () => {
        const promises: Promise<any>[] = [];
        const initialPriceMap = new Map(initialPrices.map(p => [p.skuId, p]));

        let hasError = false;
        for (const sku of skus) {
            const edited = editedPrices[sku.id];
            if (!edited) continue; // Nothing was touched for this SKU

            const hasPrice = edited.price !== undefined && edited.price > 0;
            const hasStartDate = edited.startDate && edited.startDate.length > 0;
            const hasEndDate = edited.endDate && edited.endDate.length > 0;

            // validation: if one field is filled, all must be.
            if ([hasPrice, hasStartDate, hasEndDate].some(Boolean) && ![hasPrice, hasStartDate, hasEndDate].every(Boolean)) {
                 setError(`Please fill out all fields (Price, Start Date, End Date) for ${sku.name} or clear them all.`);
                 hasError = true;
                 break;
            }

            if (hasPrice && hasStartDate && hasEndDate) {
                if (new Date(edited.startDate!) > new Date(edited.endDate!)) {
                    setError(`Start Date cannot be after End Date for ${sku.name}.`);
                    hasError = true;
                    break;
                }
                const initial = initialPriceMap.get(sku.id);
                if (initial) {
                    if (initial.price !== edited.price || initial.startDate !== edited.startDate || initial.endDate !== edited.endDate) {
                         promises.push(api.updateSpecialPrice({ ...initial, ...edited, price: edited.price! }));
                    }
                } else {
                    promises.push(api.addSpecialPrice({
                        distributorId,
                        skuId: sku.id,
                        price: edited.price!,
                        startDate: edited.startDate!,
                        endDate: edited.endDate!,
                    }));
                }
            } else {
                 const initial = initialPriceMap.get(sku.id);
                 if (initial) {
                     promises.push(api.deleteSpecialPrice(initial.id));
                 }
            }
        }
        
        if (hasError) return;

        setError('');
        await Promise.all(promises);
        onUpdate();
        setIsEditing(false);
    };

    const handleInputChange = (skuId: string, field: 'price' | 'startDate' | 'endDate', value: string) => {
        setEditedPrices(prev => ({
            ...prev,
            [skuId]: {
                ...prev[skuId],
                skuId: skuId,
                [field]: field === 'price' ? (parseFloat(value) || undefined) : value,
            }
        }));
    };
    
    return (
        <Card>
            <div className="flex justify-between items-center mb-4">
                <h3 className="flex items-center text-lg font-semibold text-black"><Star size={20} className="mr-3 text-yellow-500" />Special Pricing</h3>
                {canEdit && !isEditing && <Button onClick={handleEditClick}><Edit size={16} className="mr-2"/> Manage Prices</Button>}
            </div>
            
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-3">Product</th>
                            <th className="p-3 text-center">Default Price</th>
                            <th className="p-3 text-center">{isEditing ? 'Special Price (₹)' : 'Special Price'}</th>
                            {isEditing && <>
                                <th className="p-3 text-center">Start Date</th>
                                <th className="p-3 text-center">End Date</th>
                            </>}
                        </tr>
                    </thead>
                    <tbody>
                        {skus.map(sku => {
                            if (isEditing) {
                                const edited = editedPrices[sku.id] || {};
                                return (
                                    <tr key={sku.id} className="border-b">
                                        <td className="p-2 font-medium">{sku.name}</td>
                                        <td className="p-2 text-center">₹{sku.price.toLocaleString()}</td>
                                        <td className="p-2"><Input label="" type="number" placeholder="Default" value={edited.price ?? ''} onChange={(e) => handleInputChange(sku.id, 'price', e.target.value)} /></td>
                                        <td className="p-2"><Input label="" type="date" value={edited.startDate ?? ''} onChange={(e) => handleInputChange(sku.id, 'startDate', e.target.value)} /></td>
                                        <td className="p-2"><Input label="" type="date" value={edited.endDate ?? ''} onChange={(e) => handleInputChange(sku.id, 'endDate', e.target.value)} /></td>
                                    </tr>
                                );
                            } else {
                                const special = initialPrices.find(p => p.skuId === sku.id);
                                return (
                                    <tr key={sku.id} className="border-b">
                                        <td className="p-3 font-medium">{sku.name}</td>
                                        <td className="p-3 text-center">₹{sku.price.toLocaleString()}</td>
                                        <td className={`p-3 font-semibold text-center ${special ? 'text-black' : 'text-gray-400'}`}>
                                            {special ? `₹${special.price.toLocaleString()}` : 'N/A'}
                                            {special && <p className="text-xs font-normal">({special.startDate} to {special.endDate})</p>}
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
                    <Button onClick={handleSave} size="sm">Save Changes</Button>
                    <Button onClick={handleCancel} variant="secondary" size="sm">Cancel</Button>
                </div>
            )}
        </Card>
    );
};

// --- SpecialSchemesManager Sub-component ---
const SpecialSchemesManager: React.FC<{ distributorId: string; initialSchemes: Scheme[]; skus: SKU[]; onUpdate: () => void; canEdit: boolean }> = ({ distributorId, initialSchemes, skus, onUpdate, canEdit }) => {
    const { userRole } = useAuth();
    const [editingSchemeId, setEditingSchemeId] = useState<string | null>(null);
    const [editedScheme, setEditedScheme] = useState<Partial<Scheme>>({});
    const [error, setError] = useState('');

    const handleAddNew = () => {
        setEditedScheme({
            buySkuId: skus[0]?.id || '',
            getSkuId: skus[0]?.id || '',
            buyQuantity: 1,
            getQuantity: 1,
            description: ''
        });
        setEditingSchemeId('new');
    };

    const handleEdit = (scheme: Scheme) => {
        setEditingSchemeId(scheme.id);
        setEditedScheme(scheme);
    };

    const handleCancel = () => {
        setEditingSchemeId(null);
        setEditedScheme({});
        setError('');
    };

    const handleSave = async () => {
        const { description, buySkuId, buyQuantity, getSkuId, getQuantity } = editedScheme;
        if (!description || !buySkuId || !buyQuantity || !getSkuId || !getQuantity || buyQuantity <= 0 || getQuantity <= 0) {
            setError("All fields are required and quantities must be positive.");
            return;
        }
        setError('');
        
        const isAdding = editingSchemeId === 'new';

        try {
             if (isAdding) {
                const payload = { description, buySkuId, buyQuantity, getSkuId, getQuantity, isGlobal: false, distributorId };
                await api.addScheme(payload, userRole!);
            } else {
                await api.updateScheme(editedScheme as Scheme, userRole!);
            }
            onUpdate();
            handleCancel();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save scheme.');
        }
    };
    
     const handleDelete = async (id: string) => {
        if (window.confirm('Delete this special scheme?')) {
            await api.deleteScheme(id, userRole!);
            onUpdate();
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      const isNumeric = ['buyQuantity', 'getQuantity'].includes(name);
      setEditedScheme(prev => ({ ...prev, [name]: isNumeric ? parseInt(value) || 0 : value }));
    };

    const getSkuName = (id?: string) => skus.find(sku => sku.id === id)?.name || 'N/A';

    const renderEditRow = (isNew: boolean) => (
        <tr className="bg-blue-50">
            <td className="p-2"><Input label="" name="description" placeholder="e.g., Monsoon Bonanza" value={editedScheme.description || ''} onChange={handleInputChange} /></td>
            <td className="p-2">
                <div className="flex gap-2 items-center">
                    <Input label="" type="number" name="buyQuantity" value={editedScheme.buyQuantity || ''} onChange={handleInputChange} className="w-20" />
                    <span>x</span>
                    <Select label="" name="buySkuId" value={editedScheme.buySkuId} onChange={handleInputChange}>{skus.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</Select>
                </div>
            </td>
            <td className="p-2">
                <div className="flex gap-2 items-center">
                    <Input label="" type="number" name="getQuantity" value={editedScheme.getQuantity || ''} onChange={handleInputChange} className="w-20" />
                    <span>x</span>
                    <Select label="" name="getSkuId" value={editedScheme.getSkuId} onChange={handleInputChange}>{skus.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</Select>
                </div>
            </td>
            <td className="p-2 text-right space-x-2">
                <Button onClick={handleSave} size="sm" className="p-2"><Save size={16} /></Button>
                <Button onClick={handleCancel} variant="secondary" size="sm" className="p-2"><X size={16} /></Button>
            </td>
        </tr>
    );

    return (
        <Card>
            <div className="flex justify-between items-center mb-4">
                <h3 className="flex items-center text-lg font-semibold text-black"><Sparkles size={20} className="mr-3 text-blue-500" />Special Schemes</h3>
                {canEdit && <Button onClick={handleAddNew} disabled={!!editingSchemeId}><PlusCircle size={16} className="mr-2"/> Add Scheme</Button>}
            </div>
            {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
            
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-3 w-1/3">Description</th>
                            <th className="p-3">Buy</th>
                            <th className="p-3">Get Free</th>
                            {canEdit && <th className="p-3 text-right">Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {editingSchemeId === 'new' && renderEditRow(true)}
                        {initialSchemes.map(s => (
                             editingSchemeId === s.id
                             ? renderEditRow(false)
                             : (
                                <tr key={s.id} className="border-b">
                                    <td className="p-3">{s.description}</td>
                                    <td className="p-3">{s.buyQuantity} x {getSkuName(s.buySkuId)}</td>
                                    <td className="p-3">{s.getQuantity} x {getSkuName(s.getSkuId)}</td>
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
                            <tr><td colSpan={canEdit ? 4 : 3} className="text-center p-4 text-gray-500">No special schemes assigned to this distributor.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}

export default DistributorDetailsPage;
