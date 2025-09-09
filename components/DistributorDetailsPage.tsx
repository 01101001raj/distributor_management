import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/mockApiService';
import { Distributor, Order, WalletTransaction, TransactionType, SpecialPrice, Scheme, SKU, UserRole, EnrichedOrderItem } from '../types';
import Card from './common/Card';
import { ArrowLeft, User, Phone, MapPin, Wallet, CreditCard, ShoppingCart, TrendingUp, TrendingDown, Star, Sparkles, PlusCircle, Edit, Save, X, Trash2, ChevronDown, ChevronRight, Gift } from 'lucide-react';
import Button from './common/Button';
import Input from './common/Input';
import Select from './common/Select';
import { useAuth } from '../hooks/useAuth';

const DistributorDetailsPage: React.FC = () => {
  const { distributorId } = useParams<{ distributorId: string }>();
  const navigate = useNavigate();
  const [distributor, setDistributor] = useState<Distributor | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
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
          setTransactions(transactionsData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
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
                <ul className="space-y-3">
                    {transactions.map(t => (
                        <li key={t.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                            <div className="flex items-center">
                                {t.type === TransactionType.RECHARGE ? <TrendingUp size={20} className="text-black mr-3"/> : <TrendingDown size={20} className="text-black mr-3"/>}
                                <div>
                                    <p className="font-semibold capitalize">{t.type.replace('_', ' ').toLowerCase()}</p>
                                    <p className="text-xs text-text-secondary">{new Date(t.date).toLocaleString()}</p>
                                </div>
                            </div>
                            <p className={`font-bold text-lg text-black`}>{t.type === TransactionType.RECHARGE ? '+' : ''}₹{Math.abs(t.amount).toLocaleString()}</p>
                        </li>
                    ))}
                </ul>
            ) : <p className="text-center text-black py-4">No wallet transactions found.</p>}
          </div>
        </Card>
        
        <Card>
          <h3 className="flex items-center text-lg font-semibold mb-4 text-black"><ShoppingCart size={20} className="mr-3 text-black" />Order History</h3>
           <div className="overflow-y-auto max-h-96">
            {orders.length > 0 ? (
                <table className="w-full text-left">
                  <thead>
                      <tr className="border-b bg-gray-50">
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
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [editedPrice, setEditedPrice] = useState<Partial<SpecialPrice>>({});
    const [error, setError] = useState('');
    
    const handleSave = async () => {
        if (!editedPrice.skuId || !editedPrice.price || !editedPrice.startDate || !editedPrice.endDate) {
            setError('All fields are required.');
            return;
        }
        setError('');
        try {
            if (isAdding) {
                await api.addSpecialPrice({ distributorId, skuId: editedPrice.skuId, price: editedPrice.price, startDate: editedPrice.startDate, endDate: editedPrice.endDate });
            } else {
                await api.updateSpecialPrice(editedPrice as SpecialPrice);
            }
            onUpdate();
            setIsAdding(false);
            setEditingId(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save price.');
        }
    };
    
    const handleDelete = async (id: string) => {
        if (window.confirm('Delete this special price?')) {
            await api.deleteSpecialPrice(id);
            onUpdate();
        }
    }
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setEditedPrice(prev => ({ ...prev, [name]: name === 'price' ? parseFloat(value) : value }));
    };

    return (
        <Card>
            <div className="flex justify-between items-center mb-4">
                <h3 className="flex items-center text-lg font-semibold text-black"><Star size={20} className="mr-3 text-yellow-500" />Special Pricing</h3>
                {canEdit && <Button onClick={() => { setIsAdding(true); setEditingId('new'); setEditedPrice({ skuId: skus[0]?.id || '', price: 0, startDate: '', endDate: '' })}} disabled={isAdding}><PlusCircle size={16} className="mr-2"/> Add Price</Button>}
            </div>
            {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
            <table className="w-full text-left">
                <thead className="bg-gray-50"><tr><th className="p-2">Product</th><th className="p-2">Special Price</th><th className="p-2">Start Date</th><th className="p-2">End Date</th>{canEdit && <th className="p-2 text-right">Actions</th>}</tr></thead>
                <tbody>
                    {isAdding && (
                         <tr className="bg-blue-50">
                            <td className="p-2"><Select label="" name="skuId" value={editedPrice.skuId} onChange={handleInputChange}>{skus.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></td>
                            <td className="p-2"><Input label="" type="number" name="price" value={editedPrice.price || ''} onChange={handleInputChange} /></td>
                            <td className="p-2"><Input label="" type="date" name="startDate" value={editedPrice.startDate || ''} onChange={handleInputChange} /></td>
                            <td className="p-2"><Input label="" type="date" name="endDate" value={editedPrice.endDate || ''} onChange={handleInputChange} /></td>
                            <td className="p-2 text-right space-x-2"><Button onClick={handleSave} size="sm" className="p-2"><Save size={16}/></Button><Button onClick={() => setIsAdding(false)} variant="secondary" size="sm" className="p-2"><X size={16}/></Button></td>
                        </tr>
                    )}
                    {initialPrices.map(p => (
                        editingId === p.id ? (
                            <tr key={p.id} className="bg-blue-50">...</tr>
                        ) : (
                            <tr key={p.id} className="border-b">
                                <td className="p-2">{skus.find(s => s.id === p.skuId)?.name}</td>
                                <td className="p-2 font-semibold">₹{p.price.toLocaleString()}</td>
                                <td className="p-2">{p.startDate}</td>
                                <td className="p-2">{p.endDate}</td>
                                {canEdit && <td className="p-2 text-right"><Button onClick={() => handleDelete(p.id)} variant="danger" size="sm" className="p-2"><Trash2 size={16}/></Button></td>}
                            </tr>
                        )
                    ))}
                </tbody>
            </table>
        </Card>
    );
};

// --- SpecialSchemesManager Sub-component ---
const SpecialSchemesManager: React.FC<{ distributorId: string; initialSchemes: Scheme[]; skus: SKU[]; onUpdate: () => void; canEdit: boolean }> = ({ distributorId, initialSchemes, skus, onUpdate, canEdit }) => {
    const { userRole } = useAuth();
    const [isAdding, setIsAdding] = useState(false);
    const [editedScheme, setEditedScheme] = useState<Partial<Scheme>>({});

    const handleSave = async () => {
        const { description, buySkuId, buyQuantity, getSkuId, getQuantity } = editedScheme;
        if (!description || !buySkuId || !buyQuantity || !getSkuId || !getQuantity) return;
        
        const payload = { description, buySkuId, buyQuantity, getSkuId, getQuantity, isGlobal: false, distributorId };
        
        if(isAdding) {
            await api.addScheme(payload, userRole);
        }
        onUpdate();
        setIsAdding(false);
    }
    
     const handleDelete = async (id: string) => {
        if (window.confirm('Delete this special scheme?')) {
            await api.deleteScheme(id, userRole);
            onUpdate();
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      const isNumeric = ['buyQuantity', 'getQuantity'].includes(name);
      setEditedScheme(prev => ({ ...prev, [name]: isNumeric ? parseInt(value) : value }));
    };

    return (
        <Card>
            <div className="flex justify-between items-center mb-4">
                <h3 className="flex items-center text-lg font-semibold text-black"><Sparkles size={20} className="mr-3 text-blue-500" />Special Schemes</h3>
                {canEdit && <Button onClick={() => setIsAdding(true)} disabled={isAdding}><PlusCircle size={16} className="mr-2"/> Add Scheme</Button>}
            </div>
            {isAdding && (
                <div className="p-4 bg-blue-50 rounded-lg mb-4 space-y-4">
                    <Input label="Description" name="description" onChange={handleInputChange} />
                    <div className="grid grid-cols-2 gap-4">
                        <Select label="Buy SKU" name="buySkuId" onChange={handleInputChange}>{skus.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</Select>
                        <Input label="Buy Quantity" name="buyQuantity" type="number" onChange={handleInputChange} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Select label="Get SKU (Free)" name="getSkuId" onChange={handleInputChange}>{skus.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</Select>
                        <Input label="Get Quantity" name="getQuantity" type="number" onChange={handleInputChange} />
                    </div>
                    <div className="flex justify-end gap-2"><Button onClick={handleSave} size="sm">Save</Button><Button onClick={() => setIsAdding(false)} variant="secondary" size="sm">Cancel</Button></div>
                </div>
            )}
            <table className="w-full text-left">
                 <thead className="bg-gray-50"><tr><th className="p-2">Description</th><th className="p-2">Buy</th><th className="p-2">Get Free</th>{canEdit && <th className="p-2 text-right">Actions</th>}</tr></thead>
                 <tbody>
                    {initialSchemes.map(s => (
                        <tr key={s.id} className="border-b">
                            <td className="p-2 w-1/2">{s.description}</td>
                            <td className="p-2">{s.buyQuantity} x {skus.find(sku => sku.id === s.buySkuId)?.name}</td>
                            <td className="p-2">{s.getQuantity} x {skus.find(sku => sku.id === s.getSkuId)?.name}</td>
                            {canEdit && <td className="p-2 text-right"><Button onClick={() => handleDelete(s.id)} variant="danger" size="sm" className="p-2"><Trash2 size={16}/></Button></td>}
                        </tr>
                    ))}
                 </tbody>
            </table>
        </Card>
    );
}

export default DistributorDetailsPage;