import React, { useEffect, useState } from 'react';
import Card from './common/Card';
import Button from './common/Button';
import Input from './common/Input';
import { api } from '../services/mockApiService';
import { SKU, UserRole } from '../types';
import { useAuth } from '../hooks/useAuth';
import { PlusCircle, Edit, Save, X, Trash2 } from 'lucide-react';

const ManageSKUs: React.FC = () => {
  const { userRole } = useAuth();
  const [skus, setSkus] = useState<SKU[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSkuId, setEditingSkuId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  
  const [editedSku, setEditedSku] = useState<Partial<SKU>>({});

  const fetchSKUs = () => {
      setLoading(true);
      api.getSKUs().then(data => {
          setSkus(data);
          setLoading(false);
      });
  };

  useEffect(() => {
    fetchSKUs();
  }, []);
  
  const handleEdit = (sku: SKU) => {
    setEditingSkuId(sku.id);
    setEditedSku(sku);
  };
  
  const handleCancel = () => {
    setEditingSkuId(null);
    setIsAdding(false);
    setEditedSku({});
  };

  const handleSave = async () => {
    if (!editedSku.id || !editedSku.name || editedSku.price === undefined) return;
    
    setLoading(true);
    try {
        if(isAdding){
            await api.addSKU({ name: editedSku.name, price: editedSku.price }, userRole);
        } else {
            await api.updateSKU(editedSku as SKU, userRole);
        }
        fetchSKUs();
        handleCancel();
    } catch(err) {
        console.error("Failed to save SKU:", err);
        setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setEditedSku(prev => ({...prev, [name]: name === 'price' ? parseFloat(value) : value }));
  };
  
  const handleAddNew = () => {
      setIsAdding(true);
      setEditedSku({ id: 'new', name: '', price: 0 });
      setEditingSkuId('new');
  }

  if (userRole !== UserRole.SUPER_ADMIN) {
    return (
      <Card className="text-center">
        <p className="text-text-secondary">You do not have permission to manage products.</p>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Manage Products (SKUs)</h2>
        <Button onClick={handleAddNew} disabled={isAdding}><PlusCircle size={16} className="mr-2"/> Add New SKU</Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-sm font-semibold text-black">SKU ID</th>
              <th className="p-3 text-sm font-semibold text-black">Product Name</th>
              <th className="p-3 text-sm font-semibold text-black">Price</th>
              <th className="p-3 text-sm font-semibold text-black text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isAdding && (
                 <tr className="bg-blue-50">
                    <td className="p-2 font-mono text-xs">NEW</td>
                    <td className="p-2"><Input label="" id="name" name="name" value={editedSku.name || ''} onChange={handleInputChange} /></td>
                    <td className="p-2"><Input label="" id="price" name="price" type="number" value={editedSku.price || ''} onChange={handleInputChange} /></td>
                    <td className="p-2 text-right space-x-2">
                        <Button onClick={handleSave} variant="primary" size="sm" className="p-2"><Save size={16}/></Button>
                        <Button onClick={handleCancel} variant="secondary" size="sm" className="p-2"><X size={16}/></Button>
                    </td>
                </tr>
            )}
            {skus.map(sku => (
              editingSkuId === sku.id ? (
                <tr key={sku.id} className="bg-blue-50">
                    <td className="p-2 font-mono text-xs">{sku.id}</td>
                    <td className="p-2"><Input label="" id="name" name="name" value={editedSku.name || ''} onChange={handleInputChange} /></td>
                    <td className="p-2"><Input label="" id="price" name="price" type="number" value={editedSku.price || ''} onChange={handleInputChange} /></td>
                    <td className="p-2 text-right space-x-2">
                        <Button onClick={handleSave} variant="primary" size="sm" className="p-2"><Save size={16}/></Button>
                        <Button onClick={handleCancel} variant="secondary" size="sm" className="p-2"><X size={16}/></Button>
                    </td>
                </tr>
              ) : (
                <tr key={sku.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-mono text-xs">{sku.id}</td>
                  <td className="p-3">{sku.name}</td>
                  <td className="p-3">₹{sku.price.toLocaleString()}</td>
                  <td className="p-3 text-right">
                    <Button onClick={() => handleEdit(sku)} variant="secondary" size="sm" className="p-2"><Edit size={16}/></Button>
                  </td>
                </tr>
              )
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default ManageSKUs;