/**
 * This script:
 * 1. Connects to Gmail via IMAP and marks ALL inbox emails as SEEN
 * 2. Clears the ProcessedEmail dedup collection
 * 
 * After running this, the poller will ONLY pick up NEW emails
 * that arrive after this point.
 * 
 * Run: npx tsx src/scripts/markAllSeenAndReset.ts
 */
import mongoose from 'mongoose';
import { ImapFlow } from 'imapflow';
import { env } from '../config/env';
import { ProcessedEmail } from '../models/ProcessedEmail';
import { getSettings } from '../models/AppSettings';

async function main() {
  await mongoose.connect(env.MONGODB_URI);
  console.log('✅ MongoDB connected');

  const settings = await getSettings();
  if (!settings.gmailUser || !settings.gmailAppPassword) {
    console.error('❌ Gmail credentials not set in DB. Run setGmailCredentials.ts first.');
    process.exit(1);
  }

  console.log(`📬 Connecting to Gmail: ${settings.gmailUser}...`);

  const client = new ImapFlow({
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
    auth: { user: settings.gmailUser, pass: settings.gmailAppPassword },
    logger: false,
    socketOptions: { family: 4 }, // Force IPv4
  });

  await client.connect();
  const lock = await client.getMailboxLock('INBOX');

  try {
    // Find all unseen emails
    const uids: number[] = await client.search({ seen: false });
    console.log(`📩 Found ${uids.length} unread emails`);

    if (uids.length > 0) {
      // Mark all as seen in one batch
      await client.messageFlagsAdd(uids.join(','), ['\\Seen']);
      console.log(`✅ Marked all ${uids.length} emails as read`);
    }
  } finally {
    lock.release();
  }

  await client.logout();
  console.log('✅ Gmail disconnected');

  // Clear dedup collection so poller starts fresh
  const deleted = await ProcessedEmail.deleteMany({});
  console.log(`🗑️  Cleared ${deleted.deletedCount} processed email records`);

  console.log('\n🎉 Done! Now send a NEW test email to ' + settings.gmailUser);
  console.log('   The poller will pick it up within 30 seconds.\n');

  await mongoose.disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
