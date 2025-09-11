import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import Card from './common/Card';
import Select from './common/Select';
import Input from './common/Input';
import Button from './common/Button';
import { Distributor } from '../types';
import { api } from '../services/mockApiService';
import { useAuth } from '../hooks/useAuth';
import { CheckCircle, XCircle } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { formatIndianCurrency } from '../utils/formatting';

interface FormInputs {
  distributorId: string;
  amount: number;
  paymentMethod: 'Cash' | 'UPI' | 'Bank Transfer';
}

const RechargeWallet: React.FC = () => {
  const location = useLocation();
  const { register, handleSubmit, formState: { errors, isValid }, watch, reset } = useForm<FormInputs>({
    mode: 'onBlur',
    defaultValues: {
      distributorId: location.state?.distributorId || '',
      amount: undefined,
      paymentMethod: 'Cash',
    }
  });
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const { currentUser } = useAuth();

  const selectedDistributorId = watch('distributorId');
  const selectedDistributor = distributors.find(d => d.id === selectedDistributorId);

  useEffect(() => {
    api.getDistributors().then(setDistributors);
  }, []);

  const onSubmit: SubmitHandler<FormInputs> = async (data) => {
    if (window.confirm(`Are you sure you want to add ${formatIndianCurrency(Number(data.amount))} to ${selectedDistributor?.name}'s wallet? This action cannot be undone.`)) {
      setIsLoading(true);
      setStatusMessage(null);
      try {
        await api.rechargeWallet(data.distributorId, Number(data.amount), currentUser!.username);
        setStatusMessage({ type: 'success', text: `${formatIndianCurrency(data.amount)} successfully added to ${selectedDistributor?.name}'s account.` });
        // Refetch distributors to show updated balance
        api.getDistributors().then(setDistributors);
        reset({ distributorId: '', amount: 0, paymentMethod: 'Cash' });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        setStatusMessage({ type: 'error', text: `Failed to recharge wallet: ${errorMessage}` });
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  if (currentUser?.role === 'User') {
      return (
          <Card className="text-center">
              <p className="text-text-secondary">You do not have permission to recharge wallets.</p>
          </Card>
      );
  }

  return (
    <Card className="max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-text-primary">Recharge Distributor Wallet</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Select
          id="distributorId"
          label="Select Distributor"
          {...register('distributorId', { required: 'Please select a distributor' })}
          error={errors.distributorId?.message}
        >
          <option value="">-- Choose Distributor --</option>
          {distributors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </Select>
        
        {selectedDistributor && (
            <div className="bg-primary/10 p-4 rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                    <span className="font-medium text-text-secondary">Current Wallet Balance:</span>
                    <span className="font-bold text-text-primary text-lg">{formatIndianCurrency(selectedDistributor.walletBalance)}</span>
                </div>
            </div>
        )}

        <Input
          id="amount"
          label="Recharge Amount"
          type="number"
          {...register('amount', { 
            required: 'Amount is required', 
            valueAsNumber: true,
            min: { value: 1, message: 'Amount must be positive' }
          })}
          error={errors.amount?.message}
        />
        
        <Select
          id="paymentMethod"
          label="Payment Method"
          {...register('paymentMethod', { required: 'Payment method is required' })}
          error={errors.paymentMethod?.message}
        >
          <option value="Cash">Cash</option>
          <option value="UPI">UPI</option>
          <option value="Bank Transfer">Bank Transfer</option>
        </Select>
        
        <div className="pt-4">
            <Button type="submit" isLoading={isLoading} className="w-full" disabled={!isValid}>
                Recharge Wallet
            </Button>
        </div>

        {statusMessage && (
            <div className={`flex items-center p-3 rounded-md mt-4 text-sm ${statusMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {statusMessage.type === 'success' ? <CheckCircle className="mr-2" /> : <XCircle className="mr-2" />}
                {statusMessage.text}
            </div>
        )}
      </form>
    </Card>
  );
};

export default RechargeWallet;