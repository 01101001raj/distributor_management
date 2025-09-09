import React, { useEffect, useState, useCallback } from 'react';
import Card from './common/Card';
import Button from './common/Button';
import Input from './common/Input';
import Select from './common/Select';
import { api } from '../services/mockApiService';
import { Scheme, SKU, UserRole } from '../types';
import { useAuth } from '../hooks/useAuth';
import { PlusCircle, Edit, Save, X, Trash2, ArrowRight } from 'lucide-react';

const ManageSchemes: React.FC = () => {
  const { userRole } = useAuth();
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [skus, setSkus] = useState<SKU[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSchemeId, setEditingSchemeId] = useState<string | null>(null);
  const [editedScheme, setEditedScheme] = useState<Partial<Scheme>>({});

  const fetchSchemes = useCallback(() => {
    setLoading(true);
    api.getGlobalSchemes().then(data => {
      setSchemes(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    fetchSchemes();
    api.getSKUs().then(setSkus);
  }, [fetchSchemes]);

  const handleEdit = (scheme: Scheme) => {
    setEditingSchemeId(scheme.id);
    setEditedScheme(scheme);
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setEditingSchemeId(null);
    setEditedScheme({});
  };

  const handleSave = async () => {
    if (!userRole) return;

    const { description, buySkuId, buyQuantity, getSkuId, getQuantity } = editedScheme;
    if (!description || !buySkuId || !buyQuantity || !getSkuId || !getQuantity) {
        alert("Please fill all fields");
        return;
    }

    setLoading(true);
    try {
      if (editingSchemeId === 'new') {
        await api.addScheme({ description, buySkuId, buyQuantity, getSkuId, getQuantity, isGlobal: true }, userRole);
      } else {
        await api.updateScheme(editedScheme as Scheme, userRole);
      }
      fetchSchemes();
      handleCancel();
    } catch (err) {
      console.error("Failed to save scheme:", err);
      setLoading(false);
    }
  };

  const handleDelete = async (schemeId: string) => {
      if (userRole && window.confirm('Are you sure you want to delete this global scheme?')) {
          await api.deleteScheme(schemeId, userRole);
          fetchSchemes();
      }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const isNumeric = ['buyQuantity', 'getQuantity'].includes(name);
    setEditedScheme(prev => ({ ...prev, [name]: isNumeric ? parseInt(value) || 0 : value }));
  };

  const handleAddNew = () => {
    setEditedScheme({
      description: '',
      buySkuId: skus[0]?.id || '',
      buyQuantity: 10,
      getSkuId: skus[0]?.id || '',
      getQuantity: 1,
      isGlobal: true
    });
    setEditingSchemeId('new');
     setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 100);
  };

  if (userRole !== UserRole.SUPER_ADMIN) {
    return (
      <Card className="text-center">
        <p className="text-text-secondary">You do not have permission to manage schemes.</p>
      </Card>
    );
  }

  const getSkuName = (id?: string) => skus.find(s => s.id === id)?.name || 'N/A';

  const renderEditor = () => (
      <Card className="mt-6 border-t-4 border-primary">
          <h3 className="text-xl font-bold mb-4">{editingSchemeId === 'new' ? 'Create New Global Scheme' : 'Edit Global Scheme'}</h3>
          <div className="space-y-6">
              <Input 
                label="Scheme Description"
                name="description"
                placeholder="e.g., Summer Bonanza Offer"
                value={editedScheme.description || ''}
                onChange={handleInputChange} 
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <Card className="bg-gray-50">
                      <h4 className="font-semibold mb-2 text-text-primary">Condition (Buy)</h4>
                      <div className="flex gap-4">
                           <Input label="Quantity" type="number" name="buyQuantity" value={editedScheme.buyQuantity || ''} onChange={handleInputChange} className="w-24"/>
                           <Select label="Product" name="buySkuId" value={editedScheme.buySkuId} onChange={handleInputChange}>{skus.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</Select>
                      </div>
                  </Card>
                  
                   <Card className="bg-green-50">
                      <h4 className="font-semibold mb-2 text-text-primary">Reward (Get Free)</h4>
                       <div className="flex gap-4">
                           <Input label="Quantity" type="number" name="getQuantity" value={editedScheme.getQuantity || ''} onChange={handleInputChange} className="w-24"/>
                           <Select label="Product" name="getSkuId" value={editedScheme.getSkuId} onChange={handleInputChange}>{skus.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</Select>
                      </div>
                  </Card>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <Button onClick={handleSave} size="md" isLoading={loading}>
                  <Save size={16} className="mr-2"/> Save Scheme
                </Button>
                <Button onClick={handleCancel} variant="secondary" size="md">
                  <X size={16} className="mr-2"/> Cancel
                </Button>
              </div>
          </div>
      </Card>
  );

  return (
    <>
      <Card>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Manage Global Schemes</h2>
          <Button onClick={handleAddNew} disabled={!!editingSchemeId}><PlusCircle size={16} className="mr-2" /> Add New Scheme</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-sm font-semibold text-black">Description</th>
                <th className="p-3 text-sm font-semibold text-black">Rule</th>
                <th className="p-3 text-sm font-semibold text-black text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {schemes.map(scheme => (
                <tr key={scheme.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 w-1/3 font-semibold">{scheme.description}</td>
                  <td className="p-3">
                    Buy {scheme.buyQuantity} x <span className="font-medium">{getSkuName(scheme.buySkuId)}</span>, 
                    Get {scheme.getQuantity} x <span className="font-medium text-green-600">{getSkuName(scheme.getSkuId)}</span> Free
                  </td>
                  <td className="p-3 text-right space-x-2">
                    <Button onClick={() => handleEdit(scheme)} variant="secondary" size="sm" className="p-2" disabled={!!editingSchemeId}><Edit size={16} /></Button>
                    <Button onClick={() => handleDelete(scheme.id)} variant="danger" size="sm" className="p-2" disabled={!!editingSchemeId}><Trash2 size={16} /></Button>
                  </td>
                </tr>
              ))}
              {schemes.length === 0 && (
                  <tr>
                      <td colSpan={3} className="text-center p-4 text-gray-500">No global schemes have been created yet.</td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
      
      {editingSchemeId && renderEditor()}
    </>
  );
};

export default ManageSchemes;