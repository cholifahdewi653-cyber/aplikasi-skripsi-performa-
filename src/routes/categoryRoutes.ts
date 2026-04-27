import { Router } from "express";
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryControllers";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.get("/", authMiddleware(["ADMIN"]), getAllCategories);
router.get("/:id", authMiddleware(["ADMIN"]), getCategoryById);
router.post("/", authMiddleware(["ADMIN"]), createCategory);
router.put("/:id", authMiddleware(["ADMIN"]), updateCategory);
router.delete("/:id", authMiddleware(["ADMIN"]), deleteCategory);

export default router;
