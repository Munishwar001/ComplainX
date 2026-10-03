import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getSettingsHandler,
  updateSettingsHandler,
  testConnectionHandler,
  getImapStatsHandler,
} from '../controllers/settings.controller';

const router = Router();

router.use(authenticate);

router.get('/',              getSettingsHandler);
router.patch('/',            updateSettingsHandler);
router.post('/test-gmail',   testConnectionHandler);
router.get('/imap-stats',    getImapStatsHandler);

export default router;
