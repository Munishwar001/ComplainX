import { ImapFlow } from 'imapflow';
import { simpleParser, ParsedMail } from 'mailparser';
import { getSettings } from '../../models/AppSettings';
import { ProcessedEmail } from '../../models/ProcessedEmail';
import { createComplaint, analyzeAndRoute, sendComplaintEmail } from '../complaint/complaintService';

let pollerTimer: ReturnType<typeof setTimeout> | null = null;
let isPollerActive = false;

// ── Public API ────────────────────────────────────────────────────────────────

export function startImapPoller() {
  if (isPollerActive) return;
  isPollerActive = true;
  console.log('\n📬 IMAP poller started — reading config from DB');
  scheduleNextPoll(2000);
}

export function stopImapPoller() {
  isPollerActive = false;
  if (pollerTimer) { clearTimeout(pollerTimer); pollerTimer = null; }
  console.log('📭 IMAP poller stopped');
}

export function restartImapPoller() {
  stopImapPoller();
  startImapPoller();
}

// ── Scheduler ─────────────────────────────────────────────────────────────────

function scheduleNextPoll(delay: number) {
  pollerTimer = setTimeout(async () => {
    if (!isPollerActive) return;
    await runPoll();
    if (isPollerActive) {
      const settings = await getSettings().catch(() => null);
      const interval = settings?.gmailPollInterval ?? 30000;
      scheduleNextPoll(interval);
    }
  }, delay);
}

// ── Core poll ─────────────────────────────────────────────────────────────────

let isBusy = false;

async function runPoll() {
  if (isBusy) return;

  const settings = await getSettings().catch(() => null);
  if (!settings?.gmailEnabled) return;
  if (!settings.gmailUser || !settings.gmailAppPassword) {
    console.warn('[IMAP] gmailEnabled=true but credentials missing in DB Settings');
    return;
  }

  isBusy = true;
  const client = new ImapFlow({
    host:   settings.gmailHost || 'imap.gmail.com',
    port:   settings.gmailPort || 993,
    secure: true,
    auth:   { user: settings.gmailUser, pass: settings.gmailAppPassword },
    logger: false,
    socketOptions: { family: 4 }, // Force IPv4 — avoids IPv6 ETIMEDOUT
  });

  try {
    await client.connect();
    const lock = await client.getMailboxLock('INBOX');
    try {
      const uids: number[] = await client.search({ seen: false });

      if (!uids.length) {
        console.log(`[IMAP] ✉️  ${settings.gmailUser} — no new emails`);
      } else {
        console.log(`\n[IMAP] 📩 ${uids.length} new email(s) found in ${settings.gmailUser}`);
        for await (const msg of client.fetch(uids, { source: true, uid: true })) {
          await processMessage(client, msg, settings.aiConfidenceThreshold ?? 0.85, settings.autoSendEnabled ?? false).catch((err) =>
            console.error(`[IMAP] ❌ Error on UID ${msg.uid}:`, err.message)
          );
        }
      }
    } finally {
      lock.release();
    }
    await client.logout();
  } catch (err: any) {
    console.error('[IMAP] ❌ Connection error:', err.message);
    try { await client.logout(); } catch {}
  } finally {
    isBusy = false;
  }
}

// ── Message processor ─────────────────────────────────────────────────────────

