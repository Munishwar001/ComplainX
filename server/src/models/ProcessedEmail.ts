import mongoose, { Schema, Document } from 'mongoose';

/**
 * Tracks emails that have already been ingested as complaints.
 * Uses the IMAP Message-ID header as a dedup key.
 */
export interface IProcessedEmail extends Document {
  messageId: string;   // IMAP Message-ID header value
  uid: number;         // IMAP UID (per-mailbox sequence number)
  complaintId?: string;
  processedAt: Date;
}

const ProcessedEmailSchema = new Schema<IProcessedEmail>({
  messageId:   { type: String, required: true, unique: true },
  uid:         { type: Number, required: true },
  complaintId: { type: String },
  processedAt: { type: Date, default: Date.now },
});

export const ProcessedEmail = mongoose.model<IProcessedEmail>('ProcessedEmail', ProcessedEmailSchema);
