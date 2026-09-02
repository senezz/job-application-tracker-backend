import { z } from "zod";

export const createResponseSchema = z.object({
  gmailMessageId: z.string().optional(),
  sender: z.string().optional(),
  subject: z.string().optional(),
  receivedAt: z.coerce.date().optional(),
  content: z.string().optional(),
});

export type CreateResponseInput = z.infer<typeof createResponseSchema>;
