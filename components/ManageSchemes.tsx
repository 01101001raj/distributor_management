import React, { useEffect, useState, useCallback } from 'react';
import Card from './common/Card';
import Button from './common/Button';
import Input from './common/Input';
import Select from './common/Select';
import { api } from '../services/mockApiService';
import { Scheme, SKU, UserRole } from '../types';
import { useAuth } from '../hooks/useAuth';
import { PlusCircle, Edit, Save, X, Trash2 } from 'lucide-react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useSortableData } from '../hooks/useSortableData';
import SortableTableHeader from './common/SortableTableHeader';

type SchemeFormInputs = Omit<Scheme, 'id' | 'isGlobal' | 'distributorId'>;

const ManageSchemes: React.FC = () => {
  const { userRole } = useAuth();
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [skus, setSkus] = useState<SKU[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSchemeId, setEditingSchemeId] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isValid }, reset, watch } = useForm<SchemeFormInputs>({
    mode: 'onBlur'
  });
  const watchStartDate = watch('startDate');

  const { items: sortedSchemes, requestSort, sortConfig } = useSortableData(schemes, { key: 'description', direction: 'ascending' });

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
    reset(scheme);
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setEditingSchemeId(null);
    reset({});
  };

  const onSave: SubmitHandler<SchemeFormInputs> = async (data) => {
    if (!userRole) return;
    setLoading(true);
    try {
      if (editingSchemeId === 'new') {
        await api.addScheme({ ...data, isGlobal: true }, userRole);
      } else {
        await api.updateScheme({ ...data, id: editingSchemeId!, isGlobal: true }, userRole);
      }
      fetchSchemes();
      handleCancel();
    } catch (err) {
      console.error("Failed to save scheme:", err);
    } finally {
        setLoading(false);
    }
  };

  const handleDelete = async (schemeId: string) => {
      if (userRole && window.confirm('Are you sure you want to delete this global scheme?')) {
          await api.deleteScheme(schemeId, userRole);
          fetchSchemes();
      }
  }

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
          <form onSubmit={handleSubmit(onSave)}>
            <h3 className="text-xl font-bold mb-4">{editingSchemeId === 'new' ? 'Create New Global Scheme' : 'Edit Global Scheme'}</h3>
            <div className="space-y-6">
                <Input 
                  label="Scheme Description"
                  placeholder="e.g., Summer Bonanza Offer"
                  {...register('description', { required: 'Description is required' })}
                  error={errors.description?.message}
                />
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    <Input 
                        label="Start Date"
                        type="date"
                        {...register('startDate', { required: 'Start date is required' })}
                        error={errors.startDate?.message}
                    />
                    <Input 
                        label="End Date"
                        type="date"
                        {...register('endDate', { 
                            required: 'End date is required',
                            validate: (value) => !watchStartDate || value >= watchStartDate || 'End date must be on or after start date'
                        })}
                        error={errors.endDate?.message}
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    <Card className="bg-background">
                        <h4 className="font-semibold mb-2 text-text-primary">Condition (Buy)</h4>
                        <div className="flex gap-4">
                             <Input 
                               label="Quantity" 
                               type="number" 
                               className="w-24"
                               {...register('buyQuantity', { required: 'Required', valueAsNumber: true, min: { value: 1, message: 'Min 1' } })}
                               error={errors.buyQuantity?.message}
                             />
                             <Select label="Product" {...register('buySkuId', { required: true })}>
                                 {skus.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                             </Select>
                        </div>
                    </Card>
                    
                     <Card className="bg-green-50 border-green-200">
                        <h4 className="font-semibold mb-2 text-text-primary">Reward (Get Free)</h4>
                         <div className="flex gap-4">
                             <Input 
                                label="Quantity" 
                                type="number" 
                                className="w-24"
                                {...register('getQuantity', { required: 'Required', valueAsNumber: true, min: { value: 1, message: 'Min 1' } })}
                                error={errors.getQuantity?.message}
                             />
                             <Select label="Product" {...register('getSkuId', { required: true })}>
                                 {skus.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                             </Select>
                        </div>
                    </Card>
                </div>

                <div className="flex justify-end gap-4 pt-4">
                   <Button type="button" onClick={handleCancel} variant="secondary" size="md">
                    <X size={16}/> Cancel
                  </Button>
                  <Button type="submit" size="md" isLoading={loading} disabled={!isValid}>
                    <Save size={16}/> Save Scheme
                  </Button>
                </div>
            </div>
          </form>
      </Card>
  );

  return (
    <>
      <Card>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h2 className="text-2xl font-bold">Manage Global Schemes</h2>
          <Button onClick={handleAddNew} disabled={!!editingSchemeId} className="w-full sm:w-auto"><PlusCircle size={14} /> Add New Scheme</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[600px] text-sm">
            <thead className="bg-slate-50">
              <tr>
                <SortableTableHeader label="Description" sortKey="description" requestSort={requestSort} sortConfig={sortConfig} />
                <th className="p-3 font-semibold text-text-secondary">Rule</th>
                <th className="p-3 font-semibold text-text-secondary text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedSchemes.map(scheme => (
                <tr key={scheme.id} className="border-b border-border hover:bg-slate-50">
                  <td className="p-3 w-1/3 font-semibold">
                    {scheme.description}
                    <p className="text-xs font-normal text-text-secondary mt-1">
                        Active: {scheme.startDate} to {scheme.endDate}
                    </p>
                  </td>
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
              {sortedSchemes.length === 0 && (
                  <tr>
                      <td colSpan={3} className="text-center p-4 text-text-secondary">No global schemes have been created yet.</td>
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
