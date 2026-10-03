import { Request, Response, NextFunction } from 'express';
import { successResponse } from '../utils/response';
import { simulateEmailSchema } from '../validators/complaint.validator';
import { createComplaint, analyzeAndRoute } from '../services/complaint/complaintService';

export async function simulateEmail(req: Request, res: Response, next: NextFunction) {
  try {
    const data = simulateEmailSchema.parse(req.body);
    const complaint = await createComplaint({
      subject: data.subject,
      body: data.body,
      senderEmail: data.senderEmail,
      senderName: data.senderName,
    });

    const result = await analyzeAndRoute(complaint._id.toString());

    return successResponse(res, {
      complaintId: complaint._id.toString(),
      reference:   complaint.reference,
      status:      result.complaint?.status,
      analysis:    result.analysis,
      authority:   result.authority,
    }, 201);
  } catch (err) { next(err); }
}
