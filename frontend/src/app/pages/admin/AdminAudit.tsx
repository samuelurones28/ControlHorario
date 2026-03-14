import { useEffect, useState } from 'react';
import { getAuditLogs } from '../../services/api';
import { LogIn } from 'lucide-react';

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  employee: {
    id: string;
    name: string;
    identifier: string;
  } | null;
  ipAddress: string;
  createdAt: string;
}

interface AuditResponse {
  data: AuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export function AdminAudit() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    fetchLogs(page);
  }, [page]);

  const fetchLogs = async (pageNum: number) => {
    setLoading(true);
    try {
      const { data } = await getAuditLogs(pageNum, 50);
      const auditData = data as AuditResponse;
      setLogs(auditData.data);
      setPagination(auditData.pagination);
    } catch (err) {
      setError('Error al cargar los logs de auditoría');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('es-ES');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <LogIn className="w-6 h-6 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">Auditoría de Cambios</h1>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-gray-600">Cargando...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-gray-600">No hay logs de auditoría</div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900">Fecha</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900">Usuario</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900">Acción</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900">Entidad</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-gray-600">{formatDate(log.createdAt)}</td>
                    <td className="px-6 py-3">
                      {log.employee ? (
                        <div>
                          <p className="font-medium text-gray-900">{log.employee.name}</p>
                          <p className="text-xs text-gray-500">{log.employee.identifier}</p>
                        </div>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-600">{log.entity}</td>
                    <td className="px-6 py-3 text-xs text-gray-500 font-mono">{log.ipAddress}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Mostrando {logs.length} de {pagination.total} registros
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
                >
                  ← Anterior
                </button>
                <span className="px-3 py-1 text-sm text-gray-600">
                  Página {pagination.page} de {pagination.pages}
                </span>
                <button
                  onClick={() => setPage(Math.min(pagination.pages, page + 1))}
                  disabled={page === pagination.pages}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
                >
                  Siguiente →
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
