import client from './client';

export interface AppSettingsData {
  gmailEnabled: boolean;
  gmailUser: string;
  gmailAppPasswordSet: boolean;
  gmailHost: string;
  gmailPort: number;
  gmailPollInterval: number;
  aiConfidenceThreshold: number;
  autoSendEnabled: boolean;
}

export interface ImapStats {
  totalIngested: number;
  recentIngestions: {
    messageId: string;
    complaintId?: string;
    processedAt: string;
  }[];
}

export const settingsApi = {
  get: () =>
    client.get<{ success: boolean; data: AppSettingsData }>('/settings'),

  update: (data: Partial<AppSettingsData> & { gmailAppPassword?: string }) =>
    client.patch<{ success: boolean; data: { saved: boolean } }>('/settings', data),

  testGmail: (gmailUser: string, gmailAppPassword: string) =>
    client.post<{
      success: boolean;
      data: { connected: boolean; message: string; email?: string; inbox?: { total: number; unseen: number } };
    }>('/settings/test-gmail', { gmailUser, gmailAppPassword }),

  imapStats: () =>
    client.get<{ success: boolean; data: ImapStats }>('/settings/imap-stats'),
};
