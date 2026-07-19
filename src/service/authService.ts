import "dotenv/config";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import {
  AuthError,
  ConflictError,
  CredentialError,
  NotFoundError,
} from "../error/error";
import {
  loginSchema,
  registerSchema,
  LoginInput,
  RegisterInput,
} from "../schema/authSchema";
import {
  hashPassword,
  comparePassword,
} from "../utils/helper/password.helpers";

export { loginSchema, registerSchema };
export type { LoginInput, RegisterInput };

// ─── Config ───────────────────────────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("JWT_SECRET tidak ditemukan");

export const TOKEN_CONFIG = {
  ADMIN: {
    expiredIn: "2h",
    maxAge: 2 * 60 * 60 * 1000, // 2 jam
    cookieKey: "tokenAdmin",
  },
  USER: {
    expiredIn: "8h",
    maxAge: 8 * 60 * 60 * 1000, // 8 jam
    cookieKey: "tokenUser",
  },
  OWNER: {
    expiredIn: "2h",
    maxAge: 2 * 60 * 60 * 1000,
    cookieKey: "tokenAdmin", // OWNER is treated similarly to Admin for token keys
  },
} as const;

// ─── Service Functions ────────────────────────────────────────────────────────
export const registerService = async (body: RegisterInput) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: body.email },
  });

  if (existingUser) {
    throw new ConflictError("Email sudah digunakan");
  }

  const hashedPassword = await hashPassword(body.password);

  // Register only registers USER role
  const user = await prisma.user.create({
    data: {
      name: body.name,
      email: body.email,
      password: hashedPassword,
      role: "USER",
    },
  });

  const { password, ...userSafe } = user;
  return userSafe;
};

export const loginService = async (body: LoginInput) => {
  const isEmail = body.identifier.includes("@");

  const user = isEmail
    ? await prisma.user.findUnique({ where: { email: body.identifier } })
    : await prisma.user.findUnique({ where: { userName: body.identifier } });

  if (!user) throw new CredentialError("Email/username atau password salah");

  const isPasswordValid = await comparePassword(body.password, user.password);
  if (!isPasswordValid)
    throw new CredentialError("Email/username atau password salah");

  const { password, ...userSafe } = user;
  const configToken =
    TOKEN_CONFIG[user.role as keyof typeof TOKEN_CONFIG] || TOKEN_CONFIG.USER;

  const token = jwt.sign({ id: userSafe.id, role: userSafe.role }, JWT_SECRET, {
    expiresIn: configToken.expiredIn,
    algorithm: "HS256",
  });

  return { userSafe, token, configToken };
};

export const getMeService = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    omit: { password: true },
  });

  if (!user) throw new NotFoundError("User");
  return user;
};

export const logOutService = (role: string) => {
  const configToken =
    TOKEN_CONFIG[role as keyof typeof TOKEN_CONFIG] || TOKEN_CONFIG.USER;
  if (!configToken) throw new AuthError("Role tidak valid");
  return configToken;
};
