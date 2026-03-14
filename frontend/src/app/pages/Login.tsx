import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useWebAuthn } from '../hooks/useWebAuthn';
import { Clock, Key, Mail, Lock, User, Fingerprint, Loader } from 'lucide-react';
import clsx from 'clsx';

interface SavedEmployeeCredentials {
  companyCode: string;
  identifier: string;
  name?: string;
}

export const Login = () => {
  const [isEmployee, setIsEmployee] = useState(true);
  const [email, setEmail] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [companyCode, setCompanyCode] = useState('');
  const [pin, setPin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [savedCredentials, setSavedCredentials] = useState<SavedEmployeeCredentials | null>(null);
  const [showQuickLogin, setShowQuickLogin] = useState(false);
  const [useBiometric, setUseBiometric] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { isWebAuthnSupported, authenticateWithBiometric } = useWebAuthn();
  const navigate = useNavigate();

  useEffect(() => {
    // Cargar credenciales guardadas al montar
    const saved = localStorage.getItem('employee_quick_login');
    if (saved) {
      try {
        setSavedCredentials(JSON.parse(saved));
        setShowQuickLogin(true);
      } catch (e) {
        // Ignorar si no puede parsear
      }
    }
  }, []);

  const handleKeypadPress = (num: string) => {
    if (pin.length < 6) {
      setPin(prev => prev + num);
      setError('');
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError('');
  };

  const handleQuickLogin = () => {
    if (savedCredentials) {
      setCompanyCode(savedCredentials.companyCode);
      setIdentifier(savedCredentials.identifier);
      setPin(''); // Reset PIN
      setUseBiometric(false);
      setError('');
      // Focus en el PIN
      setTimeout(() => {
        const pinInput = document.querySelector('input[placeholder="••••••"]') as HTMLInputElement;
        pinInput?.focus();
      }, 100);
    }
  };

  const handleQuickLoginBiometric = async () => {
    if (!savedCredentials) return;

    setError('');
    setIsLoading(true);

    try {
      const result = await authenticateWithBiometric(
        savedCredentials.companyCode,
        savedCredentials.identifier
      );

      // Set the token and navigate
      const { login: authLogin } = useAuth.getState();
      authLogin(
        {
          companyCode: savedCredentials.companyCode,
          identifier: savedCredentials.identifier,
          pin: ''
        },
        false
      );

      // Manually set token and navigate
      localStorage.setItem('accessToken', result.accessToken);
      navigate('/');
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Autenticación biométrica fallida');
      setIsLoading(false);
    }
  };

  const handleClearSavedCredentials = () => {
    localStorage.removeItem('employee_quick_login');
    setSavedCredentials(null);
    setShowQuickLogin(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isEmployee && pin.length !== 6) {
      setError('El PIN debe tener 6 dígitos');
      return;
    }

    try {
      if (isEmployee) {
        await login({ companyCode, identifier, pin }, false);
        // Guardar credenciales para próximo login (sin el PIN)
        const toSave: SavedEmployeeCredentials = {
          companyCode,
          identifier,
          name: identifier // Se puede actualizar con el nombre real del empleado
        };
        localStorage.setItem('employee_quick_login', JSON.stringify(toSave));
      } else {
        await login({ email, password }, true);
      }
      navigate('/');
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Credenciales inválidas');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4 py-12 animate-fade-in-up">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-neutral-100 overflow-hidden">
        <div className="bg-neutral-900 px-8 py-10 text-center text-white pb-14 relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-400 to-primary-600"></div>
          <div className="w-16 h-16 bg-neutral-800 rounded-2xl mx-auto mb-5 flex items-center justify-center shadow-inner">
             <Clock className="w-8 h-8 text-primary-500" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Control Horario</h1>
          <p className="text-neutral-400 font-medium text-xs mt-2 uppercase tracking-wide">Acceso al Sistema RDL 8/2019</p>
        </div>

        <div className="px-8 pb-8 pt-0 -mt-6">
          <div className="flex bg-neutral-100 p-1 rounded-xl mb-8 relative z-10 shadow-sm border border-neutral-200/50">
            <button
              className={clsx("flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all", isEmployee ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-900")}
              onClick={() => { setIsEmployee(true); setError(''); }}
              type="button"
            >
              Empleado
            </button>
            <button
              className={clsx("flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all", !isEmployee ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-900")}
              onClick={() => { setIsEmployee(false); setError(''); }}
              type="button"
            >
              Administrador
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-danger-50 text-danger-700 rounded-xl text-sm text-center font-medium border border-danger-100">
              {error}
            </div>
          )}

          {/* Quick login option for employees */}
          {isEmployee && showQuickLogin && savedCredentials && (
            <div className="mb-6 space-y-3">
              {/* Biometric option */}
              {isWebAuthnSupported() && (
                <button
                  type="button"
                  onClick={handleQuickLoginBiometric}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm border border-primary-700"
                >
                  {isLoading ? (
                    <Loader className="w-5 h-5 animate-spin" />
                  ) : (
                    <Fingerprint className="w-5 h-5" />
                  )}
                  {isLoading ? 'Verificando...' : 'Desbloquear con biometría'}
                </button>
              )}

              {/* PIN option */}
              <button
                type="button"
                onClick={handleQuickLogin}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl text-sm font-semibold text-white bg-success-600 hover:bg-success-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm border border-success-700"
              >
                <User className="w-5 h-5" />
                Continuar como {savedCredentials.identifier} (PIN)
              </button>

              <button
                type="button"
                onClick={handleClearSavedCredentials}
                disabled={isLoading}
                className="w-full text-xs text-neutral-500 hover:text-neutral-700 disabled:opacity-50 transition-colors"
              >
                ¿Eres otro empleado?
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">

            {isEmployee ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-1.5">Cód. Empresa</label>
                    <input
                      type="text"
                      required
                      className="block w-full px-4 py-3 uppercase text-sm font-medium rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
                      placeholder="ACME01"
                      value={companyCode}
                      onChange={(e) => { setCompanyCode(e.target.value.toUpperCase()); setError(''); }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-1.5">Identificador</label>
                    <input
                      type="text"
                      required
                      className="block w-full px-4 py-3 text-sm font-medium rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
                      placeholder="lgomez"
                      value={identifier}
                      onChange={(e) => { setIdentifier(e.target.value); setError(''); }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-1.5 flex justify-between">
                     <span>PIN Seguro</span>
                     {pin.length > 0 && <span className="text-primary-500">{pin.length}/6</span>}
                  </label>
                  <div className="relative mb-6">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Key className="h-5 w-5 text-neutral-400" />
                    </div>
                    <input
                      type="password"
                      readOnly
                      className="block w-full pl-11 pr-4 py-3.5 rounded-xl border border-neutral-200 bg-neutral-50 text-center tracking-[0.5em] font-bold text-xl text-neutral-900 focus:outline-none"
                      placeholder="••••••"
                      value={pin}
                    />
                  </div>
                </div>
                
                <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100">
                   <div className="grid grid-cols-3 gap-2 sm:gap-3">
                     {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                       <button
                         key={num}
                         type="button"
                         onClick={() => handleKeypadPress(num.toString())}
                         className="py-3 sm:py-4 bg-white hover:bg-neutral-100 active:bg-neutral-200 rounded-lg border border-neutral-200 text-xl font-semibold text-neutral-700 transition-colors shadow-sm"
                       >
                         {num}
                       </button>
                     ))}
                     <button type="button" className="py-3 sm:py-4 bg-transparent border border-transparent pointer-events-none"></button>
                     <button
                       type="button"
                       onClick={() => handleKeypadPress('0')}
                       className="py-3 sm:py-4 bg-white hover:bg-neutral-100 active:bg-neutral-200 rounded-lg border border-neutral-200 text-xl font-semibold text-neutral-700 transition-colors shadow-sm"
                     >
                       0
                     </button>
                     <button
                       type="button"
                       onClick={handleDelete}
                       className="py-3 sm:py-4 bg-neutral-200 hover:bg-neutral-300 active:bg-neutral-400 text-neutral-700 rounded-lg border border-neutral-200 text-sm font-semibold transition-colors shadow-sm flex items-center justify-center"
                     >
                       Borrar
                     </button>
                   </div>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-1.5">Correo Electrónico</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-neutral-400" />
                    </div>
                    <input
                      type="email"
                      required
                      className="block w-full pl-11 pr-4 py-3 text-sm rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
                      placeholder="admin@empresa.com"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-1.5">Contraseña</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-neutral-400" />
                    </div>
                    <input
                      type="password"
                      required
                      className="block w-full pl-11 pr-4 py-3 text-sm rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    />
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full flex justify-center py-3.5 px-4 rounded-xl text-base font-semibold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors shadow-sm mt-8"
            >
              Iniciar sesión
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
