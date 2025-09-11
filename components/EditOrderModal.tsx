import React, { useState, useEffect, useMemo } from 'react';
import { Order, SKU, Scheme, SpecialPrice, Distributor } from '../types';
import { api } from '../services/mockApiService';
import Card from './common/Card';
import Select from './common/Select';
import Button from './common/Button';
import { useAuth } from '../hooks/useAuth';
import { PlusCircle, Trash2, Gift, Star, XCircle, TrendingUp, TrendingDown, Save, Copy } from 'lucide-react';
import Input from './common/Input';
import { formatIndianCurrency } from '../utils/formatting';

interface EditOrderModalProps {
    order: Order;
    onClose: () => void;
    onSave: () => void;
}

interface OrderItemState {
  id: string; // unique key for react list
  skuId: string;
  quantity: number;
}

interface DisplayItem {
    skuId: string;
    skuName: string;
    quantity: number;
    unitPrice: number;
    isFreebie: boolean;
    hasSpecialPrice: boolean;
}

const EditOrderModal: React.FC<EditOrderModalProps> = ({ order, onClose, onSave }) => {
    const { currentUser } = useAuth();
    const [items, setItems] = useState<OrderItemState[]>([]);
    const [skus, setSkus] = useState<SKU[]>([]);
    const [distributor, setDistributor] = useState<Distributor | null>(null);
    const [globalSchemes, setGlobalSchemes] = useState<Scheme[]>([]);
    const [distributorSchemes, setDistributorSchemes] = useState<Scheme[]>([]);
    const [distributorPrices, setDistributorPrices] = useState<SpecialPrice[]>([]);
    const [itemErrors, setItemErrors] = useState<Record<string, string>>({});
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const [
                    skuData,
                    distributorData,
                    globalSchemeData,
                    distributorSchemeData,
                    distributorPriceData,
                    initialItemsData
                ] = await Promise.all([
                    api.getSKUs(),
                    api.getDistributorById(order.distributorId),
                    api.getGlobalSchemes(),
                    api.getSchemesByDistributor(order.distributorId),
                    api.getSpecialPricesByDistributor(order.distributorId),
                    api.getOrderItems(order.id),
                ]);

                setSkus(skuData);
                setDistributor(distributorData || null);
                setGlobalSchemes(globalSchemeData);
                setDistributorSchemes(distributorSchemeData);
                setDistributorPrices(distributorPriceData);
                
                const initialItems = initialItemsData
                    .filter(item => !item.isFreebie)
                    .map(item => ({
                        id: `${item.skuId}-${Date.now()}-${Math.random()}`,
                        skuId: item.skuId,
                        quantity: item.quantity
                    }));
                setItems(initialItems);

            } catch (err) {
                setError("Failed to load order data for editing.");
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [order]);

    const { displayItems, subtotal } = useMemo(() => {
        if (!distributor) return { displayItems: [], subtotal: 0 };
        
        let currentSubtotal = 0;
        const itemsToDisplay: DisplayItem[] = [];
        const freebies = new Map<string, { quantity: number }>();
        const today = new Date().toISOString().split('T')[0];
        const activeSpecialPrices = distributorPrices.filter(p => p.startDate <= today && p.endDate >= today);

        // Correctly filter schemes to only include active ones before applying logic
        const activeDistributorSchemes = distributorSchemes.filter(s => s.startDate <= today && s.endDate >= today);
        const activeGlobalSchemes = globalSchemes.filter(s => s.startDate <= today && s.endDate >= today);
        const applicableSchemes = activeDistributorSchemes.length > 0 ? activeDistributorSchemes : activeGlobalSchemes;

        items.forEach(item => {
            const sku = skus.find(s => s.id === item.skuId);
            if (!sku || item.quantity <= 0) return;
            const specialPrice = activeSpecialPrices.find(p => p.skuId === item.skuId);
            const unitPrice = specialPrice ? specialPrice.price : sku.price;
            currentSubtotal += item.quantity * unitPrice;
            itemsToDisplay.push({ skuId: sku.id, skuName: sku.name, quantity: item.quantity, unitPrice, isFreebie: false, hasSpecialPrice: !!specialPrice });
        });

        // --- REFACTORED SCHEME LOGIC ---
        // Group schemes by the product to buy and sort by buyQuantity descending
        const schemesByBuySku = applicableSchemes.reduce((acc, scheme) => {
            if (!acc[scheme.buySkuId]) acc[scheme.buySkuId] = [];
            acc[scheme.buySkuId].push(scheme);
            return acc;
        }, {} as Record<string, Scheme[]>);

        for (const skuId in schemesByBuySku) {
            schemesByBuySku[skuId].sort((a, b) => b.buyQuantity - a.buyQuantity);
        }

        // Create a map of purchased quantities to process
        const purchasedQuantities = new Map<string, number>();
        items.forEach(item => { // 'items' is the state variable in this component
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
                        
                        const existing = freebies.get(scheme.getSkuId) || { quantity: 0 };
                        freebies.set(scheme.getSkuId, { quantity: existing.quantity + totalFree });
                        
                        remainingQuantity %= scheme.buyQuantity;
                    }
                });
            }
        });
        
        freebies.forEach((data, skuId) => {
            const sku = skus.find(s => s.id === skuId);
            if (sku) {
                itemsToDisplay.push({ skuId: sku.id, skuName: sku.name, quantity: data.quantity, unitPrice: 0, isFreebie: true, hasSpecialPrice: false });
            }
        });

        return { displayItems: itemsToDisplay, subtotal: currentSubtotal };
    }, [items, skus, distributor, globalSchemes, distributorSchemes, distributorPrices]);

    const handleAddSku = () => {
        if (skus.length > 0) {
            setItems([...items, { id: Date.now().toString(), skuId: skus[0].id, quantity: 1 }]);
        }
    };
    
    const handleCopyItem = (itemToCopy: OrderItemState) => {
        const newItem: OrderItemState = {
            ...itemToCopy,
            id: `${Date.now()}-${Math.random()}`, // New unique ID
        };
        const index = items.findIndex(item => item.id === itemToCopy.id);
        const newItems = [...items];
        newItems.splice(index + 1, 0, newItem);
        setItems(newItems);
    };


    const handleItemChange = (itemId: string, field: 'skuId' | 'quantity', value: string | number) => {
        setItems(items.map(item => item.id === itemId ? { ...item, [field]: value } : item));

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

    const handleRemoveItem = (itemIdToRemove: string) => {
        const item = items.find(i => i.id === itemIdToRemove);
        if (!item) return;

        const sku = skus.find(s => s.id === item.skuId);
        const skuName = sku ? `'${sku.name}'` : 'this item';
        
        if (window.confirm(`Are you sure you want to remove ${skuName} from the order?`)) {
            setItems(items.filter((item) => item.id !== itemIdToRemove));
            setItemErrors(prev => {
                const newErrors = {...prev};
                delete newErrors[itemIdToRemove];
                return newErrors;
            });
        }
    };


    const handleSaveChanges = async () => {
        if (!currentUser) return;
        setLoading(true);
        setError(null);
        try {
            const itemsToSubmit = items
                .filter(i => i.quantity > 0)
                .map(({ skuId, quantity }) => ({ skuId, quantity }));

            await api.updateOrderItems(order.id, itemsToSubmit, currentUser.username);
            onSave();
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred.");
        } finally {
            setLoading(false);
        }
    };
    
    const delta = subtotal - order.totalAmount;
    const canAfford = distributor && delta > 0 ? (delta <= distributor.walletBalance) : true;
    const hasErrors = Object.keys(itemErrors).length > 0;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold">Edit Order <span className="font-mono text-sm text-gray-500 block sm:inline mt-1 sm:mt-0">{order.id}</span></h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200"><XCircle /></button>
                </div>
                
                {loading && !distributor ? <div className="p-8 text-center">Loading...</div> : (
                <div className="p-6 overflow-y-auto flex-grow space-y-6">
                    <Card>
                        <h3 className="text-lg font-semibold mb-2">Order Items</h3>
                        <div className="space-y-2">
                            {items.map((item) => (
                                <div key={item.id} className="grid grid-cols-12 gap-2 items-start p-2 rounded-md bg-gray-50">
                                    <div className="col-span-12 sm:col-span-7">
                                        <Select value={item.skuId} onChange={(e) => handleItemChange(item.id, 'skuId', e.target.value)}>
                                            {skus.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </Select>
                                    </div>
                                    <div className="col-span-8 sm:col-span-3">
                                        <Input
                                            type="number"
                                            value={item.quantity}
                                            onChange={(e) => handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 0)}
                                            min="1"
                                            error={itemErrors[item.id]}
                                        />
                                    </div>
                                    <div className="col-span-4 sm:col-span-2 text-right self-center flex justify-end">
                                        <button onClick={() => handleCopyItem(item)} className="text-blue-500 hover:text-blue-700 p-1" title="Duplicate Item"><Copy size={18}/></button>
                                        <button onClick={() => handleRemoveItem(item.id)} className="text-red-500 hover:text-red-700 p-1" title="Remove Item"><Trash2 size={20}/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                         <div className="mt-4">
                            <Button onClick={handleAddSku} variant="secondary" size="sm"><PlusCircle size={16} className="mr-2"/> Add Item</Button>
                        </div>
                    </Card>

                    <Card>
                        <h3 className="font-semibold mb-2">New Order Summary</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[400px]">
                                <tbody>
                                    {displayItems.map((item, index) => (
                                        <tr key={index} className={item.isFreebie ? 'bg-green-50' : ''}>
                                            <td className="p-2 w-1/2">
                                                {item.skuName}
                                                {item.isFreebie && <Gift size={12} className="inline ml-2 text-green-600"/>}
                                                {item.hasSpecialPrice && <Star size={12} className="inline ml-2 text-yellow-500"/>}
                                            </td>
                                            <td className="p-2 text-center">{item.quantity}</td>
                                            <td className="p-2 text-right">{formatIndianCurrency(item.unitPrice)}</td>
                                            <td className="p-2 text-right font-semibold">{formatIndianCurrency(item.quantity * item.unitPrice)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    <Card className="bg-blue-50">
                        <h3 className="font-semibold mb-2 text-black">Financial Impact</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between"><span>Original Total:</span> <span className="font-medium">{formatIndianCurrency(order.totalAmount)}</span></div>
                            <div className="flex justify-between"><span>New Total:</span> <span className="font-medium">{formatIndianCurrency(subtotal)}</span></div>
                            <div className={`flex justify-between border-t pt-2 mt-2 font-bold ${delta > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                <span>Difference:</span>
                                <span className="flex items-center">
                                    {delta !== 0 && (delta > 0 ? <TrendingUp size={16} className="mr-1"/> : <TrendingDown size={16} className="mr-1"/>)}
                                    {formatIndianCurrency(Math.abs(delta))}
                                </span>
                            </div>
                        </div>
                        {!canAfford && <p className="text-red-600 text-xs mt-2 text-center">Distributor has insufficient funds to cover this increase.</p>}
                    </Card>
                </div>
                )}
                
                {error && <div className="p-4 text-center text-sm bg-red-100 text-red-800">{error}</div>}

                <div className="p-4 bg-gray-50 border-t flex justify-end gap-4">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSaveChanges} isLoading={loading} disabled={loading || !canAfford || items.length === 0 || hasErrors}>
                        <Save size={16} className="mr-2"/> Save Changes
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default EditOrderModal;