import { z } from "zod";

export const customCakeOptionSchema = z.object({
  name: z.string().min(1, "Nama tidak boleh kosong"),
  price: z.preprocess((val) => {
    if (typeof val === "string") return Number(val);
    return val;
  }, z.number().int().min(0, "Harga tidak boleh negatif")),
  status: z.preprocess((val) => {
    if (typeof val === "string") return val === "true" || val === "1";
    if (typeof val === "number") return val === 1;
    return val;
  }, z.boolean().default(true)),
  // Khusus WarnaCream (opsional untuk kategori lain)
  warna: z.string().optional(),
  hex: z.string().optional(),
});

export type CustomCakeOptionInput = z.infer<typeof customCakeOptionSchema>;
