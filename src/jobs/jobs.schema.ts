import { z } from "zod";

export const applicationStatusEnum = z.enum(["saved", "applied", "interview", "offer", "rejected"]);

export const createJobSchema = z.object({
  company: z.string().min(1),
  role: z.string().min(1),
  status: applicationStatusEnum.optional(),
  appliedDate: z.coerce.date(),
  url: z.string().url().optional(),
  notes: z.string().optional(),
});

export const updateJobSchema = createJobSchema.partial();

export type CreateJobInput = z.infer<typeof createJobSchema>;
export type UpdateJobInput = z.infer<typeof updateJobSchema>;
