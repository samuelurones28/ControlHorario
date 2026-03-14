import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { format } from 'date-fns';
import { FileSignature, CheckCircle, AlertOctagon } from 'lucide-react';

interface WeeklyReport {
  id: string;
  weekStart: string;
  weekEnd: string;
  totalWorked: number;
  totalPaused: number;
  overtime: number;
}

export const Signatures = () => {
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      const res = await api.get('/weekly-reports/me/pending');
      setReports(res.data);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchReports();
  }, []);

  const acceptReport = async (id: string) => {
    if (!window.confirm('Al firmar este reporte, confirmas que los horarios y pausas de esta semana son correctos conforme al RDL 8/2019.')) return;
    try {
      await api.post(`/weekly-reports/${id}/accept`);
      alert('Reporte firmado exitosamente. Una copia encriptada se ha guardado en la base de datos.');
      fetchReports();
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e.response?.data?.message || 'Error al firmar reporte');
    }
  };

  const disputeReport = async (id: string) => {
    const reason = prompt('Indica el motivo de la discrepancia detallando las fechas u horas incorrectas:');
    if (!reason || reason.length < 5) return;
    try {
      await api.post(`/weekly-reports/${id}/dispute`, { disputeReason: reason });
      alert('Discrepancia reportada al equipo de administración.');
      fetchReports();
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e.response?.data?.message || 'Error al reportar discrepancia');
    }
  };

  if (loading) return <div className="p-8 text-center text-neutral-400 font-medium">Cargando reportes pendientes...</div>;

  return (
    <div className="max-w-4xl mx-auto pb-10 animate-fade-in-up">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-primary-50 p-3 rounded-2xl">
          <FileSignature className="w-7 h-7 text-primary-600" />
        </div>
        <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
          Firmas Pendientes
        </h1>
      </div>

      {reports.length === 0 ? (
        <div className="text-center py-16 bg-white border border-neutral-100 rounded-3xl shadow-sm flex flex-col items-center">
          <CheckCircle className="w-14 h-14 text-success-400 mb-4" />
          <p className="text-neutral-900 font-bold text-lg mb-1">¡Estás al día!</p>
          <p className="text-neutral-500 font-medium">No tienes reportes semanales pendientes por firmar.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-warning-50 border border-warning-200 rounded-2xl p-5 text-warning-900 flex gap-4 items-start shadow-sm">
            <AlertOctagon className="w-6 h-6 text-warning-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-1 text-warning-800">Obligación Legal (RDL 8/2019)</p>
              <p className="font-medium text-sm text-warning-700">Revisa la veracidad del cuadrante y confírmalo a continuación para garantizar la exactitud de tu jornada y descansos obligatorios.</p>
            </div>
          </div>
          
          {reports.map(report => (
            <div key={report.id} className="bg-white rounded-3xl border border-neutral-200 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-neutral-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-neutral-50/50">
                <div>
                  <h2 className="font-bold text-neutral-800 text-lg">
                    Semana del {format(new Date(report.weekStart), 'dd/MM/yyyy')} al {format(new Date(report.weekEnd), 'dd/MM/yyyy')}
                  </h2>
                </div>
                <div className="text-xs px-3 py-1 bg-warning-100 text-warning-800 font-bold uppercase tracking-widest rounded-full border border-warning-200">
                  Pendiente de firma
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 mb-8">
                  <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-5 text-center">
                    <p className="text-sm text-neutral-500 font-semibold mb-2">Horas Trabajadas</p>
                    <p className="text-3xl font-bold text-neutral-900">{(report.totalWorked / 3600000).toFixed(2)}h</p>
                  </div>
                  <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-5 text-center">
                    <p className="text-sm text-neutral-500 font-semibold mb-2">Horas de Pausa</p>
                    <p className="text-3xl font-bold text-neutral-900">{(report.totalPaused / 3600000).toFixed(2)}h</p>
                  </div>
                  <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-5 text-center">
                    <p className="text-sm text-neutral-500 font-semibold mb-2">Horas Extra</p>
                    <p className="text-3xl font-bold text-neutral-900">{(report.overtime / 3600000).toFixed(2)}h</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-end">
                  <button 
                    onClick={() => disputeReport(report.id)}
                    className="px-6 py-3 rounded-xl bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50 font-semibold transition-all flex items-center justify-center gap-2"
                  >
                    <AlertOctagon className="w-5 h-5 text-neutral-400" />
                    No conforme
                  </button>
                  <button 
                    onClick={() => acceptReport(report.id)}
                    className="px-6 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold transition-all shadow-sm shadow-primary-500/20 active:scale-95 flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Firmar Reporte
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
