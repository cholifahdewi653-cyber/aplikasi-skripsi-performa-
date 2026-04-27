import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().min(1, "Nama kategori tidak boleh kosong"),
  slug: z.string().min(1, "Slug tidak boleh kosong"),
});

export type CategoryInput = z.infer<typeof categorySchema>;
