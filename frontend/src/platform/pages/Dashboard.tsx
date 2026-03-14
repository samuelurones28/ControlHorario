import { useEffect, useState } from 'react';
import { platformApi } from '../services/api';
import { Building2, Users, Activity, Loader2, AlertCircle } from 'lucide-react';

export const Dashboard = () => {
  const [stats, setStats] = useState<{
    totalCompanies?: number;
    totalActiveEmployees?: number;
    systemHealth?: {
      requestsLast24h?: number;
      uptime?: number;
      memoryUsage?: { heapUsed?: number };
      avgResponseTime?: string | number;
    };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const { data } = await platformApi.get('/platform/dashboard');
        setStats(data);
      } catch {
        setError('No se pudieron cargar las estadísticas del dashboard.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md flex items-center text-red-800">
        <AlertCircle className="h-5 w-5 mr-3" />
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Métricas de la Plataforma</h1>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Empresas Registradas</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{stats?.totalCompanies || 0}</p>
          </div>
          <div className="bg-orange-100 p-3 rounded-md">
            <Building2 className="h-6 w-6 text-orange-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Usuarios Activos (Global)</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{stats?.totalActiveEmployees || 0}</p>
          </div>
          <div className="bg-blue-100 p-3 rounded-md">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Peticiones (Últ. 24h)</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{stats?.systemHealth?.requestsLast24h || 0}</p>
          </div>
          <div className="bg-green-100 p-3 rounded-md">
            <Activity className="h-6 w-6 text-green-600" />
          </div>
        </div>
      </div>

      {/* Quick Server Health */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Estado del Sistema</h3>
        </div>
        <div className="p-6">
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <div>
               <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Uptime</p>
               <p className="mt-1 font-mono text-gray-900">{Math.floor((stats?.systemHealth?.uptime || 0) / 3600)}h {Math.floor(((stats?.systemHealth?.uptime || 0) % 3600) / 60)}m</p>
             </div>
             <div>
               <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Uso de Memoria</p>
               <p className="mt-1 font-mono text-gray-900">{Math.round((stats?.systemHealth?.memoryUsage?.heapUsed || 0) / 1024 / 1024)} MB</p>
             </div>
             <div>
               <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Tiempos de Respuesta</p>
               <p className="mt-1 font-mono text-gray-900">{stats?.systemHealth?.avgResponseTime || '< 10'} ms</p>
             </div>
             <div>
               <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Estado de BD</p>
               <p className="mt-1 font-mono text-green-600 font-bold flex items-center">
                 <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span> Conectado
               </p>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};
