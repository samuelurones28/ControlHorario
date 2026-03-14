import { useEffect, useState, useCallback } from 'react';
import { platformApi } from '../services/api';
import { Loader2, AlertCircle, Search, ToggleLeft, ToggleRight } from 'lucide-react';
import { format } from 'date-fns';

interface PlatformCompany {
  id: string;
  name: string;
  cif: string;
  activeEmployeeCount: number;
  employeeCount: number;
  status: 'active' | 'inactive';
  createdAt: string;
}

export const Companies = () => {
  const [companies, setCompanies] = useState<PlatformCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const fetchCompanies = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await platformApi.get('/platform/companies', {
        params: { search, page: 1, limit: 50 }
      });
      setCompanies(data.data);
    } catch {
      setError('No se pudieron cargar las empresas.');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchCompanies();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [fetchCompanies]);

  const toggleCompanyStatus = async (id: string, currentStatus: string) => {
    // Attempting to toggle active status. 
    // In backend this currently logs an audit and returns success (pending schema update)
    try {
      const active = currentStatus !== 'active';
      await platformApi.patch(`/platform/companies/${id}/status`, { 
        active, 
        reason: 'Manually toggled by Platform Admin' 
      });
      // Refresh list
      fetchCompanies();
    } catch {
      alert("Error al actualizar estado");
    }
  };

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Gestión de Empresas</h1>
        
        <div className="w-full sm:w-auto relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            className="focus:ring-orange-500 focus:border-orange-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border"
            placeholder="Buscar por nombre o CIF..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 p-4 rounded-md flex items-center text-red-800">
          <AlertCircle className="h-5 w-5 mr-3" />
          {error}
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden flex-1 overflow-y-auto">
          {loading && companies.length === 0 ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Empresa / CIF
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Empleados
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Alta
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {companies.map((company) => (
                  <tr key={company.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 rounded bg-orange-100 flex items-center justify-center text-orange-700 font-bold text-lg">
                          {company.name.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{company.name}</div>
                          <div className="text-sm text-gray-500">{company.cif}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{company.activeEmployeeCount} Activos</div>
                      <div className="text-xs text-gray-500">De {company.employeeCount} Totales</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(company.createdAt), 'dd MMM yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        company.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {company.status === 'active' ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => toggleCompanyStatus(company.id, company.status)}
                        className="text-gray-400 hover:text-orange-600 transition-colors"
                        title={company.status === 'active' ? "Desactivar Empresa" : "Activar Empresa"}
                      >
                        {company.status === 'active' ? <ToggleRight className="h-6 w-6 text-green-500" /> : <ToggleLeft className="h-6 w-6" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          
          {!loading && companies.length === 0 && (
             <div className="text-center py-12 text-gray-500">No se encontraron empresas con este criterio.</div>
          )}
        </div>
      )}
    </div>
  );
};
