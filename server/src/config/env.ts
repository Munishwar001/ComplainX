import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

export const env = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/complanx',
  JWT_SECRET: process.env.JWT_SECRET || 'change-this-secret',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  EMAIL_PROVIDER: process.env.EMAIL_PROVIDER || 'mock',
  NODE_ENV: process.env.NODE_ENV || 'development',
  isDev: process.env.NODE_ENV !== 'production',

  // IMAP
  IMAP_ENABLED: process.env.IMAP_ENABLED === 'true',
  IMAP_HOST: process.env.IMAP_HOST || 'imap.gmail.com',
  IMAP_PORT: parseInt(process.env.IMAP_PORT || '993', 10),
  IMAP_SECURE: process.env.IMAP_SECURE !== 'false',
  IMAP_USER: process.env.IMAP_USER || '',
  IMAP_PASS: process.env.IMAP_PASS || '',
  IMAP_POLL_INTERVAL: parseInt(process.env.IMAP_POLL_INTERVAL || '30000', 10),
};
