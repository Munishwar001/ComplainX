import client from './client';
import { Complaint, DashboardStats } from '../types';

export const complaintsApi = {
  list: (params?: { page?: number; limit?: number; status?: string; category?: string }) =>
    client.get<{ success: boolean; data: { complaints: Complaint[]; total: number; pages: number } }>('/complaints', { params }),

  get: (id: string) =>
    client.get<{ success: boolean; data: Complaint }>(`/complaints/${id}`),

  create: (data: { subject: string; body: string; senderEmail: string; senderName?: string; location?: string; city?: string; state?: string }) =>
    client.post<{ success: boolean; data: Complaint }>('/complaints', data),

  analyze: (id: string) =>
    client.post<{ success: boolean; data: any }>(`/complaints/${id}/analyze`),

  send: (id: string, overrides?: { emailSubject?: string; emailBody?: string }) =>
    client.post<{ success: boolean; data: any }>(`/complaints/${id}/send`, overrides),

  stats: () =>
    client.get<{ success: boolean; data: DashboardStats }>('/complaints/stats'),
};

export const devApi = {
  simulateEmail: (data: { senderEmail: string; subject: string; body: string; senderName?: string }) =>
    client.post<{ success: boolean; data: { complaintId: string; reference: string; status: string; analysis: any; authority: any } }>('/dev/simulate-email', data),
};
