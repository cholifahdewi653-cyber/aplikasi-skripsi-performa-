import { z } from "zod";

export const sizeSchema = z.object({
  name: z.string().min(1, "Nama ukuran tidak boleh kosong"),
  price: z.number().int().min(0, "Harga ukuran tidak boleh negatif"),
});

export const productSchema = z.object({
  name: z.string().min(3, "Nama minimal 3 karakter").max(100),
  category: z.string().min(1, "Kategori tidak boleh kosong"),
  basePrice: z.number().int().min(0, "Harga dasar minimal 0"),
  description: z.string().min(5, "Deskripsi minimal 5 karakter").max(1000),
  sizes: z.array(sizeSchema).min(1, "Ukuran tidak boleh kosong"),
  variantRasa: z.string().min(1, "Varian rasa tidak boleh kosong"),
  stock: z.enum(["ready", "pre-order"]).default("ready"),
  discount: z.boolean().default(false),
  discountType: z.enum(["percentage", "fixed"]).optional().nullable(),
  discountValue: z.number().int().min(0).optional().nullable(),
});

export type ProductInput = z.infer<typeof productSchema>;
export type SizeInput = z.infer<typeof sizeSchema>;
