import { Response, NextFunction } from 'express';
import { Complaint } from '../models/Complaint';
import { successResponse, errorResponse } from '../utils/response';
import { createComplaintSchema } from '../validators/complaint.validator';
import {
  createComplaint, analyzeAndRoute, sendComplaintEmail, getComplaintWithDetails,
} from '../services/complaint/complaintService';
import { AuthRequest } from '../middleware/auth';

export async function listComplaints(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page  = parseInt(req.query.page as string)  || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status   = req.query.status as string;
    const category = req.query.category as string;

    const filter: any = {};
    if (req.user?.role !== 'ADMIN') filter.userId = req.user?.id;
    if (status)   filter.status = status;
    if (category) filter['aiAnalysis.category'] = category;

    const [rawComplaints, total] = await Promise.all([
      Complaint.find(filter)
        .populate('authorityId')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Complaint.countDocuments(filter),
    ]);

    // normalize _id → id for frontend
    const complaints = rawComplaints.map((c: any) => ({
      ...c,
      id: c._id?.toString(),
      authority: c.authorityId && typeof c.authorityId === 'object'
        ? { ...c.authorityId, id: c.authorityId._id?.toString() }
        : undefined,
    }));

    return successResponse(res, { complaints, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
}

export async function getComplaint(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const complaint = await getComplaintWithDetails(req.params.id);
    if (!complaint) return errorResponse(res, 'Complaint not found', 404);
    const uid = (complaint.userId as any)?._id?.toString() || (complaint.userId as any)?.toString();
    if (req.user?.role !== 'ADMIN' && uid !== req.user?.id) return errorResponse(res, 'Forbidden', 403);
    return successResponse(res, complaint);
  } catch (err) { next(err); }
}

export async function createNewComplaint(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = createComplaintSchema.parse(req.body);
    const complaint = await createComplaint(data, req.user?.id);
    return successResponse(res, complaint, 201);
  } catch (err) { next(err); }
}

export async function analyzeComplaintHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await analyzeAndRoute(req.params.id);
    return successResponse(res, result);
  } catch (err) { next(err); }
}

export async function sendEmailHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { emailSubject, emailBody } = req.body;
    if (emailSubject || emailBody) {
      await Complaint.updateOne(
        { _id: req.params.id },
        {
          $set: {
            ...(emailSubject && { 'emailMessages.$[].subject': emailSubject }),
            ...(emailBody   && { 'emailMessages.$[].body': emailBody }),
          },
        }
      );
    }
    const result = await sendComplaintEmail(req.params.id, req.user?.id);
    return successResponse(res, result);
  } catch (err) { next(err); }
}

export async function getDashboardStats(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const matchFilter: any = {};
    if (req.user?.role !== 'ADMIN') matchFilter.userId = req.user?.id;

    const [total, pending, needsReview, sent, inProgress, resolved] = await Promise.all([
      Complaint.countDocuments(matchFilter),
      Complaint.countDocuments({ ...matchFilter, status: 'READY_TO_SEND' }),
      Complaint.countDocuments({ ...matchFilter, status: 'NEEDS_REVIEW' }),
      Complaint.countDocuments({ ...matchFilter, status: 'SENT' }),
      Complaint.countDocuments({ ...matchFilter, status: 'IN_PROGRESS' }),
      Complaint.countDocuments({ ...matchFilter, status: 'RESOLVED' }),
    ]);

    const byCategory = await Complaint.aggregate([
      { $match: { ...matchFilter, aiAnalysis: { $exists: true } } },
      { $group: { _id: '$aiAnalysis.category', _count: { $sum: 1 } } },
      { $project: { category: '$_id', _count: 1, _id: 0 } },
    ]);

    const byStatus = await Complaint.aggregate([
      { $match: matchFilter },
      { $group: { _id: '$status', _count: { $sum: 1 } } },
      { $project: { status: '$_id', _count: 1, _id: 0 } },
    ]);

    return successResponse(res, { total, pending, needsReview, sent, inProgress, resolved, byCategory, byStatus });
  } catch (err) { next(err); }
}
