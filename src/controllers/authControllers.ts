import * as z from "zod";
import "dotenv/config";
import jwt from "jsonwebtoken";
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma";

const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
});

const registerScema = z
  .object({
    name: z.string().min(3, "Nama minimal 3 karakter"),
    email: z.string().email("Format email tidak valid"),
    password: z.string().min(8, "Password minimal 8 karakter"),
    confirmPassword: z
      .string()
      .min(8, "Konfirmasi Password minimal 8 karakter"),
    role: z.enum(["ADMIN", "USER"]).default("USER"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password dan konfirmasi password harus sama",
    path: ["confirmPassword"],
  });

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("JWT_SECRET tidak ditemukan");

const TOKEN_CONFIG = {
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
} as const;

const hashPassword = async (password: string) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

const handleErrorZod = (error: z.ZodError, res: Response) => {
  return res.status(400).json({
    success: false,
    message: "Terjadi kesalahan validasi",
    errors: error.flatten().fieldErrors,
  });
};

// register
export const register = async (req: Request, res: Response) => {
  try {
    const body = registerScema.parse(req.body);

    const existingUser = await prisma.user.findUnique({
      where: {
        email: body.email,
      },
    });

    // cek email
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email sudah digunakan",
      });
    }

    // hash password
    const hashedPassword = await hashPassword(body.password);

    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        password: hashedPassword,
        role: body.role,
      },
    });

    // sembunyikan password
    const { password, ...userSafe } = user;

    res.status(201).json({
      success: true,
      message: "User berhasil dibuat",
      data: userSafe,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleErrorZod(error, res);
    }

    console.error(error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server",
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const body = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Email atau password salah",
      });
    }

    const isPasswordValid = await bcrypt.compare(body.password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Email atau password salah",
      });
    }

    const { password, ...userSafe } = user;
    const configToken = TOKEN_CONFIG[user.role];

    const token = jwt.sign(
      { id: userSafe.id, role: userSafe.role },
      JWT_SECRET,
      {
        expiresIn: configToken.expiredIn,
        algorithm: "HS256",
      },
    );

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
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleErrorZod(error, res);
    }

    console.error(error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server",
    });
  }
};

export const logOut = async (req: Request, res: Response) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Tidak terautentikasi",
      });
    }

    const configToken = TOKEN_CONFIG[user.role as keyof typeof TOKEN_CONFIG];

    res.clearCookie(configToken.cookieKey, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
    res.status(200).json({
      success: true,
      message: "Logout Berhasil",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server",
    });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    console.log("user =", user);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Tidak terautentikasi",
      });
    }

    const freshUser = await prisma.user.findUnique({
      where: { id: user.id },
      omit: {
        password: true,
      },
    });

    if (!freshUser) {
      return res.status(401).json({
        success: false,
        message: "User tidak ditemukan",
      });
    }

    res.status(200).json({
      success: true,
      message: "User ditemukan",
      data: freshUser,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server",
    });
  }
};
