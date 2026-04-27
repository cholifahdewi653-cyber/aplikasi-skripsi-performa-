import express from "express";
import { authMiddleware } from "../middleware/auth";
import { getMe } from "../controllers/authControllers";
import { updateMyProfile } from "../controllers/profileControllers";

const router = express.Router();

router.get("/me", authMiddleware(["ADMIN", "USER"]), getMe);
router.put("/update-profile", authMiddleware(["ADMIN", "USER"]), updateMyProfile);

export default router;
