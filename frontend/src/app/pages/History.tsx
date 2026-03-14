import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { format } from 'date-fns';
import { AlertCircle, Clock } from 'lucide-react';

interface TimeEntry {
  id: string;
  timestamp: string;
  entryType: string;
  source: string;
}

export const History = () => {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/time-entries/me');
      setEntries(res.data);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchHistory();
  }, []);

  const reportIncident = async (originalEntryId: string, timestamp: string) => {
    const reason = prompt(`Describe el problema con el fichaje de las ${format(new Date(timestamp), 'HH:mm')} para solicitar revisión:`);
    if (!reason || reason.length < 5) return;

    try {
      await api.post('/incidents', {
        timeEntryId: originalEntryId,
        date: timestamp,
        description: reason
      });
      alert('Incidencia reportada correctamente. Un administrador la revisará.');
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e.response?.data?.message || 'Error reportando incidencia');
    }
  };

  if (loading) return <div className="p-8 text-center text-neutral-400 font-medium animate-pulse">Cargando historial...</div>;

  const grouped = entries.reduce((acc: Record<string, TimeEntry[]>, entry: TimeEntry) => {
    const dateStr = format(new Date(entry.timestamp), 'yyyy-MM-dd');
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(entry);
    return acc;
  }, {});

  return (
    <div className="max-w-3xl mx-auto pb-10 animate-fade-in-up">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-primary-50 p-3 rounded-2xl">
          <Clock className="w-7 h-7 text-primary-600" />
        </div>
        <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
          Historial de Registros
        </h1>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-neutral-100 shadow-sm">
          <div className="inline-flex bg-neutral-50 p-4 rounded-full mb-4">
             <Clock className="w-8 h-8 text-neutral-300" />
          </div>
          <p className="text-neutral-500 font-medium">No hay registros recientes en este periodo.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.keys(grouped).map(dateStr => (
            <div key={dateStr} className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
              <div className="bg-neutral-50/80 px-6 py-4 border-b border-neutral-200 flex justify-between items-center">
                <span className="font-semibold text-neutral-700 capitalize">
                  {format(new Date(dateStr), 'EEEE, dd MMMM yyyy').replace(/^\w/, c => c.toUpperCase())}
                </span>
              </div>
              <ul className="divide-y divide-neutral-100">
                {grouped[dateStr].reverse().map((entry) => (
                  <li key={entry.id} className="p-4 sm:px-6 sm:py-5 flex items-center justify-between group hover:bg-neutral-50/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="text-xl font-bold text-neutral-900 w-20">
                        {format(new Date(entry.timestamp), 'HH:mm')}
                      </div>
                      <div className="text-xs px-2.5 py-1 bg-neutral-100 text-neutral-600 font-medium rounded-md uppercase tracking-wide">
                        {entry.entryType.replace('_', ' ')}
                      </div>
                      {entry.source === 'OFFLINE_SYNCED' && (
                        <div className="ml-2 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-warning-50 text-xs text-warning-700 font-medium" title="Sincronizado offline">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Modo Offline</span>
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={() => reportIncident(entry.id, entry.timestamp)}
                      className="p-2 sm:px-3 sm:py-1.5 flex items-center gap-2 text-neutral-400 hover:text-warning-700 hover:bg-warning-50 rounded-lg transition-colors font-medium opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
                      title="Reportar incidencia"
                    >
                      <AlertCircle className="w-4 h-4" />
                      <span className="hidden sm:inline text-sm">Incidencia</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
