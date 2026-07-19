import express from "express";
import { authMiddleware } from "../middleware/auth";
import { updateMyProfile } from "../controllers/profileControllers";
import { upload } from "../lib/multer";

const router = express.Router();

router.patch(
  "/update-profile",
  authMiddleware(["ADMIN", "USER"]),
  upload.single("avatar"),
  updateMyProfile,
);

export default router;
