import client from './client';
import { Authority } from '../types';

export const authoritiesApi = {
  list: () =>
    client.get<{ success: boolean; data: Authority[] }>('/authorities'),

  get: (id: string) =>
    client.get<{ success: boolean; data: Authority }>(`/authorities/${id}`),

  create: (data: Partial<Authority>) =>
    client.post<{ success: boolean; data: Authority }>('/authorities', data),

  update: (id: string, data: Partial<Authority>) =>
    client.patch<{ success: boolean; data: Authority }>(`/authorities/${id}`, data),

  delete: (id: string) =>
    client.delete<{ success: boolean; data: { deleted: boolean } }>(`/authorities/${id}`),
};
