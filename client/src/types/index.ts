export type Role = 'USER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export type ComplaintStatus =
  | 'RECEIVED'
  | 'ANALYZING'
  | 'NEEDS_REVIEW'
  | 'READY_TO_SEND'
  | 'SENT'
  | 'ACKNOWLEDGED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'FAILED';

export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type Urgency = 'LOW' | 'NORMAL' | 'HIGH' | 'EMERGENCY';

export interface AIAnalysis {
  id: string;
  category: string;
  subcategory?: string;
  summary: string;
  locationArea?: string;
  locationCity?: string;
  locationState?: string;
  locationCountry?: string;
  severity: Severity;
  urgency: Urgency;
  confidence: number;
  needsHumanReview: boolean;
  recommendedDept?: string;
  authorityType?: string;
  createdAt: string;
}

export interface Authority {
  id: string;
  name: string;
  department: string;
  city: string;
  state: string;
  country: string;
  email: string;
  phone?: string;
  website?: string;
  categories: string[];
  isActive: boolean;
}

export interface EmailMessage {
  id: string;
  toEmail: string;
  toName?: string;
  subject: string;
  body: string;
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED';
  provider: string;
  messageId?: string;
  sentAt?: string;
  createdAt: string;
}

export interface StatusHistory {
  id: string;
  status: ComplaintStatus;
  note?: string;
  createdAt: string;
}

export interface Complaint {
  id: string;
  reference: string;
  subject: string;
  body: string;
  senderEmail: string;
  senderName?: string;
  location?: string;
  city?: string;
  state?: string;
  status: ComplaintStatus;
  createdAt: string;
  updatedAt: string;
  userId?: string;
  user?: { id: string; name: string; email: string };
  authorityId?: string;
  authority?: Authority;
  aiAnalysis?: AIAnalysis;
  emailMessages: EmailMessage[];
  statusHistory: StatusHistory[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface DashboardStats {
  total: number;
  pending: number;
  needsReview: number;
  sent: number;
  inProgress: number;
  resolved: number;
  byCategory: { category: string; _count: number }[];
  byStatus: { status: ComplaintStatus; _count: number }[];
}
