import mongoose, { Schema, Document } from 'mongoose';

/**
 * Singleton settings document — there is only ever one record (key: 'global').
 * Stores Gmail IMAP credentials and other configurable settings.
 */
export interface IAppSettings extends Document {
  key: string;

  // Gmail IMAP
  gmailEnabled: boolean;
  gmailUser: string;
  gmailAppPassword: string;
  gmailHost: string;
  gmailPort: number;
  gmailPollInterval: number;

  // AI
  aiConfidenceThreshold: number;

  // Auto-send
  autoSendEnabled: boolean;  // auto-forward to authority without manual approval

  updatedAt: Date;
}

const AppSettingsSchema = new Schema<IAppSettings>(
  {
    key:              { type: String, default: 'global', unique: true },
    gmailEnabled:     { type: Boolean, default: false },
    gmailUser:        { type: String, default: '' },
    gmailAppPassword: { type: String, default: '' },
    gmailHost:        { type: String, default: 'imap.gmail.com' },
    gmailPort:        { type: Number, default: 993 },
    gmailPollInterval:{ type: Number, default: 30000 },
    aiConfidenceThreshold: { type: Number, default: 0.85 },
    autoSendEnabled:  { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const AppSettings = mongoose.model<IAppSettings>('AppSettings', AppSettingsSchema);

/** Always returns the single settings document, creating it if missing. */
export async function getSettings(): Promise<IAppSettings> {
  let settings = await AppSettings.findOne({ key: 'global' });
  if (!settings) {
    settings = await AppSettings.create({ key: 'global' });
  }
  return settings;
}
