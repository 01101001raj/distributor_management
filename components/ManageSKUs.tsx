import React, { useEffect, useState } from 'react';
import Card from './common/Card';
import Button from './common/Button';
import Input from './common/Input';
import { api } from '../services/mockApiService';
import { SKU, UserRole } from '../types';
import { useAuth } from '../hooks/useAuth';
import { PlusCircle, Edit, Save, X } from 'lucide-react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { formatIndianCurrency } from '../utils/formatting';
import { useSortableData } from '../hooks/useSortableData';
import SortableTableHeader from './common/SortableTableHeader';

type SkuFormInputs = Omit<SKU, 'id'> & { id?: string };

const ManageSKUs: React.FC = () => {
  const { userRole } = useAuth();
  const [skus, setSkus] = useState<SKU[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSkuId, setEditingSkuId] = useState<string | null>(null);
  
  const { register, handleSubmit, formState: { errors, isValid }, reset } = useForm<SkuFormInputs>({
    mode: 'onBlur'
  });

  const { items: sortedSkus, requestSort, sortConfig } = useSortableData(skus, { key: 'name', direction: 'ascending' });

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
    reset(sku);
  };
  
  const handleCancel = () => {
    setEditingSkuId(null);
    reset({ name: '', price: 0 });
  };

  const onSave: SubmitHandler<SkuFormInputs> = async (data) => {
    if (!userRole) return;
    setLoading(true);
    try {
        if(editingSkuId === 'new'){
            await api.addSKU({ name: data.name, price: Number(data.price) }, userRole);
        } else {
            await api.updateSKU({ ...data, id: editingSkuId! }, userRole);
        }
        fetchSKUs();
        handleCancel();
    } catch(err) {
        console.error("Failed to save SKU:", err);
    } finally {
        setLoading(false);
    }
  };
  
  const handleAddNew = () => {
      setEditingSkuId('new');
      reset({ name: '', price: 0 });
  }

  if (userRole !== UserRole.SUPER_ADMIN) {
    return (
      <Card className="text-center">
        <p className="text-text-secondary">You do not have permission to manage products.</p>
      </Card>
    );
  }

  const renderEditRow = (skuId: string) => (
    <tr className="bg-primary/5">
      <td className="p-2 font-mono text-xs">{skuId === 'new' ? 'NEW' : skuId}</td>
      <td className="p-2">
        <Input
          id="name"
          {...register('name', { required: 'Name is required' })}
          error={errors.name?.message}
        />
      </td>
      <td className="p-2">
        <Input
          id="price"
          type="number"
          {...register('price', {
            required: 'Price is required',
            valueAsNumber: true,
            min: { value: 0, message: 'Price cannot be negative' },
          })}
          error={errors.price?.message}
        />
      </td>
      <td className="p-2 text-right space-x-2">
        <Button onClick={handleSubmit(onSave)} variant="primary" size="sm" className="p-2" isLoading={loading} disabled={!isValid}><Save size={16} /></Button>
        <Button onClick={handleCancel} variant="secondary" size="sm" className="p-2"><X size={16} /></Button>
      </td>
    </tr>
  );

  return (
    <Card>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold">Manage Products (SKUs)</h2>
        <Button onClick={handleAddNew} disabled={!!editingSkuId} className="w-full sm:w-auto"><PlusCircle size={14}/> Add New SKU</Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[600px] text-sm">
          <thead className="bg-slate-50">
            <tr>
              <SortableTableHeader label="SKU ID" sortKey="id" requestSort={requestSort} sortConfig={sortConfig} />
              <SortableTableHeader label="Product Name" sortKey="name" requestSort={requestSort} sortConfig={sortConfig} />
              <SortableTableHeader label="Price" sortKey="price" requestSort={requestSort} sortConfig={sortConfig} />
              <th className="p-3 font-semibold text-text-secondary text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {editingSkuId === 'new' && renderEditRow('new')}
            {sortedSkus.map(sku => (
              editingSkuId === sku.id ? (
                renderEditRow(sku.id)
              ) : (
                <tr key={sku.id} className="border-b border-border hover:bg-slate-50">
                  <td className="p-3 font-mono text-xs text-text-secondary">{sku.id}</td>
                  <td className="p-3">{sku.name}</td>
                  <td className="p-3">{formatIndianCurrency(sku.price)}</td>
                  <td className="p-3 text-right">
                    <Button onClick={() => handleEdit(sku)} variant="secondary" size="sm" className="p-2" disabled={!!editingSkuId}><Edit size={16}/></Button>
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
