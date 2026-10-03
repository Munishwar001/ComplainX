import { Router } from 'express';
import { simulateEmail } from '../controllers/dev.controller';

const router = Router();

// Only available in development
router.post('/simulate-email', simulateEmail);

export default router;
