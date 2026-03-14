import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { platformApi } from '../services/api';
import { usePlatformAuth } from '../hooks/usePlatformAuth';
import { ShieldAlert, KeyRound, Loader2, AlertCircle, Copy, CheckCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const Setup2FA = () => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // setupInfo comes directly from the login response stored in Zustand
  const { setupInfo, pendingEmail, needsSetup, setAuth, reset } = usePlatformAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!needsSetup || !pendingEmail || !setupInfo) {
      navigate('/login');
    }
  }, [needsSetup, pendingEmail, setupInfo, navigate]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupInfo || pin.length < 6 || !pendingEmail) return;

    setIsLoading(true);
    setError('');

    try {
      // Backend endpoint: POST /platform/auth/login/setup-totp
      // Body: { email, totpCode, secret }
      const { data } = await platformApi.post('/platform/auth/login/setup-totp', {
        email: pendingEmail,
        totpCode: pin,
        secret: setupInfo.secret,
      });

      // After setup, backend returns accessToken and backupCodes
      setAuth({
        admin: data.admin || { email: pendingEmail, name: pendingEmail, id: '', role: 'SUPER_ADMIN' },
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

  const copySecret = () => {
    if (!setupInfo) return;
    navigator.clipboard.writeText(setupInfo.secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!setupInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="animate-spin h-10 w-10 text-orange-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="flex justify-center">
          <ShieldAlert className="h-16 w-16 text-orange-600" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Configurar Autenticación de Dos Factores (2FA)
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Es obligatorio asegurar su cuenta de superadministrador.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border-t-4 border-orange-600">

          {error && (
            <div className="mb-6 rounded-md bg-red-50 p-4 border border-red-200">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* QR Section */}
            <div className="flex flex-col items-center border-r border-gray-200 pr-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">1. Escanee el código QR</h3>
              <p className="text-sm text-gray-500 text-center mb-4">
                Use Google Authenticator, Authy, u otra app 2FA.
              </p>
              <img src={setupInfo.qrCodeUrl} alt="QR Code 2FA" className="w-48 h-48 border border-gray-200 rounded-md p-2" />
              <div className="mt-4 w-full">
                <p className="text-xs text-gray-500 mb-1 text-center">O introduzca la clave manualmente:</p>
                <div className="flex items-center gap-2 bg-gray-100 p-2 rounded">
                  <p className="font-mono text-xs text-gray-700 break-all flex-1 text-center">{setupInfo.secret}</p>
                  <button onClick={copySecret} className="text-orange-600 hover:text-orange-700 flex-shrink-0">
                    {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Verify Section */}
            <div className="flex flex-col justify-center">
              <h3 className="text-lg font-medium text-gray-900 mb-4">2. Verifique el código</h3>
              <form onSubmit={handleVerify} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Código de 6 dígitos</label>
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
                      className="focus:ring-orange-500 focus:border-orange-500 block w-full pl-10 sm:text-lg border-gray-300 rounded-md py-3 border tracking-[0.5em] text-center font-mono"
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
                  {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Activar 2FA y Entrar'}
                </button>
              </form>

              <button
                onClick={() => { reset(); navigate('/login'); }}
                className="mt-6 text-sm text-gray-500 hover:text-gray-700 text-center"
              >
                ← Volver al login
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
