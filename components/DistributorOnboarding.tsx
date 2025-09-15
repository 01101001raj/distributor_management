import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import Card from './common/Card';
import Input from './common/Input';
import Button from './common/Button';
import { api } from '../services/mockApiService';
import { useAuth } from '../hooks/useAuth';
import { FileUp, CheckCircle, XCircle } from 'lucide-react';
// FIX: Use namespace import for react-router-dom to resolve export errors.
import * as ReactRouterDOM from 'react-router-dom';

interface FormInputs {
  name: string;
  phone: string;
  state: string;
  area: string;
  hasSpecialPricing: boolean;
  hasSpecialSchemes: boolean;
}

const DistributorOnboarding: React.FC = () => {
  const { register, handleSubmit, formState: { errors, isValid }, reset } = useForm<FormInputs>({
      mode: 'onBlur',
      defaultValues: {
        name: '',
        phone: '',
        state: '',
        area: '',
        hasSpecialPricing: false,
        hasSpecialSchemes: false,
      }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const { currentUser } = useAuth();
  const navigate = ReactRouterDOM.useNavigate();

  const onSubmit: SubmitHandler<FormInputs> = async (data) => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const newDistributor = await api.addDistributor({
        name: data.name,
        phone: data.phone,
        state: data.state,
        area: data.area,
        hasSpecialPricing: data.hasSpecialPricing,
        hasSpecialSchemes: data.hasSpecialSchemes,
        addedByExecId: currentUser!.username,
      });
      setStatusMessage({ type: 'success', text: `Distributor "${data.name}" added successfully! You will be redirected to their details page.` });
      reset();
      setTimeout(() => {
        navigate(`/distributors/${newDistributor.id}`);
      }, 2000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      setStatusMessage({ type: 'error', text: `Failed to add distributor: ${errorMessage}` });
    } finally {
      setIsLoading(false);
    }
  };

  if (currentUser?.role === 'User') {
      return (
          <Card className="text-center">
              <p className="text-text-secondary">You do not have permission to add distributors.</p>
          </Card>
      );
  }

  return (
    <Card className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-text-primary">New Distributor Onboarding</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            id="name"
            label="Distributor Name (Firm Name)"
            {...register('name', { required: 'Name is required' })}
            error={errors.name?.message}
            className="md:col-span-2"
          />
          <Input
            id="phone"
            label="Phone Number"
            type="tel"
            {...register('phone', { 
                required: 'Phone number is required',
                pattern: { value: /^\d{10}$/, message: 'Enter a valid 10-digit phone number' }
            })}
            error={errors.phone?.message}
          />
           <Input
            id="state"
            label="State"
            {...register('state', { required: 'State is required' })}
            error={errors.state?.message}
          />
         <Input
            id="area"
            label="Area Name"
            {...register('area', { required: 'Area Name is required' })}
            error={errors.area?.message}
          />
        </div>
        <div className="space-y-2 pt-2">
            <h3 className="text-sm font-medium text-text-secondary">Special Conditions</h3>
            <div className="flex items-center space-x-8">
                 <label className="flex items-center space-x-2 cursor-pointer text-sm">
                    <input type="checkbox" {...register('hasSpecialPricing')} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                    <span>Eligible for Special Prices</span>
                 </label>
                 <label className="flex items-center space-x-2 cursor-pointer text-sm">
                    <input type="checkbox" {...register('hasSpecialSchemes')} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                    <span>Eligible for Special Schemes</span>
                 </label>
            </div>
        </div>

        <div className="pt-4 flex justify-end">
            <Button type="submit" isLoading={isLoading} disabled={!isValid}>
                Add Distributor
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

export default DistributorOnboarding;