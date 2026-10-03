import { env } from '../../config/env';
import { EmailProvider } from './types';
import { MockEmailProvider } from './mockProvider';
import { GmailSmtpProvider } from './gmailSmtpProvider';

export function getEmailProvider(): EmailProvider {
  // Use Gmail SMTP if provider is set to gmail or gmail-smtp
  if (env.EMAIL_PROVIDER === 'gmail' || env.EMAIL_PROVIDER === 'gmail-smtp') {
    return new GmailSmtpProvider();
  }

  // Default mock
  return new MockEmailProvider();

  // Future providers:
  // case 'smtp':    return new SMTPProvider();
  // case 'resend':  return new ResendProvider();
}
