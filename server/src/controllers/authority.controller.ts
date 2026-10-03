import { Request, Response, NextFunction } from 'express';
import { Authority } from '../models/Authority';
import { successResponse, errorResponse } from '../utils/response';
import { z } from 'zod';

const authoritySchema = z.object({
  name:       z.string().min(2),
  department: z.string().min(2),
  city:       z.string().min(1),
  state:      z.string().min(1),
  country:    z.string().default('India'),
  email:      z.string().email(),
  phone:      z.string().optional(),
  website:    z.string().optional(),
  categories: z.array(z.string()).min(1),
  isActive:   z.boolean().default(true),
});

export async function listAuthorities(_req: Request, res: Response, next: NextFunction) {
  try {
    const list = await Authority.find().sort({ name: 1 }).lean();
    // normalize _id → id for frontend
    const normalized = list.map((a: any) => ({ ...a, id: a._id.toString() }));
    return successResponse(res, normalized);
  } catch (err) { next(err); }
}

export async function getAuthority(req: Request, res: Response, next: NextFunction) {
  try {
    const a = await Authority.findById(req.params.id).lean() as any;
    if (!a) return errorResponse(res, 'Authority not found', 404);
    return successResponse(res, { ...a, id: a._id.toString() });
  } catch (err) { next(err); }
}

export async function createAuthority(req: Request, res: Response, next: NextFunction) {
  try {
    const data = authoritySchema.parse(req.body);
    const a = await Authority.create(data);
    return successResponse(res, { ...a.toObject(), id: a._id.toString() }, 201);
  } catch (err) { next(err); }
}

export async function updateAuthority(req: Request, res: Response, next: NextFunction) {
  try {
    const data = authoritySchema.partial().parse(req.body);
    const a = await Authority.findByIdAndUpdate(
      req.params.id,
      data,
      { new: true, runValidators: true }
    ).lean() as any;
    if (!a) return errorResponse(res, 'Authority not found', 404);
    return successResponse(res, { ...a, id: a._id.toString() });
  } catch (err: any) {
    if (err.code === 11000) {
      return errorResponse(res, 'An authority with this email already exists', 409);
    }
    next(err);
  }
}

export async function deleteAuthority(req: Request, res: Response, next: NextFunction) {
  try {
    await Authority.findByIdAndDelete(req.params.id);
    return successResponse(res, { deleted: true });
  } catch (err) { next(err); }
}
