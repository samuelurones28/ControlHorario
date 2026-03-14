import { api } from './api';

export interface AbsenceRequestData {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  businessDays: number;
  status: string;
  notes?: string;
  reviewNote?: string;
  createdAt: string;
}

export const absencesApi = {
  getMyRequests: async () => {
    const { data } = await api.get<AbsenceRequestData[]>('/absences/my');
    return data;
  },
  createRequest: async (payload: { type: string; startDate: string; endDate: string; notes?: string }) => {
    const { data } = await api.post('/absences', payload);
    return data;
  },
  cancelRequest: async (id: string) => {
    const { data } = await api.patch(`/absences/${id}/cancel`);
    return data;
  },
  getCompanyRequests: async () => {
    const { data } = await api.get<AbsenceRequestData[]>('/absences/company');
    return data;
  },
  updateStatus: async (id: string, status: string, reviewNote?: string) => {
    const { data } = await api.patch(`/absences/${id}/status`, { status, reviewNote });
    return data;
  }
};
