import { Router } from 'express';
import {
  listComplaints, getComplaint, createNewComplaint,
  analyzeComplaintHandler, sendEmailHandler, getDashboardStats,
} from '../controllers/complaint.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/stats', getDashboardStats);
router.get('/',      listComplaints);
router.post('/',     createNewComplaint);
router.get('/:id',   getComplaint);
router.post('/:id/analyze', analyzeComplaintHandler);
router.post('/:id/send',    sendEmailHandler);

export default router;
