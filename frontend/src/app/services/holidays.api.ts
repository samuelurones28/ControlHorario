import { api } from './api';

export interface HolidayData {
  id: string;
  date: string;
  name: string;
}

export const holidaysApi = {
  getHolidays: async () => {
    const { data } = await api.get<HolidayData[]>('/holidays');
    return data;
  },
  setHolidays: async (holidays: { date: string, name: string }[]) => {
    const { data } = await api.post('/holidays', holidays);
    return data;
  },
  deleteHoliday: async (id: string) => {
    const { data } = await api.delete(`/holidays/${id}`);
    return data;
  }
}
