import { z } from 'zod';

export const createComplaintSchema = z.object({
  subject: z.string().min(5, 'Subject too short'),
  body: z.string().min(20, 'Please provide more details'),
  senderEmail: z.string().email('Invalid sender email'),
  senderName: z.string().optional(),
  location: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
});

export const simulateEmailSchema = z.object({
  senderEmail: z.string().email('Invalid sender email'),
  subject: z.string().min(3, 'Subject too short'),
  body: z.string().min(10, 'Body too short'),
  senderName: z.string().optional(),
});

export type CreateComplaintInput = z.infer<typeof createComplaintSchema>;
export type SimulateEmailInput = z.infer<typeof simulateEmailSchema>;
