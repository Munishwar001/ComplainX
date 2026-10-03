import { AIAnalysisResult, CATEGORY_LABELS } from '../ai/types';

interface GenerateEmailInput {
  reference: string;
  senderEmail: string;
  senderName?: string;
  subject: string;
  body: string;
  analysis: AIAnalysisResult;
  authorityName: string;
  authorityDepartment: string;
}

export interface GeneratedEmail {
  subject: string;
  body: string;
}

export function generateComplaintEmail(input: GenerateEmailInput): GeneratedEmail {
  const {
    reference,
    senderName,
    analysis,
    authorityName,
    authorityDepartment,
  } = input;

  const categoryLabel = CATEGORY_LABELS[analysis.category] || analysis.category;
  const location = [
    analysis.location.area,
    analysis.location.city,
    analysis.location.state,
  ]
    .filter(Boolean)
    .join(', ');

  const emailSubject = `Complaint Regarding ${categoryLabel} in ${location || 'the reported area'} [Ref: ${reference}]`;

  const emailBody = `Dear Sir/Madam,

I am writing on behalf of ${senderName || 'a concerned citizen'} regarding a civic issue reported through ComplanX, an AI-powered complaint management platform.

Issue Category: ${categoryLabel}${analysis.subcategory ? ` — ${analysis.subcategory.replace(/_/g, ' ')}` : ''}
Location: ${location || 'Not specified'}
Severity: ${analysis.severity.charAt(0).toUpperCase() + analysis.severity.slice(1)}

Summary:
${analysis.summary}

Original Complaint:
${input.body}

We kindly request the ${authorityDepartment} of ${authorityName} to review this issue and take appropriate action at the earliest convenience.

Complaint Reference: ${reference}
Submitted via: ComplanX (complaints@complanx.app)
AI Confidence: ${Math.round(analysis.confidence * 100)}%

Regards,
ComplanX Platform
On behalf of the complainant

---
This complaint was submitted and classified by ComplanX AI. If you have questions, contact complaints@complanx.app.`;

  return {
    subject: emailSubject,
    body: emailBody,
  };
}
