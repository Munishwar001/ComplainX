/**
 * Run once to set Gmail credentials directly in MongoDB.
 * Usage: npx tsx src/scripts/setGmailCredentials.ts
 * 
 * Edit GMAIL_USER and GMAIL_APP_PASSWORD below before running.
 */
import mongoose from 'mongoose';
import { env } from '../config/env';
import { AppSettings } from '../models/AppSettings';

const GMAIL_USER         = 'munishwar0320@gmail.com';
const GMAIL_APP_PASSWORD = 'wyrxikwhwdkadvzl'; // generated App Password

async function main() {
  await mongoose.connect(env.MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  const updated = await AppSettings.findOneAndUpdate(
    { key: 'global' },
    {
      $set: {
        gmailUser:        GMAIL_USER,
        gmailAppPassword: GMAIL_APP_PASSWORD.replace(/\s/g, ''), // remove spaces
        gmailEnabled:     true,
        gmailPollInterval: 30000,
      },
    },
    { upsert: true, new: true }
  );

  console.log('✅ Gmail credentials saved:');
  console.log('   User:', updated.gmailUser);
  console.log('   Password set:', !!updated.gmailAppPassword);
  console.log('   Enabled:', updated.gmailEnabled);

  await mongoose.disconnect();
  console.log('\n🎉 Done. Restart the server to start polling.');
}

main().catch((e) => { console.error(e); process.exit(1); });
