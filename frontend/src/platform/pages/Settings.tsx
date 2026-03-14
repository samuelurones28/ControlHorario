import { useEffect, useState } from 'react';
import { platformApi } from '../services/api';
import { Settings as SettingsIcon, Loader2, AlertCircle, Save, CheckCircle2 } from 'lucide-react';

const SETTING_DEFINITIONS: Record<string, { label: string, type: 'TEXT' | 'NUMBER' | 'BOOLEAN', description: string }> = {
  'privacy_policy_version': { 
    label: 'Versión de Política de Privacidad', 
    type: 'TEXT', 
    description: 'Versión actual de la política que los usuarios deben aceptar.' 
  },
  'maintenance_mode': { 
    label: 'Modo Mantenimiento', 
    type: 'BOOLEAN', 
    description: 'Activa o desactiva el acceso general a la plataforma.' 
  },
  'max_employees_per_company': { 
    label: 'Límite de Empleados', 
    type: 'NUMBER', 
    description: 'Número máximo de empleados por empresa por defecto.' 
  },
  'default_weekly_hours': { 
    label: 'Horas Semanales Base', 
    type: 'NUMBER', 
    description: 'Jornada laboral estándar en horas a la semana.' 
  }
};

type SettingValue = string | number | boolean;

export const Settings = () => {
  const [settings, setSettings] = useState<Record<string, SettingValue>>({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchSettings = async () => {
    try {
      const { data } = await platformApi.get('/platform/settings');
      setSettings(data);
    } catch {
      setError('No se pudieron cargar las configuraciones del sistema.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleUpdate = async (key: string, currentValue: SettingValue) => {
    setSavingKey(key);
    setError('');
    setSuccess('');
    
    try {
      // The backend expects PATCH /platform/settings/:key
      await platformApi.patch(`/platform/settings/${key}`, { value: currentValue });
      setSuccess('Configuración actualizada correctamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error || 'Error al actualizar configuración');
    } finally {
      setSavingKey(null);
    }
  };

  const handleValueChange = (key: string, newValue: SettingValue) => {
    setSettings(prev => ({
      ...prev,
      [key]: newValue
    }));
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    );
  }

  const settingKeys = Object.keys(settings);

  return (
    <div className="space-y-6 max-w-4xl mx-auto border-t-4 border-orange-600 bg-white p-8 rounded-lg shadow-sm">
      <div className="flex items-center gap-3 border-b border-gray-100 pb-5">
        <SettingsIcon className="h-8 w-8 text-gray-400" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Configuración Global</h1>
          <p className="mt-1 text-sm text-gray-500">
            Parámetros del sistema, retención de datos y reglas por defecto.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 p-4 rounded-md flex items-center text-red-800">
          <AlertCircle className="h-5 w-5 mr-3" />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 p-4 rounded-md flex items-center text-green-800">
          <CheckCircle2 className="h-5 w-5 mr-3" />
          {success}
        </div>
      )}

      <div className="space-y-8 mt-6">
        {settingKeys.length === 0 ? (
          <p className="text-gray-500 text-sm">No hay claves de configuración disponibles en la Base de Datos.</p>
        ) : (
          settingKeys.map((key) => {
            const def = SETTING_DEFINITIONS[key] || { label: key, type: 'TEXT', description: 'Configuración personalizada' };
            const currentValue = settings[key];

            return (
              <div key={key} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start border-b border-gray-50 pb-6 last:border-0 last:pb-0">
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-900">
                    {def.label}
                  </label>
                  <p className="text-xs text-gray-500 mt-1 pr-4">{def.description}</p>
                  <p className="text-xs text-gray-400 font-mono mt-1 pr-4 break-words">{key}</p>
                </div>
                
                <div className="col-span-2 flex items-center justify-between gap-3">
                  <div className="flex-1 max-w-sm">
                    {def.type === 'BOOLEAN' ? (
                      <label className="flex items-center cursor-pointer mt-2">
                        <div className="relative">
                          <input 
                            type="checkbox" 
                            className="sr-only" 
                            checked={Boolean(currentValue)}
                            onChange={(e) => handleValueChange(key, e.target.checked)}
                          />
                          <div className={`block w-14 h-8 rounded-full transition-colors ${currentValue ? 'bg-orange-600' : 'bg-gray-300'}`}></div>
                          <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${currentValue ? 'transform translate-x-6' : ''}`}></div>
                        </div>
                        <span className="ml-3 text-sm font-medium text-gray-900">
                          {currentValue ? 'Activado' : 'Desactivado'}
                        </span>
                      </label>
                    ) : (
                      <input
                        type={def.type === 'NUMBER' ? 'number' : 'text'}
                        value={currentValue ?? ''}
                        onChange={(e) => {
                          const val = def.type === 'NUMBER' ? Number(e.target.value) : e.target.value;
                          handleValueChange(key, val);
                        }}
                        className="shadow-sm focus:ring-orange-500 focus:border-orange-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 border px-3"
                      />
                    )}
                  </div>
                  
                  <button
                    onClick={() => handleUpdate(key, currentValue)}
                    disabled={savingKey === key}
                    className="inline-flex items-center p-2 border border-transparent rounded-md shadow-sm text-white bg-gray-900 hover:bg-gray-800 focus:outline-none disabled:bg-gray-300"
                    title="Guardar cambios"
                  >
                    {savingKey === key ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
