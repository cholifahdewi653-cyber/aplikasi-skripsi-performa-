import { Request, Response } from "express";
import { AuthError } from "../error/error";
import { createReviewSchema } from "../schema/reviewSchema";
import { createReviewService, getProductReviewsService } from "../service/reviewService";
import { wrap } from "../utils/helper/wrap.helpers";
import { validate } from "../utils/helper/validate.helpers";

// ─── POST /api/reviews — User memberi review ─────────────────────────────────
export const createReview = wrap(async (req: Request, res: Response) => {
  if (!req.user) throw new AuthError();

  const body = validate(createReviewSchema, req.body);
  const fileBuffer = req.file?.buffer;

  const data = await createReviewService(req.user.id, body, fileBuffer);

  res.status(201).json({
    success: true,
    message: "Ulasan berhasil dikirim",
    data,
  });
});

// ─── GET /api/reviews/product/:productId — Ambil review produk reguler ────────
export const getProductReviews = wrap(async (req: Request, res: Response) => {
  const { productId } = req.params as { productId: string };
  const data = await getProductReviewsService(productId);

  res.status(200).json({
    success: true,
    data,
  });
});
