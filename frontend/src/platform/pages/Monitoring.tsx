import { useEffect, useState } from 'react';
import { platformApi } from '../services/api';
import { Activity, Loader2, AlertCircle, Eye, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

export interface PlatformAuditLog {
  id: string;
  createdAt: string;
  action: string;
  entity: string;
  entityId?: string;
  ipAddress: string;
  userAgent: string;
  details?: string;
  platformAdmin?: { name: string };
}

export const Monitoring = () => {
  const [logs, setLogs] = useState<PlatformAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLogs = async () => {
    try {
      const { data } = await platformApi.get('/platform/monitoring/audit-logs', {
        params: { limit: 100 }
      });
      setLogs(data);
    } catch {
      setError('No se pudieron cargar los registros de auditoría.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    
    // Auto refresh every 30s
    const interval = setInterval(fetchLogs, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 flex flex-col h-full max-w-7xl mx-auto">
      <div className="flex justify-between items-center pr-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center">
             Monitorización de Plataforma
             {loading && <Loader2 className="animate-spin h-4 w-4 ml-3 text-orange-600" />}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Registro de auditoría inviolable para super administradores en tiempo real.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-100 py-1 px-3 rounded-md">
           <Activity className="h-4 w-4 text-green-500" />
           Live Logging Active
        </div>
      </div>

      {error && (
        <div className="bg-red-50 p-4 rounded-md flex items-center text-red-800">
          <AlertCircle className="h-5 w-5 mr-3" />
          {error}
        </div>
      )}

      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden flex-1 flex flex-col">
         {loading && logs.length === 0 ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
            </div>
          ) : (
            <div className="overflow-x-auto h-full">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marca de tiempo</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Administrador</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entidad / Objetivo</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP / Agente</th>
                    <th scope="col" className="relative px-6 py-3"><span className="sr-only">Detalles</span></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100 font-mono text-xs">
                  {logs.map((log: PlatformAuditLog) => (
                    <tr key={log.id} className="hover:bg-gray-50 group">
                      <td className="px-6 py-3 whitespace-nowrap text-gray-900 border-l-2 border-transparent group-hover:border-orange-500">
                        {format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm:ss')}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-blue-600 font-semibold">
                        {log.platformAdmin?.name || 'Sistema'}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                           log.action.includes('DELETE') ? 'bg-red-100 text-red-800' :
                           log.action.includes('UPDATE') || log.action.includes('PATCH') ? 'bg-yellow-100 text-yellow-800' :
                           log.action.includes('CREATE') ? 'bg-green-100 text-green-800' :
                           log.action === 'FAILED_LOGIN' ? 'bg-red-600 text-white' :
                           'bg-gray-100 text-gray-800'
                        }`}>
                           {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-gray-600 truncate max-w-[200px]">
                        {log.entity} {log.entityId ? `[${log.entityId}]` : ''}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-gray-400 text-[10px] truncate max-w-[150px]" title={log.userAgent}>
                        {log.ipAddress}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-right">
                        <button className="text-gray-400 hover:text-gray-900" title={`Detalles Payload: ${log.details}`}>
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {logs.length === 0 && (
                <div className="p-12 text-center text-gray-500 text-sm font-sans flex flex-col items-center">
                   <AlertTriangle className="h-10 w-10 text-gray-300 mb-3" />
                   No hay registros de auditoría en la plataforma.
                </div>
              )}
            </div>
          )}
      </div>
    </div>
  );
};
