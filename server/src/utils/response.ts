import { Response } from 'express';

export function successResponse<T>(res: Response, data: T, statusCode = 200) {
  return res.status(statusCode).json({ success: true, data });
}

export function errorResponse(res: Response, message: string, statusCode = 400) {
  return res.status(statusCode).json({ success: false, message });
}

export function generateReference(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 999999);
  return `CMP-${year}-${String(random).padStart(6, '0')}`;
}
