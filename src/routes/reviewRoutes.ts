import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import {
  createReview,
  getProductReviews,
} from "../controllers/reviewControllers";
import { upload } from "../lib/multer";

const router = Router();

// Beri review item pesanan (User only)
router.post("/", authMiddleware(["USER"]), upload.single("foto"), createReview);

// Lihat review produk reguler (Public)
router.get("/product/:productId", getProductReviews);

export default router;
