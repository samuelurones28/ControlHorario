import { useEffect, useState } from 'react';
import { useClockStatus } from '../hooks/useClockStatus';
import { Play, Square, Pause, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';

export const ClockIn = () => {
  const { status, loading, clockSubmit } = useClockStatus();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (loading) return <div className="flex h-full items-center justify-center text-neutral-400 font-medium">Cargando estado...</div>;

  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] px-4 animate-fade-in-up">
      <div className="text-center mb-10 bg-white rounded-3xl p-10 shadow-sm border border-neutral-100 w-full max-w-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-neutral-100"></div>
        <h2 className="text-5xl sm:text-6xl font-sans font-bold text-neutral-900 mb-2 tracking-tight">
          {format(time, 'HH:mm')}
          <span className="text-3xl text-neutral-400 ml-1 font-medium">:{format(time, 'ss')}</span>
        </h2>
        <p className="text-sm font-medium text-neutral-500 uppercase tracking-widest mt-4">
          {format(time, 'EEEE dd MMMM, yyyy').replace(/^\w/, (c) => c.toUpperCase())}
        </p>
      </div>

      <div className="flex flex-col items-center gap-4 w-full max-w-sm">
        {status === 'NO_FICHADO' && (
          <button 
            onClick={() => clockSubmit('CLOCK_IN')}
            className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl bg-success-500 hover:bg-success-600 text-white shadow-xl shadow-success-500/20 active:scale-[0.98] transition-all font-bold group"
          >
            <Play className="w-7 h-7 fill-current transition-transform group-hover:scale-110" />
            <span className="text-xl tracking-wide">Fichar Entrada</span>
          </button>
        )}

        {status === 'FICHADO' && (
          <>
            <button 
              onClick={() => clockSubmit('CLOCK_OUT')}
              className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl bg-danger-500 hover:bg-danger-600 text-white shadow-xl shadow-danger-500/20 active:scale-[0.98] transition-all font-bold group"
            >
              <Square className="w-6 h-6 fill-current transition-transform group-hover:scale-110" />
              <span className="text-xl tracking-wide">Fichar Salida</span>
            </button>

            <button 
              onClick={() => clockSubmit('PAUSE_START')}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-xl bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-200 active:scale-[0.98] transition-all font-semibold mt-2"
            >
              <Pause className="w-5 h-5 fill-current" />
              <span className="text-lg">Iniciar Pausa</span>
            </button>
          </>
        )}

        {status === 'EN_PAUSA' && (
          <button 
            onClick={() => clockSubmit('PAUSE_END')}
            className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl bg-primary-500 hover:bg-primary-600 text-white shadow-xl shadow-primary-500/20 active:scale-[0.98] transition-all font-bold group"
          >
            <RotateCcw className="w-6 h-6 transition-transform group-hover:-rotate-45" />
            <span className="text-xl tracking-wide">Reanudar Trabajo</span>
          </button>
        )}
      </div>
      
      <div className="mt-12 text-center text-xs font-medium text-neutral-400 uppercase tracking-widest px-6 py-2 rounded-full bg-neutral-100/50 border border-neutral-200/50">
        Estado: <strong className="text-neutral-700 ml-1">{status.replace('_', ' ')}</strong>
      </div>
    </div>
  );
};
