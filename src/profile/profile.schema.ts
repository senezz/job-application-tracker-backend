import { z } from "zod";

export const updateProfileSchema = z.object({
  fullName: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  links: z.array(z.string().url()).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
