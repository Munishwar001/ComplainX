import mongoose from 'mongoose';
import { Complaint, IComplaint, ComplaintStatus } from '../../models/Complaint';
import { generateReference } from '../../utils/response';
import { analyzeComplaint, mockAnalyzeComplaint } from '../ai/complaintAnalyzer';
import { findAuthority } from '../authority/authorityRouter';
import { generateComplaintEmail } from '../email/emailGenerator';
import { getEmailProvider } from '../email/emailProviderFactory';
import { env } from '../../config/env';
import { AppError } from '../../middleware/errorHandler';
import { CreateComplaintInput } from '../../validators/complaint.validator';

export async function createComplaint(input: CreateComplaintInput, userId?: string) {
  const reference = generateReference();
  const complaint = await Complaint.create({
    reference,
    subject: input.subject,
    body: input.body,
    senderEmail: input.senderEmail,
    senderName: input.senderName,
    location: input.location,
    city: input.city,
    state: input.state,
    status: 'RECEIVED' as ComplaintStatus,
    userId: userId ? new mongoose.Types.ObjectId(userId) : undefined,
    statusHistory: [{ status: 'RECEIVED', note: 'Complaint received' }],
  });
  return complaint;
}

export async function analyzeAndRoute(complaintId: string) {
  const complaint = await Complaint.findById(complaintId);
  if (!complaint) throw new AppError('Complaint not found', 404);

  await updateStatus(complaint, 'ANALYZING', 'AI analysis started');

  try {
    // Run AI (real or mock)
    const analysis = env.OPENAI_API_KEY
      ? await analyzeComplaint(complaint.subject, complaint.body, complaint.location ?? undefined, complaint.city ?? undefined, complaint.state ?? undefined)
      : mockAnalyzeComplaint(complaint.subject, complaint.body, complaint.location ?? undefined, complaint.city ?? undefined, complaint.state ?? undefined);

    // Save analysis into complaint document
    complaint.aiAnalysis = {
      category: analysis.category,
      subcategory: analysis.subcategory,
      summary: analysis.summary,
      locationArea: analysis.location.area,
      locationCity: analysis.location.city,
      locationState: analysis.location.state,
      locationCountry: analysis.location.country,
      severity: analysis.severity.toUpperCase() as any,
      urgency: analysis.urgency.toUpperCase() as any,
      confidence: analysis.confidence,
      needsHumanReview: analysis.needsHumanReview,
      recommendedDept: analysis.recommendedDepartment,
      authorityType: analysis.authorityType,
      createdAt: new Date(),
    };

    // Confidence threshold check
    if (analysis.confidence < 0.85 || analysis.needsHumanReview) {
      await updateStatus(complaint, 'NEEDS_REVIEW', 'Low confidence, needs human review');
      await complaint.save();
      return { complaint: await getComplaintWithDetails(complaintId), analysis, authority: null };
    }

    // Authority routing
    const authorityMatch = await findAuthority(analysis);
    if (!authorityMatch) {
      await updateStatus(complaint, 'NEEDS_REVIEW', 'No matching authority found');
      await complaint.save();
      return { complaint: await getComplaintWithDetails(complaintId), analysis, authority: null };
    }

    complaint.authorityId = new mongoose.Types.ObjectId(authorityMatch.authorityId);

    // Generate and store email
    const emailContent = generateComplaintEmail({
      reference: complaint.reference,
      senderEmail: complaint.senderEmail,
      senderName: complaint.senderName ?? undefined,
      subject: complaint.subject,
      body: complaint.body,
      analysis,
      authorityName: authorityMatch.name,
      authorityDepartment: authorityMatch.department,
    });

    complaint.emailMessages = [{
      _id: new mongoose.Types.ObjectId(),
      toEmail: authorityMatch.email,
      toName: `${authorityMatch.name} — ${authorityMatch.department}`,
      subject: emailContent.subject,
      body: emailContent.body,
      status: 'PENDING',
      provider: env.EMAIL_PROVIDER,
      createdAt: new Date(),
      updatedAt: new Date(),
    }];

    await updateStatus(complaint, 'READY_TO_SEND', 'Email generated, awaiting approval');
    await complaint.save();

    return { complaint: await getComplaintWithDetails(complaintId), analysis, authority: authorityMatch };
  } catch (err: any) {
    await updateStatus(complaint, 'FAILED', `Analysis failed: ${err.message}`);
    await complaint.save();
    throw err;
  }
}

export async function sendComplaintEmail(complaintId: string, userId?: string) {
  const complaint = await getComplaintWithDetails(complaintId);
  if (!complaint) throw new AppError('Complaint not found', 404);

  const emailMessage = complaint.emailMessages[0];
  if (!emailMessage) throw new AppError('No email to send', 400);

  if (!['READY_TO_SEND', 'NEEDS_REVIEW'].includes(complaint.status)) {
    throw new AppError('Complaint is not ready to send', 400);
  }

  const provider = getEmailProvider();
  const result = await provider.sendEmail({
    to: emailMessage.toEmail,
    toName: emailMessage.toName,
    subject: emailMessage.subject,
    body: emailMessage.body,
    complaintId,
    reference: complaint.reference,
  });

  if (result.success) {
    const doc = await Complaint.findById(complaintId);
    if (doc) {
      await updateStatus(doc, 'SENT', `Email sent via ${result.provider}`);
      await doc.save();
    }
  } else {
    const doc = await Complaint.findById(complaintId);
    if (doc) {
      await updateStatus(doc, 'FAILED', `Email failed`);
      await doc.save();
    }
  }

  return { result, complaint: await getComplaintWithDetails(complaintId) };
}

export async function getComplaintWithDetails(complaintId: string) {
  const doc = await Complaint.findById(complaintId)
    .populate('userId', 'name email')
    .populate('authorityId')
    .lean();
  if (!doc) return null;
  return normalizeId(doc);
}

function normalizeId(doc: any): any {
  if (!doc) return doc;
  doc.id = doc._id?.toString();
  if (doc.emailMessages) doc.emailMessages = doc.emailMessages.map((e: any) => ({ ...e, id: e._id?.toString() }));
  if (doc.statusHistory) doc.statusHistory = doc.statusHistory.map((s: any) => ({ ...s, id: s._id?.toString() }));
  if (doc.authorityId && typeof doc.authorityId === 'object') {
    doc.authority = { ...doc.authorityId, id: doc.authorityId._id?.toString() };
  }
  if (doc.userId && typeof doc.userId === 'object') {
    doc.user = { ...doc.userId, id: doc.userId._id?.toString() };
  }
  return doc;
}

async function updateStatus(complaint: IComplaint, status: ComplaintStatus, note?: string) {
  complaint.status = status;
  complaint.statusHistory.push({ _id: new mongoose.Types.ObjectId(), status, note, createdAt: new Date() });
}
