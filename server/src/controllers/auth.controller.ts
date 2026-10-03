import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { env } from '../config/env';
import { successResponse, errorResponse } from '../utils/response';
import { registerSchema, loginSchema } from '../validators/auth.validator';
import { AuthRequest } from '../middleware/auth';

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const data = registerSchema.parse(req.body);
    const existing = await User.findOne({ email: data.email });
    if (existing) return errorResponse(res, 'Email already registered', 409);

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await User.create({ name: data.name, email: data.email, password: hashedPassword });

    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, env.JWT_SECRET, { expiresIn: '7d' });
    return successResponse(res, { token, user: { id: user._id, name: user.name, email: user.email, role: user.role } }, 201);
  } catch (err) { next(err); }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const data = loginSchema.parse(req.body);
    const user = await User.findOne({ email: data.email });
    if (!user) return errorResponse(res, 'Invalid email or password', 401);

    const valid = await bcrypt.compare(data.password, user.password);
    if (!valid) return errorResponse(res, 'Invalid email or password', 401);

    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, env.JWT_SECRET, { expiresIn: '7d' });
    return successResponse(res, { token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) { next(err); }
}

export async function getMe(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await User.findById(req.user!.id).select('-password');
    if (!user) return errorResponse(res, 'User not found', 404);
    return successResponse(res, { id: user._id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt });
  } catch (err) { next(err); }
}
