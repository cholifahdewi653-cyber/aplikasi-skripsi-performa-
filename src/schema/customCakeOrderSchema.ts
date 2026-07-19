import { z } from "zod";

const jsonArrayPreprocess = (val: unknown) => {
  if (typeof val === "string") {
    try {
      return JSON.parse(val);
    } catch {
      return val;
    }
  }
  return val;
};

const numberPreprocess = (val: unknown) => {
  if (typeof val === "string") {
    const num = Number(val);
    return isNaN(num) ? val : num;
  }
  return val;
};

// ─── Create Custom Cake Order (User) ──────────────────────────────────────────
export const createCustomCakeOrderSchema = z.object({
  baseCakeId: z.string().cuid({ message: "baseCakeId tidak valid" }),
  tipeCreamId: z.string().cuid({ message: "tipeCreamId tidak valid" }),
  warnaCreamId: z.string().cuid({ message: "warnaCreamId tidak valid" }),

  layers: z.preprocess(
    jsonArrayPreprocess,
    z
      .array(
        z.object({
          layerId: z.string().cuid({ message: "layerId tidak valid" }),
          sizeId: z.string().cuid({ message: "sizeId tidak valid" }),
          position: z.preprocess(numberPreprocess, z.number().int().min(1, "Posisi layer minimal 1")),
        }),
      )
      .min(1, "Minimal 1 layer harus dipilih"),
  ),

  toppings: z.preprocess(
    jsonArrayPreprocess,
    z
      .array(
        z.object({
          toppingId: z.string().cuid({ message: "toppingId tidak valid" }),
          qty: z.preprocess(numberPreprocess, z.number().int().min(1, "Quantity topping minimal 1").default(1)),
        }),
      )
      .optional(),
  ),

  lilinId: z.string().cuid({ message: "lilinId tidak valid" }).optional().nullable(),
  topperId: z.string().cuid({ message: "topperId tidak valid" }).optional().nullable(),

  ucapan: z.string().optional().nullable(),
  catatan: z.string().optional().nullable(),
  dekorasiLainnya: z.string().optional().nullable(),
  lilinAngkaGoldQty: z.preprocess(
    numberPreprocess,
    z.number().int().min(0).default(0),
  ),
  foto: z.string().optional().nullable(),
});

export type CreateCustomCakeOrderInput = z.infer<typeof createCustomCakeOrderSchema>;
export type CreateCustomCakeOrderServiceInput = CreateCustomCakeOrderInput & {
  foto?: string | null;
  fotoPublicId?: string | null;
};
