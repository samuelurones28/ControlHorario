import { useState, useEffect } from 'react';
import { api } from '../services/api';

export type ClockStatus = 'NO_FICHADO' | 'FICHADO' | 'EN_PAUSA';

export const useClockStatus = () => {
  const [status, setStatus] = useState<ClockStatus>('NO_FICHADO');
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const today = new Date();
      today.setHours(0,0,0,0);
      const res = await api.get(`/time-entries/me?from=${today.toISOString()}`);
      const entries = res.data;
      
      if (entries.length === 0) {
        setStatus('NO_FICHADO');
      } else {
        const lastEntry = entries[0];
        if (lastEntry.entryType === 'CLOCK_IN' || lastEntry.entryType === 'PAUSE_END') {
          setStatus('FICHADO');
        } else if (lastEntry.entryType === 'PAUSE_START') {
          setStatus('EN_PAUSA');
        } else if (lastEntry.entryType === 'CLOCK_OUT') {
          setStatus('NO_FICHADO');
        }
      }
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchStatus();
  }, []);

  const clockSubmit = async (type: string) => {
    let lat, lng;
    try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
    } catch {
        // Fallback if location fails or is denied
    }

    await api.post('/time-entries/clock', { entryType: type, latitude: lat, longitude: lng });
    await fetchStatus();
  };

  return { status, loading, clockSubmit, refresh: fetchStatus };
};
