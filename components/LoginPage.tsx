import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useForm, SubmitHandler } from 'react-hook-form';
import Card from './common/Card';
import Button from './common/Button';
import Input from './common/Input';

interface FormInputs {
  username: string;
  password: string;
}

const LoginPage: React.FC = () => {
  const { register, handleSubmit, formState: { errors, isValid } } = useForm<FormInputs>({
    mode: 'onBlur',
    defaultValues: {
      username: '',
      password: '',
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

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
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">Distributor Portal</h1>
          <p className="text-text-secondary mt-2">Please sign in to continue</p>
        </div>
        <form onSubmit={handleSubmit(handleLogin)} className="space-y-6">
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
          {loginError && <p className="text-sm text-red-600 text-center">{loginError}</p>}
          <Button type="submit" className="w-full" size="lg" isLoading={isLoading} disabled={!isValid}>
            Login
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default LoginPage;