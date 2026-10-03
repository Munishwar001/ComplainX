import client from './client';
import { User } from '../types';

export interface AuthResponse {
  token: string;
  user: User;
}

export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    client.post<{ success: boolean; data: AuthResponse }>('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    client.post<{ success: boolean; data: AuthResponse }>('/auth/login', data),

  me: () => client.get<{ success: boolean; data: User }>('/auth/me'),
};
