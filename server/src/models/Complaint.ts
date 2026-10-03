import mongoose, { Document, Schema } from 'mongoose';

export type ComplaintStatus =
  | 'RECEIVED' | 'ANALYZING' | 'NEEDS_REVIEW' | 'READY_TO_SEND'
  | 'SENT' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'RESOLVED' | 'FAILED';

export interface IAIAnalysis {
  category: string;
  subcategory?: string;
  summary: string;
  locationArea?: string;
  locationCity?: string;
  locationState?: string;
  locationCountry?: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  urgency: 'LOW' | 'NORMAL' | 'HIGH' | 'EMERGENCY';
  confidence: number;
  needsHumanReview: boolean;
  recommendedDept?: string;
  authorityType?: string;
  createdAt: Date;
}

export interface IEmailMessage {
  _id: mongoose.Types.ObjectId;
  toEmail: string;
  toName?: string;
  subject: string;
  body: string;
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED';
  provider: string;
  messageId?: string;
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IStatusHistory {
  _id: mongoose.Types.ObjectId;
  status: ComplaintStatus;
  note?: string;
  createdAt: Date;
}

export interface IComplaint extends Document {
  _id: mongoose.Types.ObjectId;
  reference: string;
  subject: string;
  body: string;
  senderEmail: string;
  senderName?: string;
  location?: string;
  city?: string;
  state?: string;
  status: ComplaintStatus;
  userId?: mongoose.Types.ObjectId;
  authorityId?: mongoose.Types.ObjectId;
  aiAnalysis?: IAIAnalysis;
  emailMessages: IEmailMessage[];
  statusHistory: IStatusHistory[];
  createdAt: Date;
  updatedAt: Date;
}

const AIAnalysisSchema = new Schema<IAIAnalysis>(
  {
    category:        { type: String, required: true },
    subcategory:     { type: String },
    summary:         { type: String, required: true },
    locationArea:    { type: String },
    locationCity:    { type: String },
    locationState:   { type: String },
    locationCountry: { type: String },
    severity:  { type: String, enum: ['LOW','MEDIUM','HIGH','CRITICAL'], default: 'MEDIUM' },
    urgency:   { type: String, enum: ['LOW','NORMAL','HIGH','EMERGENCY'], default: 'NORMAL' },
    confidence:       { type: Number, required: true },
    needsHumanReview: { type: Boolean, default: false },
    recommendedDept:  { type: String },
    authorityType:    { type: String },
  },
  { _id: false, timestamps: { createdAt: true, updatedAt: false } }
);

const EmailMessageSchema = new Schema<IEmailMessage>(
  {
    toEmail:   { type: String, required: true },
    toName:    { type: String },
    subject:   { type: String, required: true },
    body:      { type: String, required: true },
    status:    { type: String, enum: ['PENDING','SENT','DELIVERED','FAILED'], default: 'PENDING' },
    provider:  { type: String, default: 'mock' },
    messageId: { type: String },
    sentAt:    { type: Date },
  },
  { timestamps: true }
);

const StatusHistorySchema = new Schema<IStatusHistory>(
  {
    status: {
      type: String,
      enum: ['RECEIVED','ANALYZING','NEEDS_REVIEW','READY_TO_SEND','SENT','ACKNOWLEDGED','IN_PROGRESS','RESOLVED','FAILED'],
      required: true,
    },
    note: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const ComplaintSchema = new Schema<IComplaint>(
  {
    reference:   { type: String, required: true, unique: true },
    subject:     { type: String, required: true },
    body:        { type: String, required: true },
    senderEmail: { type: String, required: true },
    senderName:  { type: String },
    location:    { type: String },
    city:        { type: String },
    state:       { type: String },
    status: {
      type: String,
      enum: ['RECEIVED','ANALYZING','NEEDS_REVIEW','READY_TO_SEND','SENT','ACKNOWLEDGED','IN_PROGRESS','RESOLVED','FAILED'],
      default: 'RECEIVED',
    },
    userId:      { type: Schema.Types.ObjectId, ref: 'User' },
    authorityId: { type: Schema.Types.ObjectId, ref: 'Authority' },
    aiAnalysis:    { type: AIAnalysisSchema },
    emailMessages: [EmailMessageSchema],
    statusHistory: [StatusHistorySchema],
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

export const Complaint = mongoose.model<IComplaint>('Complaint', ComplaintSchema);
