import React, { useEffect, useState } from 'react';
import { platformApi } from '../services/api';
import { CalendarOff, Loader2, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export interface PlatformHoliday {
  id: string;
  name: string;
  date: string;
}

export const Holidays = () => {
  const [holidays, setHolidays] = useState<PlatformHoliday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newName, setNewName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchHolidays = async () => {
    try {
      setLoading(true);
      const { data } = await platformApi.get('/platform/holidays', {
        params: { year: new Date().getFullYear() }
      });
      setHolidays(data);
    } catch {
      setError('No se pudieron cargar los festivos nacionales.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate || !newName) return;
    setIsSubmitting(true);
    try {
      await platformApi.post('/platform/holidays', {
        date: new Date(newDate).toISOString(),
        name: newName
      });
      setShowForm(false);
      setNewDate('');
      setNewName('');
      fetchHolidays();
    } catch (err) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error || 'Error al crear festivo');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`¿Seguro que desea eliminar el festivo "${name}"? Esto afectará al cómputo de días laborales de TODAS las empresas.`)) return;
    try {
      await platformApi.delete(`/platform/holidays/${id}`);
      fetchHolidays();
    } catch (err) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error || 'Error al eliminar');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto h-full flex flex-col">
      <div className="flex justify-between items-center pr-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Festivos Nacionales</h1>
          <p className="mt-1 text-sm text-gray-500">
            Días no laborables universales para todas las empresas de España.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Añadir Festivo
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
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Registrar Nuevo Festivo</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Fecha</label>
              <div className="mt-1">
                <input
                  type="date"
                  required
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="shadow-sm focus:ring-orange-500 focus:border-orange-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 border px-3"
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label className="block text-sm font-medium text-gray-700">Nombre / Motivo</label>
              <div className="mt-1">
                <input
                  type="text"
                  required
                  placeholder="Ej: Día de la Hispanidad"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="shadow-sm focus:ring-orange-500 focus:border-orange-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 border px-3"
                />
              </div>
            </div>

            <div className="sm:col-span-1 flex items-end">
              <div className="flex gap-2 w-full">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="w-1/2 justify-center inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-1/2 justify-center inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none disabled:bg-orange-400"
                >
                  {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : 'Guardar'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden flex-1">
        {loading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
          </div>
        ) : holidays.length === 0 ? (
          <div className="p-12 text-center">
            <CalendarOff className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay festivos</h3>
            <p className="mt-1 text-sm text-gray-500">No se encontraron festivos nacionales guardados para este año.</p>
          </div>
        ) : (
          <div className="overflow-x-auto h-full">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Día de la Semana</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Festividad</th>
                  <th scope="col" className="relative px-6 py-3"><span className="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {holidays.map((h: PlatformHoliday) => {
                  const dateObj = new Date(h.date);
                  return (
                    <tr key={h.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-l-4 border-l-orange-500">
                        {format(dateObj, "dd 'de' MMMM, yyyy", { locale: es })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                        {format(dateObj, 'EEEE', { locale: es })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {h.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleDelete(h.id, h.name)}
                          className="text-red-500 hover:text-red-700"
                          title="Eliminar festivo"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
