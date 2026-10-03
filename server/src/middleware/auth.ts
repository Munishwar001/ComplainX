import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { User } from '../models/User';
import { errorResponse } from '../utils/response';

export interface AuthRequest extends Request {
  user?: { id: string; email: string; role: string };
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return errorResponse(res, 'Unauthorized', 401);

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as { id: string; email: string; role: string };
    const user = await User.findById(payload.id).select('-password');
    if (!user) return errorResponse(res, 'Unauthorized', 401);
    req.user = { id: user._id.toString(), email: user.email, role: user.role };
    next();
  } catch {
    return errorResponse(res, 'Invalid token', 401);
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== 'ADMIN') return errorResponse(res, 'Forbidden', 403);
  next();
}
