import { Router } from 'express';
import {
  listAuthorities,
  getAuthority,
  createAuthority,
  updateAuthority,
  deleteAuthority,
} from '../controllers/authority.controller';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, listAuthorities);
router.get('/:id', authenticate, getAuthority);
router.post('/', authenticate, requireAdmin, createAuthority);
router.patch('/:id', authenticate, requireAdmin, updateAuthority);
router.delete('/:id', authenticate, requireAdmin, deleteAuthority);

export default router;
