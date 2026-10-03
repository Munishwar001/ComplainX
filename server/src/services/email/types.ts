export interface SendEmailData {
  to: string;
  toName?: string;
  subject: string;
  body: string;
  complaintId: string;
  reference: string;
}

export interface EmailResult {
  success: boolean;
  messageId: string;
  provider: string;
  error?: string;
}

export interface EmailProvider {
  sendEmail(data: SendEmailData): Promise<EmailResult>;
}
