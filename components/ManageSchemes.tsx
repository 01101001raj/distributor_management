import React, { useEffect, useState, useCallback } from 'react';
import Card from './common/Card';
import Button from './common/Button';
import Input from './common/Input';
import Select from './common/Select';
import { api } from '../services/mockApiService';
import { Scheme, SKU, UserRole } from '../types';
import { useAuth } from '../hooks/useAuth';
import { PlusCircle, Edit, Save, X, Trash2 } from 'lucide-react';

const ManageSchemes: React.FC = () => {
  const { userRole } = useAuth();
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [skus, setSkus] = useState<SKU[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSchemeId, setEditingSchemeId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
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
  };

  const handleCancel = () => {
    setEditingSchemeId(null);
    setIsAdding(false);
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
      if (isAdding) {
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
      if (userRole && window.confirm('Are you sure you want to delete this scheme?')) {
          await api.deleteScheme(schemeId, userRole);
          fetchSchemes();
      }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const isNumeric = ['buyQuantity', 'getQuantity'].includes(name);
    setEditedScheme(prev => ({ ...prev, [name]: isNumeric ? parseInt(value) : value }));
  };

  const handleAddNew = () => {
    setIsAdding(true);
    setEditedScheme({
      description: '',
      buySkuId: skus[0]?.id || '',
      buyQuantity: 10,
      getSkuId: skus[0]?.id || '',
      getQuantity: 1,
      isGlobal: true
    });
    setEditingSchemeId('new');
  };

  if (userRole !== UserRole.SUPER_ADMIN) {
    return (
      <Card className="text-center">
        <p className="text-text-secondary">You do not have permission to manage schemes.</p>
      </Card>
    );
  }

  const getSkuName = (id?: string) => skus.find(s => s.id === id)?.name || 'N/A';

  return (
    <Card>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Manage Global Schemes</h2>
        <Button onClick={handleAddNew} disabled={isAdding}><PlusCircle size={16} className="mr-2" /> Add New Scheme</Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-sm font-semibold text-black">Description</th>
              <th className="p-3 text-sm font-semibold text-black">Buy</th>
              <th className="p-3 text-sm font-semibold text-black">Get Free</th>
              <th className="p-3 text-sm font-semibold text-black text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isAdding && (
              <tr className="bg-blue-50">
                <td className="p-2"><Input label="" name="description" value={editedScheme.description || ''} onChange={handleInputChange} /></td>
                <td className="p-2">
                    <div className="flex gap-2">
                        <Input label="" type="number" name="buyQuantity" value={editedScheme.buyQuantity || ''} onChange={handleInputChange} className="w-20"/>
                        <Select label="" name="buySkuId" value={editedScheme.buySkuId} onChange={handleInputChange}>{skus.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</Select>
                    </div>
                </td>
                <td className="p-2">
                     <div className="flex gap-2">
                        <Input label="" type="number" name="getQuantity" value={editedScheme.getQuantity || ''} onChange={handleInputChange} className="w-20"/>
                        <Select label="" name="getSkuId" value={editedScheme.getSkuId} onChange={handleInputChange}>{skus.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</Select>
                    </div>
                </td>
                <td className="p-2 text-right space-x-2">
                  <Button onClick={handleSave} size="sm" className="p-2"><Save size={16} /></Button>
                  <Button onClick={handleCancel} variant="secondary" size="sm" className="p-2"><X size={16} /></Button>
                </td>
              </tr>
            )}
            {schemes.map(scheme => (
              editingSchemeId === scheme.id ? (
                <tr key={scheme.id} className="bg-blue-50">
                    <td className="p-2"><Input label="" name="description" value={editedScheme.description || ''} onChange={handleInputChange} /></td>
                    <td className="p-2">
                        <div className="flex gap-2">
                            <Input label="" type="number" name="buyQuantity" value={editedScheme.buyQuantity || ''} onChange={handleInputChange} className="w-20"/>
                            <Select label="" name="buySkuId" value={editedScheme.buySkuId} onChange={handleInputChange}>{skus.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</Select>
                        </div>
                    </td>
                    <td className="p-2">
                        <div className="flex gap-2">
                            <Input label="" type="number" name="getQuantity" value={editedScheme.getQuantity || ''} onChange={handleInputChange} className="w-20"/>
                            <Select label="" name="getSkuId" value={editedScheme.getSkuId} onChange={handleInputChange}>{skus.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</Select>
                        </div>
                    </td>
                    <td className="p-2 text-right space-x-2">
                        <Button onClick={handleSave} size="sm" className="p-2"><Save size={16} /></Button>
                        <Button onClick={handleCancel} variant="secondary" size="sm" className="p-2"><X size={16} /></Button>
                    </td>
                </tr>
              ) : (
                <tr key={scheme.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 w-1/3">{scheme.description}</td>
                  <td className="p-3">{scheme.buyQuantity} x {getSkuName(scheme.buySkuId)}</td>
                  <td className="p-3">{scheme.getQuantity} x {getSkuName(scheme.getSkuId)}</td>
                  <td className="p-3 text-right space-x-2">
                    <Button onClick={() => handleEdit(scheme)} variant="secondary" size="sm" className="p-2"><Edit size={16} /></Button>
                    <Button onClick={() => handleDelete(scheme.id)} variant="danger" size="sm" className="p-2"><Trash2 size={16} /></Button>
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

export default ManageSchemes;
