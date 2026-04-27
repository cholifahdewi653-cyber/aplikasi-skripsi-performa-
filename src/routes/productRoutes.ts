import express from "express";
import {
  createProduct,
  deleteProduct,
  getAllProduct,
  getOneProduct,
  updateProduct,
} from "../controllers/productControllers";
import { authMiddleware } from "../middleware/auth";
import { upload } from "../lib/multer";

const router = express.Router();

// user + admin
router.get("/", getAllProduct);
router.get("/:id", getOneProduct);

// admin
router.post(
  "/",
  authMiddleware(["ADMIN"]),
  upload.array("images", 10),
  createProduct,
);
router.put(
  "/:id",
  authMiddleware(["ADMIN"]),
  upload.array("images", 10),
  updateProduct,
);
router.delete("/:id", authMiddleware(["ADMIN"]), deleteProduct);

export default router;
