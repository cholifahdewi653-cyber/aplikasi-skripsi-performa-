import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import {
  addToCart,
  deleteCart,
  getAllCart,
} from "../controllers/cartControllers";

const router = Router();

router.get("/", authMiddleware(["USER"]), getAllCart);
router.post("/", authMiddleware(["USER"]), addToCart);
router.delete("/:cartItemId", authMiddleware(["USER"]), deleteCart);

export default router;
