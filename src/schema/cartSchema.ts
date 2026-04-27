import { z } from "zod";

export const addToCartSchema = z.object({
  productId: z.string().cuid({ message: "productId tidak valid" }),
  quantity: z.number().int().min(1, "quantity minimal 1").default(1),
  variantId: z.string().cuid({ message: "variantId tidak valid" }).optional(),
  sizeId: z.string().cuid({ message: "sizeId tidak valid" }).optional(),
});

export const deleteCartItemSchema = z.object({
  cartItemId: z.string().cuid({ message: "cartItemId tidak valid" }),
});

export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type DeleteCartItemParams = z.infer<typeof deleteCartItemSchema>;
