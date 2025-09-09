import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import Card from './common/Card';
import Input from './common/Input';
import Button from './common/Button';
import { api } from '../services/mockApiService';
import { useAuth } from '../hooks/useAuth';
import { FileUp, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface FormInputs {
  name: string;
  phone: string;
  state: string;
  area: string;
  hasSpecialPricing: boolean;
  hasSpecialSchemes: boolean;
  agreementFile: FileList;
}

const DistributorOnboarding: React.FC = () => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormInputs>();
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [fileName, setFileName] = useState('');
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const onSubmit: SubmitHandler<FormInputs> = async (data) => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const agreementFile = data.agreementFile.length > 0 ? data.agreementFile[0] : null;
      const newDistributor = await api.addDistributor({
        name: data.name,
        phone: data.phone,
        state: data.state,
        area: data.area,
        hasSpecialPricing: data.hasSpecialPricing,
        hasSpecialSchemes: data.hasSpecialSchemes,
        agreementFile,
        addedByExecId: currentUser!.username,
      });
      setStatusMessage({ type: 'success', text: `Distributor "${data.name}" added successfully! You will be redirected to their details page.` });
      reset();
      setFileName('');
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
    <Card className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-text-primary">New Distributor Onboarding</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Input
          id="name"
          label="Distributor Name (Firm Name)"
          {...register('name', { required: 'Name is required' })}
          error={errors.name?.message}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        <div className="space-y-4">
            <h3 className="text-sm font-medium text-text-secondary">Special Conditions</h3>
            <div className="flex items-center space-x-8">
                 <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" {...register('hasSpecialPricing')} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                    <span>Special Prices</span>
                 </label>
                 <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" {...register('hasSpecialSchemes')} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                    <span>Special Schemes</span>
                 </label>
            </div>
        </div>

        <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
                Agreement Upload
            </label>
            <label htmlFor="agreementFile" className="relative cursor-pointer bg-white rounded-md border border-gray-300 hover:border-primary p-2 flex items-center justify-center">
                 <FileUp className="w-5 h-5 text-black mr-2" />
                 <span className="text-sm text-text-secondary">{fileName || 'Click to upload a file'}</span>
                 <input id="agreementFile" type="file" {...register('agreementFile')} onChange={(e) => setFileName(e.target.files?.[0]?.name || '')} className="sr-only"/>
            </label>
        </div>
        
        <div className="pt-4">
            <Button type="submit" isLoading={isLoading} className="w-full">
                Add Distributor
            </Button>
        </div>

        {statusMessage && (
            <div className={`flex items-center p-3 rounded-md mt-4 ${statusMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {statusMessage.type === 'success' ? <CheckCircle className="mr-2" /> : <XCircle className="mr-2" />}
                {statusMessage.text}
            </div>
        )}
      </form>
    </Card>
  );
};

export default DistributorOnboarding;