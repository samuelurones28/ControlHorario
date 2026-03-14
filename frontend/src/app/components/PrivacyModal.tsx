import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ShieldAlert, Check } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const CURRENT_POLICY_VERSION = 'v1.0';

export const PrivacyModal = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    const checkConsent = async () => {
      if (!user) return;
      try {
        const res = await api.get('/privacy/me');
        if (!res.data.hasConsent || res.data.latestVersion !== CURRENT_POLICY_VERSION) {
          setIsOpen(true);
        }
      } catch (e) {
        console.error('Error checking privacy consent', e);
      } finally {
        setIsLoading(false);
      }
    };
    checkConsent();
  }, [user]);

  const handleAccept = async () => {
    if (!accepted) return;
    setIsSubmitting(true);
    try {
      await api.post('/privacy/accept', { version: CURRENT_POLICY_VERSION });
      setIsOpen(false);
    } catch (e) {
      console.error('Failed to accept privacy content', e);
      setIsSubmitting(false);
    }
  };

  if (isLoading || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-neutral-100 flex items-center gap-4 bg-primary-50">
          <div className="p-3 bg-primary-100 text-primary-600 rounded-full">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-neutral-900">Política de Privacidad y Geolocalización</h2>
            <p className="text-sm font-medium text-primary-700">Actualización legal {CURRENT_POLICY_VERSION}</p>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1 text-sm text-neutral-600 space-y-4">
          <p>
            Para dar cumplimiento a la normativa vigente sobre registro de jornada (RDL 8/2019) y la protección de datos personales (RGPD), es necesario que revise y acepte nuestra política de privacidad.
          </p>

          <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200">
            <h3 className="font-bold text-neutral-900 mb-2">📍 Tratamiento de Ubicación (Geolocalización)</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Qué se recoge:</strong> Exclusivamente las coordenadas exactas en el momento de hacer click en los botones de fichaje.</li>
              <li><strong>Qué NO se recoge:</strong> No realizamos seguimiento continuo (tracking) de su ubicación durante su jornada.</li>
              <li><strong>Finalidad:</strong> Verificar que el fichaje se realiza desde un lugar de trabajo coherente o autorizado, para demostrar la validez del registro ante posibles inspecciones laborales.</li>
              <li><strong>Base legal:</strong> Interés legítimo de la empresa para el control laboral, y su consentimiento explícito mediante esta acción.</li>
            </ul>
          </div>
          
          <p>Las coordenadas y los registros de IP asociados a sus fichajes serán conservados durante un periodo máximo de 4 años, tal como marca la legislación laboral vigente para el registro de jornada.</p>

          <label className="flex items-start gap-3 mt-6 p-4 border border-neutral-200 rounded-xl cursor-pointer hover:bg-neutral-50 transition-colors">
            <div className="flex items-center h-5">
              <input 
                type="checkbox" 
                checked={accepted} 
                onChange={(e) => setAccepted(e.target.checked)} 
                className="w-5 h-5 text-primary-600 rounded border-neutral-300 focus:ring-primary-500" 
              />
            </div>
            <div className="text-sm leading-5 font-medium text-neutral-900">
               He leído, entiendo y acepto la política de privacidad y el tratamiento de mi ubicación en el momento del fichaje.
            </div>
          </label>
        </div>

        <div className="p-6 bg-neutral-50 border-t border-neutral-100 flex justify-between items-center gap-4">
          <button 
            onClick={logout}
            className="px-4 py-2 text-sm font-semibold text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            Cerrar sesión
          </button>
          
          <button 
            onClick={handleAccept}
            disabled={!accepted || isSubmitting}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-700 transition-colors"
          >
            {isSubmitting ? 'Procesando...' : (
              <>
                <Check className="w-4 h-4" />
                <span>Aceptar y Continuar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
