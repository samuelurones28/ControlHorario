import { useState, useEffect } from 'react';
import { holidaysApi } from '../../services/holidays.api';
import type { HolidayData } from '../../services/holidays.api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Trash2, Plus, Calendar } from 'lucide-react';

export function AdminHolidays() {
  const [holidays, setHolidays] = useState<HolidayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDate, setNewDate] = useState('');
  const [newName, setNewName] = useState('');

  const fetchHolidays = async () => {
    try {
      const data = await holidaysApi.getHolidays();
      setHolidays(data);
    } catch {
      console.error('Error fetching holidays');
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
    try {
      await holidaysApi.setHolidays([{ date: new Date(newDate).toISOString(), name: newName }]);
      setNewDate('');
      setNewName('');
      fetchHolidays();
    } catch {
      alert('Error agregando festivo');
    }
  };

  const handleDelete = async (id: string) => {
    if(!window.confirm('¿Borrar festivo?')) return;
    try {
      await holidaysApi.deleteHoliday(id);
      fetchHolidays();
    } catch {
      alert('Error al borrar');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-regular tracking-tight text-gray-900">Festivos de Empresa</h1>
        <p className="text-sm font-medium text-gray-500 mt-1">Configura los días no laborables para no descontarlos de las ausencias</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
        <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="w-full sm:w-1/3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
            <input
              type="date"
              required
              value={newDate}
              onChange={e => setNewDate(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#E85D04] transition-all outline-none"
            />
          </div>
          <div className="w-full sm:flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Motivo / Festividad</label>
            <input
              type="text"
              required
              placeholder="Ej. Año Nuevo"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#E85D04] transition-all outline-none"
            />
          </div>
          <button type="submit" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#E85D04] text-white px-5 py-2.5 rounded-xl hover:bg-[#D05303] transition-colors font-medium">
            <Plus className="w-5 h-5" />
            <span>Añadir</span>
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
           <div className="p-8 text-center text-gray-500">Cargando...</div>
        ) : holidays.length === 0 ? (
           <div className="p-16 text-center">
             <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-4" />
             <p className="text-gray-500 text-sm">No se han configurado festivos.</p>
           </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Fecha</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Festividad</th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {holidays.map(h => (
                <tr key={h.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {format(new Date(h.date), 'dd MMMM yyyy', { locale: es })}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{h.name}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleDelete(h.id)} className="text-gray-400 hover:text-rose-600 transition-colors p-1.5" title="Eliminar">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
