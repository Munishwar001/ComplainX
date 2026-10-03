import { EmailProvider, SendEmailData, EmailResult } from './types';
import { Complaint } from '../../models/Complaint';

export class MockEmailProvider implements EmailProvider {
  async sendEmail(data: SendEmailData): Promise<EmailResult> {
    const messageId = `mock-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    await Complaint.updateOne(
      { _id: data.complaintId, 'emailMessages.status': 'PENDING' },
      {
        $set: {
          'emailMessages.$[].status': 'SENT',
          'emailMessages.$[].messageId': messageId,
          'emailMessages.$[].sentAt': new Date(),
          'emailMessages.$[].provider': 'mock',
        },
      }
    );

    console.log(`[MockEmail] → ${data.to} | ${data.subject} | ID: ${messageId}`);
    return { success: true, messageId, provider: 'mock' };
  }
}
