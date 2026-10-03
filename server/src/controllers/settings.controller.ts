import { Response, NextFunction } from 'express';
import { ImapFlow } from 'imapflow';
import { AuthRequest } from '../middleware/auth';
import { AppSettings, getSettings } from '../models/AppSettings';
import { successResponse, errorResponse } from '../utils/response';
import { restartImapPoller, stopImapPoller } from '../services/email/imapPoller';
import { ProcessedEmail } from '../models/ProcessedEmail';
import { z } from 'zod';

const updateSettingsSchema = z.object({
  gmailEnabled:          z.boolean().optional(),
  gmailUser:             z.string().optional(),
  gmailAppPassword:      z.string().optional(),
  gmailPollInterval:     z.number().min(10000).max(300000).optional(),
  aiConfidenceThreshold: z.number().min(0.5).max(1).optional(),
  autoSendEnabled:       z.boolean().optional(),
});

export async function getSettingsHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const settings = await getSettings();
    return successResponse(res, {
      gmailEnabled:          settings.gmailEnabled,
      gmailUser:             settings.gmailUser,
      gmailAppPasswordSet:   !!settings.gmailAppPassword,
      gmailHost:             settings.gmailHost,
      gmailPort:             settings.gmailPort,
      gmailPollInterval:     settings.gmailPollInterval,
      aiConfidenceThreshold: settings.aiConfidenceThreshold,
      autoSendEnabled:       settings.autoSendEnabled,
    });
  } catch (err) { next(err); }
}

export async function updateSettingsHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = updateSettingsSchema.parse(req.body);

    // Build $set payload — only include fields that were actually sent
    const $set: Record<string, any> = {};
    if (data.gmailEnabled          !== undefined) $set.gmailEnabled          = data.gmailEnabled;
    if (data.gmailUser             !== undefined) $set.gmailUser             = data.gmailUser;
    if (data.gmailPollInterval     !== undefined) $set.gmailPollInterval     = data.gmailPollInterval;
    if (data.aiConfidenceThreshold !== undefined) $set.aiConfidenceThreshold = data.aiConfidenceThreshold;
    if (data.autoSendEnabled       !== undefined) $set.autoSendEnabled       = data.autoSendEnabled;

    // Only update password when a non-empty value is explicitly provided
    if (data.gmailAppPassword && data.gmailAppPassword.trim() !== '') {
      $set.gmailAppPassword = data.gmailAppPassword.trim();
    }

    // Use findOneAndUpdate with $set — reliable, no Mongoose dirty-tracking issues
    const updated = await AppSettings.findOneAndUpdate(
      { key: 'global' },
      { $set },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    if (!updated) {
      return errorResponse(res, 'Failed to save settings', 500);
    }

    console.log('[Settings] Saved:', {
      gmailEnabled: updated.gmailEnabled,
      gmailUser: updated.gmailUser,
      gmailAppPasswordSet: !!updated.gmailAppPassword,
      gmailPollInterval: updated.gmailPollInterval,
    });

    // Restart or stop poller based on new state
    if (updated.gmailEnabled && updated.gmailUser && updated.gmailAppPassword) {
      restartImapPoller();
    } else if (!updated.gmailEnabled) {
      stopImapPoller();
    }

    return successResponse(res, {
      saved: true,
      gmailAppPasswordSet: !!updated.gmailAppPassword,
    });
  } catch (err) { next(err); }
}

export async function testConnectionHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    let { gmailUser, gmailAppPassword } = req.body;
    if (!gmailUser) {
      return errorResponse(res, 'gmailUser is required', 400);
    }

    // If frontend sends '__use_saved__', use the password stored in DB
    if (!gmailAppPassword || gmailAppPassword === '__use_saved__') {
      const settings = await getSettings();
      if (!settings.gmailAppPassword) {
        return successResponse(res, { connected: false, message: 'No password saved yet. Enter an App Password first.' });
      }
      gmailAppPassword = settings.gmailAppPassword;
    }

    const client = new ImapFlow({
      host: 'imap.gmail.com',
      port: 993,
      secure: true,
      auth: { user: gmailUser, pass: gmailAppPassword },
      logger: false,
      socketOptions: { family: 4 },
    });

    try {
      await client.connect();
      const lock = await client.getMailboxLock('INBOX');
      let messageCount = 0;
      let unseenCount  = 0;
      try {
        const status = await client.status('INBOX', { messages: true, unseen: true });
        messageCount = status.messages ?? 0;
        unseenCount  = status.unseen  ?? 0;
      } finally {
        lock.release();
      }
      await client.logout();

      return successResponse(res, {
        connected: true,
        email: gmailUser,
        inbox: { total: messageCount, unseen: unseenCount },
        message: `Connected! ${unseenCount} unread message(s) in inbox.`,
      });
    } catch (err: any) {
      return successResponse(res, {
        connected: false,
        message: `Connection failed: ${err.message}`,
      });
    }
  } catch (err) { next(err); }
}

export async function getImapStatsHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const [total, recent] = await Promise.all([
      ProcessedEmail.countDocuments(),
      ProcessedEmail.find().sort({ processedAt: -1 }).limit(20).lean(),
    ]);
    return successResponse(res, { totalIngested: total, recentIngestions: recent });
  } catch (err) { next(err); }
}
