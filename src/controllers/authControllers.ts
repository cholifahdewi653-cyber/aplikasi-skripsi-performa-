import "dotenv/config";
import { Request, Response } from "express";
import { AuthError } from "../error/error";
import {
  loginSchema,
  loginService,
  logOutService,
  getMeService,
  registerSchema,
  registerService,
} from "../service/authService";
import { wrap } from "../utils/helper/wrap.helpers";
import { validate } from "../utils/helper/validate.helpers";

// ─── Register ─────────────────────────────────────────────────────────────────
export const register = wrap(async (req: Request, res: Response) => {
  const body = validate(registerSchema, req.body);
  const userSafe = await registerService(body);

  res.status(201).json({
    success: true,
    message: "User berhasil dibuat",
    data: userSafe,
  });
});

// ─── Login ────────────────────────────────────────────────────────────────────
export const login = wrap(async (req: Request, res: Response) => {
  const body = validate(loginSchema, req.body);
  const { userSafe, token, configToken } = await loginService(body);

  res.cookie(configToken.cookieKey, token, {
    maxAge: configToken.maxAge,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  res.status(200).json({
    success: true,
    message: "Login Berhasil",
    data: userSafe,
  });
});

// ─── Logout ───────────────────────────────────────────────────────────────────
export const logOut = wrap(async (req: Request, res: Response) => {
  if (!req.user) throw new AuthError("Tidak terautentikasi");

  const configToken = logOutService(req.user.role);

  res.clearCookie(configToken.cookieKey, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  res.status(200).json({
    success: true,
    message: "Logout Berhasil",
  });
});

// ─── Get Me ───────────────────────────────────────────────────────────────────
export const getMe = wrap(async (req: Request, res: Response) => {
  if (!req.user) throw new AuthError("Tidak terautentikasi");

  const user = await getMeService(req.user.id);

  res.status(200).json({
    success: true,
    message: "User ditemukan",
    data: user,
  });
});
