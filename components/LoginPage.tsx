import React, { useState } from 'react';
// FIX: Use namespace import for react-router-dom to resolve export errors.
import * as ReactRouterDOM from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useForm, SubmitHandler } from 'react-hook-form';
import Card from './common/Card';
import Button from './common/Button';
import Input from './common/Input';
import { Briefcase } from 'lucide-react';

interface FormInputs {
  username: string;
  password: string;
}

const LoginPage: React.FC = () => {
  const { register, handleSubmit, formState: { errors, isValid } } = useForm<FormInputs>({
    mode: 'onChange',
    defaultValues: {
      username: '',
      password: '',
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = ReactRouterDOM.useNavigate();

  const handleLogin: SubmitHandler<FormInputs> = async (data) => {
    setIsLoading(true);
    setLoginError(null);
    try {
      await login(data.username, data.password);
      navigate('/dashboard');
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="max-w-sm w-full">
        <div className="text-center mb-8">
            <Briefcase size={40} className="mx-auto text-primary" />
            <h1 className="text-3xl font-bold text-text-primary mt-4">Distributor Portal</h1>
            <p className="text-text-secondary mt-1">Please sign in to continue</p>
        </div>
        <Card>
            <form onSubmit={handleSubmit(handleLogin)} className="space-y-4">
            <Input
                id="username"
                label="Username"
                {...register('username', { required: 'Username is required' })}
                error={errors.username?.message}
                autoComplete="username"
            />
            <Input
                id="password"
                label="Password"
                type="password"                
                {...register('password', { required: 'Password is required' })}
                error={errors.password?.message}
                autoComplete="current-password"
            />
            {loginError && <p className="text-sm text-red-700 text-center pt-2">{loginError}</p>}
            <div className="pt-4">
                <Button type="submit" className="w-full" size="lg" isLoading={isLoading} disabled={!isValid}>
                    Login
                </Button>
            </div>
            </form>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;