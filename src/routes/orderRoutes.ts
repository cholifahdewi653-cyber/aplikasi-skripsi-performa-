import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import {
  createOrder,
  getAllOrders,
  getMyOrders,
  updateOrderStatus,
} from "../controllers/orderControllers";
const router = Router();

// ======================================
// USER
// ======================================

// checkout cart jadi order
router.post("/checkout", authMiddleware(["USER"]), createOrder);

// lihat order sendiri
router.get("/my-orders", authMiddleware(["USER"]), getMyOrders);

// ======================================
// ADMIN
// ======================================

// lihat semua order
router.get("/admin/all", authMiddleware(["ADMIN"]), getAllOrders);

// update status
router.patch("/admin/:id/status", authMiddleware(["ADMIN"]), updateOrderStatus);

export default router;
