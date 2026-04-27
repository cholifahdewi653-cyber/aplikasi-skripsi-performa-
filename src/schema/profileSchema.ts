import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().min(1, "Nama tidak boleh kosong").optional(),
  phoneNumber: z.string().optional(),
  // User fields
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  // Admin fields
  adminNotes: z.string().optional(),
  department: z.string().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
