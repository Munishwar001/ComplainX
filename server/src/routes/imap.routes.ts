import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { successResponse } from '../utils/response';
import { ProcessedEmail } from '../models/ProcessedEmail';
import { env } from '../config/env';
import { startImapPoller, stopImapPoller } from '../services/email/imapPoller';

const router = Router();

router.use(authenticate);

// GET /api/imap/status — current config + recent ingestions
router.get('/status', async (_req: AuthRequest, res: Response, next) => {
  try {
    const recentIngestions = await ProcessedEmail.find()
      .sort({ processedAt: -1 })
      .limit(20)
      .lean();

    return successResponse(res, {
      enabled: env.IMAP_ENABLED,
      host: env.IMAP_HOST,
      user: env.IMAP_USER || null,
      pollInterval: env.IMAP_POLL_INTERVAL,
      totalIngested: await ProcessedEmail.countDocuments(),
      recentIngestions,
    });
  } catch (err) { next(err); }
});

// POST /api/imap/start — enable poller at runtime
router.post('/start', (req: AuthRequest, res: Response) => {
  startImapPoller();
  return successResponse(res, { started: true });
});

// POST /api/imap/stop — disable poller at runtime
router.post('/stop', (req: AuthRequest, res: Response) => {
  stopImapPoller();
  return successResponse(res, { stopped: true });
});

export default router;
