import React, { useState } from 'react';
import { platformApi } from '../services/api';
import { Search, ShieldAlert, Key, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

interface SupportCompany {
  name: string;
  cif: string;
}

interface SupportUser {
  id: string;
  name: string;
  active: boolean;
  email: string | null;
  identifier: string;
  role: string;
  company?: SupportCompany;
}

export const Support = () => {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<SupportUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const searchUsers = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!search) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { data } = await platformApi.get('/platform/support/users/search', {
        params: { query: search }
      });
      setUsers(data);
    } catch {
      setError('Error al buscar usuarios. Verifique los parámetros.');
    } finally {
      setLoading(false);
    }
  };

  const handleImpersonate = async (userId: string) => {
    try {
      const { data } = await platformApi.post(`/platform/support/users/${userId}/impersonate`, {
        reason: 'Soporte técnico a ' + search
      });
      
      // We receive an app token. We could potentially store it and open a new tab into the main app.
      // For this prototype, we'll just show the token or a success message
      setSuccess(`Sesión de suplantación iniciada. Token generado: ${data.accessToken.substring(0, 20)}...`);
    } catch (e) {
      const err = e as { response?: { data?: { error?: string } } };
      setError(err.response?.data?.error || 'Error al iniciar suplantación');
    }
  };

  const handleResetPassword = async (userId: string) => {
    if (!window.confirm('¿Desea forzar el reinicio de contraseña de este usuario? (Tendrá que usar la nueva contraseña temporal)')) return;
    
    try {
      const { data } = await platformApi.post(`/platform/support/users/${userId}/reset-password`, {
        reason: 'Petición directa del usuario (Soporte)'
      });
      
      setSuccess(`Contraseña reiniciada. Nueva temporal: ${data.temporaryPassword}`);
    } catch (e) {
      const err = e as { response?: { data?: { error?: string } } };
      setError(err.response?.data?.error || 'Error al reiniciar contraseña');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Soporte Nivel 2</h1>
        <p className="mt-1 text-sm text-gray-500">
          Búsqueda global de cuentas de empleados, suplantación y reseteo de seguridad.
        </p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <form onSubmit={searchUsers} className="flex gap-4">
          <div className="flex-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="focus:ring-orange-500 focus:border-orange-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-3 border"
              placeholder="Buscar por Email, Nombre o DNI/NIE..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !search}
            className="inline-flex justify-center py-3 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400"
          >
            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Buscar'}
          </button>
        </form>
      </div>

      {error && (
        <div className="bg-red-50 p-4 rounded-md border border-red-200 flex items-start text-red-800">
          <AlertCircle className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 p-4 rounded-md border border-green-200 flex items-start text-green-800">
          <CheckCircle2 className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
          <div className="text-sm font-medium break-all">{success}</div>
        </div>
      )}

      {users.length > 0 && (
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {users.map((user) => (
              <li key={user.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate flex items-center gap-2">
                      {user.name} 
                      {!user.active && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">Inactivo</span>}
                    </p>
                    <p className="text-sm text-gray-500 truncate flex items-center gap-2 mt-1">
                      {user.email || 'Sin Email'} • {user.identifier} • Rol: {user.role}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                       Empresa: {user.company?.name} ({user.company?.cif})
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleResetPassword(user.id)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                    >
                      <Key className="h-4 w-4 mr-2 text-gray-400" />
                      Reset PIN/Pass
                    </button>
                    <button
                      onClick={() => handleImpersonate(user.id)}
                      className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none"
                    >
                      <ShieldAlert className="h-4 w-4 mr-2" />
                      Impersonar (Ojo)
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!loading && search && users.length === 0 && !error && (
        <p className="text-center text-gray-500 mt-10">No se encontraron resultados para la búsqueda.</p>
      )}
    </div>
  );
};
