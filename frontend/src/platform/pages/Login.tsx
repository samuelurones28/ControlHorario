import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { platformApi } from '../services/api';
import { usePlatformAuth } from '../hooks/usePlatformAuth';
import { Shield, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { setPending2FA, setAuth } = usePlatformAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { data } = await platformApi.post('/platform/auth/login', { email, password });

      if (data.requiresTOTP) {
        // Store pending state (email needed for verify/setup endpoints)
        setPending2FA({
          requiresTOTP: true,
          needsSetup: !!data.needsSetup,
          email,
          setupInfo: data.setupInfo, // present only when needsSetup === true
        });

        if (data.needsSetup) {
          navigate('/setup-2fa');
        } else {
          navigate('/verify-2fa');
        }
      } else {
        // Non-SUPER_ADMIN without 2FA required — direct login
        setAuth({ admin: data.admin, token: data.accessToken });
        navigate('/');
      }
    } catch (err) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error || 'Error al iniciar sesión en la plataforma');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Shield className="h-16 w-16 text-orange-600" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Super Admin Platform
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Uso exclusivo para administradores de la red.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border-t-4 border-orange-600">
          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="rounded-md bg-red-50 p-4 border border-red-200">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                  <h3 className="ml-3 text-sm font-medium text-red-800">{error}</h3>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">Email Administrativo</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="focus:ring-orange-500 focus:border-orange-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-3 border"
                  placeholder="admin@empresa.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Contraseña</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="focus:ring-orange-500 focus:border-orange-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-3 border"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={twMerge(
                clsx(
                  "w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors",
                  isLoading && "opacity-75 cursor-not-allowed"
                )
              )}
            >
              {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Entrar a la Plataforma'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
