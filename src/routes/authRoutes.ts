import express from "express";
import { getMe, login, logOut, register } from "../controllers/authControllers";
import { authMiddleware } from "../middleware/auth";

const router = express.Router();

router.post("/login", login);
router.post("/register", register);
router.post("/logout", authMiddleware(["ADMIN", "USER"]), logOut);
router.get("/me", authMiddleware(["ADMIN", "USER"]), getMe);

export default router;