async function processMessage(client: ImapFlow, msg: any, confidenceThreshold: number, autoSend: boolean) {
  const parsed: ParsedMail = await simpleParser(msg.source);

  const rawMsgId = parsed.messageId || `uid-${msg.uid}-${Date.now()}`;
  const messageId = rawMsgId.replace(/[<>]/g, '').trim();

  // Dedup
  if (await ProcessedEmail.findOne({ messageId })) {
    console.log(`[IMAP] ⏭  Already processed: ${messageId}`);
    return;
  }

  const senderEmail = extractSenderEmail(parsed.from?.text || '');
  const senderName  = parsed.from?.value?.[0]?.name?.trim() || undefined;
  const subject     = (parsed.subject || '(No subject)').trim();
  const body        = extractBody(parsed);

  if (!senderEmail) {
    console.warn(`[IMAP] ⚠️  Could not extract sender email — skipping`);
    return;
  }

  if (isSystemSender(senderEmail)) {
    console.log(`[IMAP] 🤖 Skipping system email from: ${senderEmail}`);
    await markSeen(client, msg.uid);
    return;
  }

  // ── Step 1: Show incoming email ─────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log('📧 NEW EMAIL RECEIVED');
  console.log('═'.repeat(60));
  console.log(`   From    : ${senderName ? `${senderName} <${senderEmail}>` : senderEmail}`);
  console.log(`   Subject : ${subject}`);
  console.log(`   Body    : ${body.slice(0, 150)}${body.length > 150 ? '...' : ''}`);
  console.log('─'.repeat(60));

  // ── Step 2: Create complaint ────────────────────────────────────────────────
  console.log('📝 STEP 1 — Creating complaint record...');
  const complaint = await createComplaint({ subject, body, senderEmail, senderName });
  console.log(`   ✅ Complaint created: ${complaint.reference}`);
  console.log(`   📌 Status: RECEIVED`);

  // ── Step 3: AI Analysis + Authority Routing (awaited so we can log results) ─
  console.log('🤖 STEP 2 — Running AI analysis...');
  try {
    const result = await analyzeAndRoute(complaint._id.toString());
    const analysis = result.analysis;
    const authority = result.authority;

    // Log AI analysis
    console.log('   ✅ AI Analysis complete:');
    console.log(`   📂 Category    : ${analysis.category.replace(/_/g, ' ').toUpperCase()}`);
    if (analysis.subcategory) {
      console.log(`   📂 Subcategory : ${analysis.subcategory.replace(/_/g, ' ')}`);
    }
    console.log(`   📍 Location    : ${[analysis.location.area, analysis.location.city, analysis.location.state].filter(Boolean).join(', ') || 'Not detected'}`);
    console.log(`   ⚡ Severity    : ${analysis.severity.toUpperCase()}`);
    console.log(`   🔥 Urgency     : ${analysis.urgency.toUpperCase()}`);
    console.log(`   📊 Confidence  : ${Math.round(analysis.confidence * 100)}%`);
    console.log(`   👁  Needs Review: ${analysis.needsHumanReview ? 'YES' : 'NO'}`);
    console.log('─'.repeat(60));

    // ── Step 4: Authority routing result ────────────────────────────────────
    console.log('🏢 STEP 3 — Authority routing...');
    if (authority) {
      console.log(`   ✅ Authority found!`);
      console.log(`   🏛  Name        : ${authority.name}`);
      console.log(`   📋 Department  : ${authority.department}`);
      console.log(`   📍 Location    : ${authority.city}, ${authority.state}`);
      console.log(`   📧 Email to    : ${authority.email}`);
      console.log('─'.repeat(60));

      // ── Step 5: Auto-send if enabled ──────────────────────────────────────
      if (autoSend) {
        console.log('🚀 STEP 4 — Auto-send ENABLED — forwarding to authority...');
        try {
          const sendResult = await sendComplaintEmail(complaint._id.toString());
          if (sendResult.result.success) {
            console.log(`   ✅ EMAIL SENT to ${authority.email}`);
            console.log(`   📌 Status: SENT`);
            console.log(`   🆔 Message ID: ${sendResult.result.messageId}`);
          } else {
            console.log(`   ❌ Email send failed`);
          }
        } catch (sendErr: any) {
          console.error(`   ❌ Auto-send failed: ${sendErr.message}`);
        }
      } else {
        console.log('   📌 Status : READY_TO_SEND');
        console.log('   ℹ️  Auto-send is OFF — manual approval needed');
        console.log(`   → Go to /complaints/${complaint._id} to review and send`);
      }
    } else {
      console.log(`   ⚠️  No matching authority found in DB`);
      console.log(`   📌 Status: NEEDS_REVIEW`);
      console.log(`   → Add authorities in /admin/authorities to fix this`);
    }

  } catch (aiErr: any) {
    console.error(`   ❌ AI analysis failed: ${aiErr.message}`);
    console.log(`   📌 Status: FAILED`);
  }

  // ── Step 5: Record dedup ────────────────────────────────────────────────────
  await ProcessedEmail.create({
    messageId,
    uid:         msg.uid,
    complaintId: complaint._id.toString(),
  });

  await markSeen(client, msg.uid);

  console.log('═'.repeat(60));
  console.log(`✅ DONE — Complaint ${complaint.reference} processed`);
  console.log('═'.repeat(60) + '\n');
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function markSeen(client: ImapFlow, uid: number) {
  try {
    await client.messageFlagsAdd(String(uid), ['\\Seen'], { uid: true });
  } catch (e: any) {
    console.warn('[IMAP] markSeen failed:', e.message);
  }
}

function extractSenderEmail(fromText: string): string {
  const bracket = fromText.match(/<([^>]+)>/);
  if (bracket) return bracket[1].toLowerCase().trim();
  const plain = fromText.match(/[\w.+\-]+@[\w.\-]+\.[a-z]{2,}/i);
  return plain ? plain[0].toLowerCase().trim() : '';
}

function extractBody(parsed: ParsedMail): string {
  if (parsed.text?.trim()) return parsed.text.trim();
  if (parsed.html)         return stripHtml(parsed.html).trim();
  return '(No message body)';
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function isSystemSender(email: string): boolean {
  return /^(mailer-daemon|postmaster|noreply|no-reply|bounce|notifications?|auto-?reply)@/i.test(email);
}
