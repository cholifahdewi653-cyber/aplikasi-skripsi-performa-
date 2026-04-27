import { z } from "zod";

export const createOrderSchema = z.object({
  shippingAddress: z.string().optional(),

  cartItemIds: z.array(z.string().cuid()).optional(),

  items: z
    .array(
      z.object({
        productId: z.string().cuid(),
        variantId: z.string().cuid().optional(),
        sizeId: z.string().cuid().optional(),
        quantity: z.number().min(1),
      }),
    )
    .optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z
    .enum(["PENDING", "ORDERED", "PACKING", "SHIPPED", "COMPLETED", "RETURNED"])
    .default("PENDING"),
  note: z.string().optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
