import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { platformApi } from '../services/api';
import { usePlatformAuth } from '../hooks/usePlatformAuth';
import { Shield, KeyRound, Loader2, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const Verify2FA = () => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { requiresTOTP, pendingEmail, setAuth, reset } = usePlatformAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!requiresTOTP || !pendingEmail) {
      navigate('/login');
    }
  }, [requiresTOTP, pendingEmail, navigate]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 6 || !pendingEmail) return;

    setIsLoading(true);
    setError('');

    try {
      // Backend endpoint: POST /platform/auth/login/verify-totp
      // Body: { email, totpCode }
      const { data } = await platformApi.post('/platform/auth/login/verify-totp', {
        email: pendingEmail,
        totpCode: pin,
      });

      setAuth({
        admin: data.admin,
        token: data.accessToken,
      });

      navigate('/');
    } catch (err) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error || 'Código incorrecto. Inténtalo de nuevo.');
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
          Autenticación Requerida
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Introduzca el código de verificación de su aplicación 2FA.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border-t-4 border-orange-600">
          <form className="space-y-6" onSubmit={handleVerify}>
            {error && (
              <div className="rounded-md bg-red-50 p-4 border border-red-200">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
                  <h3 className="text-sm font-medium text-red-800">{error}</h3>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 text-center mb-2">Código de 6 dígitos</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyRound className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  required
                  maxLength={6}
                  inputMode="numeric"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  className="focus:ring-orange-500 focus:border-orange-500 block w-full pl-10 sm:text-2xl border-gray-300 rounded-md py-4 border tracking-[0.5em] text-center font-mono"
                  placeholder="000000"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || pin.length !== 6}
              className={twMerge(
                clsx(
                  "w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 transition-colors",
                  (isLoading || pin.length !== 6) && "opacity-75 cursor-not-allowed"
                )
              )}
            >
              {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Verificar y Entrar'}
            </button>

            <button
              type="button"
              onClick={() => { reset(); navigate('/login'); }}
              className="w-full text-sm text-gray-500 hover:text-gray-700 text-center mt-2"
            >
              ← Volver al login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
