import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import {
  createOrder,
  getAllOrders,
  getMyOrders,
  updateOrderStatus,
  verifyOrder,
  shipOrder,
  proofDelivery,
  confirmArrival,
  resolveCancel,
  uploadPaymentProof,
  editPayment,
  requestCancel,
  reorder,
  getOrderDetail,
} from "../controllers/orderControllers";
import { upload } from "../lib/multer";

const router = Router();

// ── USER ROUTES ───────────────────────────────────────────────────────────────
// Checkout dari keranjang belanja
router.post("/checkout", authMiddleware(["USER"]), createOrder);

// Lihat order milik sendiri
router.get("/my-orders", authMiddleware(["USER"]), getMyOrders);

// Lihat rincian satu order (User, Admin, Owner)
router.get("/detail/:id", authMiddleware(["USER", "ADMIN", "OWNER"]), getOrderDetail);

// Upload bukti pembayaran transfer (Belum Bayar)
router.post(
  "/my-orders/:id/payment-proof",
  authMiddleware(["USER"]),
  upload.single("bukti"),
  uploadPaymentProof,
);

// Edit metode/informasi pembayaran (Belum Bayar)
router.patch(
  "/my-orders/:id/edit-payment",
  authMiddleware(["USER"]),
  editPayment,
);

// Ajukan pembatalan pesanan (Maks 3 kali)
router.post("/my-orders/:id/cancel", authMiddleware(["USER"]), requestCancel);

// Beli lagi pesanan lama (Reorder)
router.post("/my-orders/:id/reorder", authMiddleware(["USER"]), reorder);

// ── ADMIN ROUTES ──────────────────────────────────────────────────────────────
// Lihat semua order
router.get("/admin/all", authMiddleware(["ADMIN"]), getAllOrders);

// Update status pesanan secara umum (opsi penyesuaian manual)
router.patch("/admin/:id/status", authMiddleware(["ADMIN"]), updateOrderStatus);

// Verifikasi pesanan (Pengecekan Pesanan -> Terima/Tolak)
router.patch("/admin/:id/verify", authMiddleware(["ADMIN"]), verifyOrder);

// Pengiriman pesanan (Proses -> Dikirim)
router.patch("/admin/:id/ship", authMiddleware(["ADMIN"]), shipOrder);

// Upload bukti pengiriman sampai (Dikirim -> Sampai)
router.post(
  "/admin/:id/proof-delivery",
  authMiddleware(["ADMIN"]),
  upload.single("foto"),
  proofDelivery,
);

// Konfirmasi pesanan sampai (Sampai -> Selesai)
router.patch(
  "/admin/:id/confirm-arrival",
  authMiddleware(["ADMIN"]),
  confirmArrival,
);

// Proses permohonan pembatalan dari user (Batal / Tolak Batal)
router.patch(
  "/admin/requests/:requestId/resolve",
  authMiddleware(["ADMIN"]),
  resolveCancel,
);

export default router;
