import { Router } from "express";
import { authMiddleware } from "../middleware/auth";

// ── Admin: Master Option CRUD ─────────────────────────────────────────────────
import {
  createCustomCakeOption,
  getAllCustomCakeOptions,
  getOneCustomCakeOption,
  updateCustomCakeOption,
  deleteCustomCakeOption,
} from "../controllers/customCakeControllers";

// ── User: Custom Cake Order ───────────────────────────────────────────────────
import {
  createCustomCakeOrder,
  getCustomCakeOptions,
  getCustomCakeDetail,
} from "../controllers/customCakeOrderControllers";

import { upload } from "../lib/multer";

const router = Router();

// ── USER ENDPOINTS ────────────────────────────────────────────────────────────
// Lihat semua opsi aktif (untuk form kustomisasi)
router.get("/all-options", getCustomCakeOptions);

// Buat custom cake baru
router.post(
  "/order",
  authMiddleware(["USER"]),
  upload.single("foto"),
  createCustomCakeOrder,
);

// Detail satu custom cake
router.get("/order/:id", authMiddleware(["USER"]), getCustomCakeDetail);

// ── ADMIN ENDPOINTS (Master Options) ──────────────────────────────────────────
router.post(
  "/options/:category",
  authMiddleware(["ADMIN"]),
  createCustomCakeOption,
);
router.get(
  "/options/:category",
  authMiddleware(["ADMIN"]),
  getAllCustomCakeOptions,
);
router.get(
  "/options/:category/:id",
  authMiddleware(["ADMIN"]),
  getOneCustomCakeOption,
);
router.patch(
  "/options/:category/:id",
  authMiddleware(["ADMIN"]),
  updateCustomCakeOption,
);
router.delete(
  "/options/:category/:id",
  authMiddleware(["ADMIN"]),
  deleteCustomCakeOption,
);

export default router;
