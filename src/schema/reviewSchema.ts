import { z } from "zod";

const numberPreprocess = (val: unknown) => {
  if (typeof val === "string") {
    const num = Number(val);
    return isNaN(num) ? val : num;
  }
  return val;
};

export const createReviewSchema = z.object({
  orderItemId: z.string().cuid({ message: "orderItemId tidak valid" }),
  rating: z.preprocess(
    numberPreprocess,
    z.number().int().min(1, "Rating minimal 1").max(5, "Rating maksimal 5"),
  ),
  comment: z.string().optional().nullable(),
  foto: z.string().optional().nullable(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
