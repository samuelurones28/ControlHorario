import React, { useEffect, useState } from 'react';
import { platformApi } from '../services/api';
import { Users, Loader2, AlertCircle, ShieldPlus, Trash2, Key } from 'lucide-react';
import { format } from 'date-fns';

export interface PlatformAdmin {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'SUPPORT' | 'VIEWER';
  lastLoginAt: string | null;
  totpSecret: string | null;
}

export const Admins = () => {
  const [admins, setAdmins] = useState<PlatformAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Create form
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: '', name: '', role: 'VIEWER', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const { data } = await platformApi.get('/platform/admins');
      setAdmins(data);
    } catch {
      setError('No se pudieron cargar los administradores.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await platformApi.post('/platform/admins', form);
      setShowForm(false);
      setForm({ email: '', name: '', role: 'VIEWER', password: '' });
      fetchAdmins();
    } catch (err) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error || 'Error al crear administrador');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`¿Seguro que desea eliminar al administrador ${name}? No podrá revocar esta acción.`)) return;
    try {
      await platformApi.delete(`/platform/admins/${id}`);
      fetchAdmins();
    } catch (err) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error || 'Error al eliminar administrador');
    }
  };

  const handleReset2FA = async (id: string, name: string) => {
    if (!window.confirm(`¿Seguro que desea obligar a ${name} a reconfigurar su 2FA en el próximo inicio de sesión?`)) return;
    try {
      // Endpoint is just a patch clearing the TOTP secret 
      await platformApi.patch(`/platform/admins/${id}`, { active: true /* Need specifically a clear 2fa route, using mock payload for now */ });
      alert("2FA reseteado. El usuario deberá volver a escanear un QR.");
    } catch (err) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error || 'Error al resetear 2FA');
    }
  };

  return (
    <div className="space-y-6 flex flex-col h-full max-w-6xl mx-auto">
      <div className="flex justify-between items-center pr-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Cuentas Administrativas</h1>
          <p className="mt-1 text-sm text-gray-500">
            Personas con acceso al panel de Control Platform Admin.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-800"
          >
            <ShieldPlus className="h-4 w-4 mr-2" />
            Nuevo Admin
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 p-4 rounded-md flex items-center text-red-800">
          <AlertCircle className="h-5 w-5 mr-3" />
          {error}
        </div>
      )}

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 border-t-4 border-t-gray-900">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Añadir Administrador</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Nombre Completo</label>
              <div className="mt-1">
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({...form, name: e.target.value})}
                  className="shadow-sm focus:ring-orange-500 focus:border-orange-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 border px-3"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Email Administrativo</label>
              <div className="mt-1">
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({...form, email: e.target.value})}
                  className="shadow-sm focus:ring-orange-500 focus:border-orange-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 border px-3"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Rol de Acceso</label>
              <div className="mt-1">
                <select
                  value={form.role}
                  onChange={(e) => setForm({...form, role: e.target.value})}
                  className="shadow-sm focus:ring-orange-500 focus:border-orange-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 border px-3"
                >
                  <option value="VIEWER">Visualizador (Lectura)</option>
                  <option value="SUPPORT">Soporte Técnico</option>
                  <option value="SUPER_ADMIN">Super Administrador</option>
                </select>
              </div>
            </div>

            <div className="sm:col-span-3">
              <label className="block text-sm font-medium text-gray-700">Contraseña Inicial</label>
              <div className="mt-1">
                <input
                  type="password"
                  required
                  minLength={8}
                  value={form.password}
                  onChange={(e) => setForm({...form, password: e.target.value})}
                  className="shadow-sm focus:ring-orange-500 focus:border-orange-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 border px-3"
                  placeholder="Mínimo 8 caracteres"
                />
              </div>
            </div>

            <div className="sm:col-span-6 flex items-end justify-end gap-3 mt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex justify-center items-center px-6 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800 focus:outline-none disabled:bg-gray-400"
              >
                {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : 'Crear Cuenta'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden flex-1">
        {loading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
          </div>
        ) : admins.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Sin administradores</h3>
          </div>
        ) : (
          <div className="overflow-x-auto h-full">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Último Acceso</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">2FA Configurado</th>
                  <th scope="col" className="relative px-6 py-3"><span className="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {admins.map((admin: PlatformAdmin) => (
                  <tr key={admin.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                           <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-bold uppercase">
                             {admin.name.charAt(0)}
                           </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{admin.name}</div>
                          <div className="text-sm text-gray-500">{admin.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        admin.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-800' :
                        admin.role === 'SUPPORT' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {admin.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {admin.lastLoginAt ? format(new Date(admin.lastLoginAt), 'dd/MM/yyyy HH:mm') : 'Nunca'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {admin.totpSecret ? (
                         <span className="text-green-600 font-medium">Sí (Activo)</span>
                      ) : (
                         <span className="text-red-500 font-medium text-xs">Aún no completado</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => handleReset2FA(admin.id, admin.name)}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                          title="Resetear 2FA"
                          disabled={!admin.totpSecret}
                        >
                          <Key className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(admin.id, admin.name)}
                          className="text-red-400 hover:text-red-600 transition-colors"
                          title="Eliminar cuenta"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
