import nodemailer from 'nodemailer';
import { EmailProvider, SendEmailData, EmailResult } from './types';
import { getSettings } from '../../models/AppSettings';
import { Complaint } from '../../models/Complaint';

/**
 * GmailSmtpProvider — sends real emails using the Gmail account
 * configured in AppSettings (same credentials used for IMAP fetching).
 * Uses Gmail SMTP via nodemailer with App Password auth.
 */
export class GmailSmtpProvider implements EmailProvider {
  async sendEmail(data: SendEmailData): Promise<EmailResult> {
    const settings = await getSettings();

    if (!settings.gmailUser || !settings.gmailAppPassword) {
      throw new Error('Gmail credentials not configured in Settings');
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: settings.gmailUser,
        pass: settings.gmailAppPassword,
      },
    });

    try {
      const info = await transporter.sendMail({
        from: `"ComplanX" <${settings.gmailUser}>`,
        to: data.to,
        subject: data.subject,
        text: data.body,
        replyTo: settings.gmailUser,
      });

      const messageId = info.messageId || `gmail-${Date.now()}`;

      // Update email record in DB
      await Complaint.updateOne(
        { _id: data.complaintId, 'emailMessages.status': 'PENDING' },
        {
          $set: {
            'emailMessages.$[].status': 'SENT',
            'emailMessages.$[].messageId': messageId,
            'emailMessages.$[].sentAt': new Date(),
            'emailMessages.$[].provider': 'gmail-smtp',
          },
        }
      );

      console.log(`[GmailSMTP] ✅ Real email sent to ${data.to} | ID: ${messageId}`);

      return { success: true, messageId, provider: 'gmail-smtp' };
    } catch (err: any) {
      console.error(`[GmailSMTP] ❌ Send failed: ${err.message}`);
      return { success: false, messageId: '', provider: 'gmail-smtp', error: err.message };
    }
  }
}
