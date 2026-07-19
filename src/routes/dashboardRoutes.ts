import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { getOwnerDashboard, getAdminDashboard } from "../controllers/dashboardControllers";

const router = Router();

router.get("/owner", authMiddleware(["OWNER"]), getOwnerDashboard);
router.get("/admin", authMiddleware(["ADMIN"]), getAdminDashboard);

export default router;
