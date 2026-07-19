import { z } from "zod";

export const addToCartSchema = z.object({
  type: z.enum(["PRODUCT", "CUSTOM_CAKE"]),
  productId: z.string().cuid({ message: "productId tidak valid" }).optional(),
  productSizeId: z
    .string()
    .cuid({ message: "productSizeId tidak valid" })
    .optional(),
  customCakeId: z
    .string()
    .cuid({ message: "customCakeId tidak valid" })
    .optional(),
  rasa: z.string().optional(), // snapshot varian rasa untuk produk reguler
  qty: z.number().int().min(1, "quantity minimal 1").default(1),
});

export const deleteCartItemSchema = z.object({
  cartItemId: z.string().cuid({ message: "cartItemId tidak valid" }),
});

export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type DeleteCartItemParams = z.infer<typeof deleteCartItemSchema>;
