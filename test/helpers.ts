import request from "supertest";
import app from "../server.js";
import { prisma } from "../src/lib/prisma.js";

/**
 * Login sebagai USER dan kembalikan cookie string `tokenUser=...`
 */
export async function loginAsUser(
  email = "testuser@example.com",
  password = "password123",
): Promise<string> {
  const res = await request(app)
    .post("/api/auth/login")
    .send({ identifier: email, password });

  const cookies: string[] = res.headers["set-cookie"] as unknown as string[];
  const tokenCookie = cookies?.find((c: string) => c.startsWith("tokenUser="));
  if (!tokenCookie)
    throw new Error("tokenUser cookie tidak ditemukan setelah login user");
  return tokenCookie.split(";")[0]; // "tokenUser=xxxx"
}

/**
 * Login sebagai ADMIN dan kembalikan cookie string `tokenAdmin=...`
 */
export async function loginAsAdmin(
  email = "admin@example.com",
  password = "admin123",
): Promise<string> {
  const res = await request(app)
    .post("/api/auth/login")
    .send({ identifier: email, password });

  const cookies: string[] = res.headers["set-cookie"] as unknown as string[];
  const tokenCookie = cookies?.find((c: string) => c.startsWith("tokenAdmin="));
  if (!tokenCookie)
    throw new Error("tokenAdmin cookie tidak ditemukan setelah login admin");
  return tokenCookie.split(";")[0]; // "tokenAdmin=xxxx"
}

/**
 * Login sebagai OWNER dan kembalikan cookie string `tokenAdmin=...`
 */
export async function loginAsOwner(
  email = "owner@example.com",
  password = "owner123",
): Promise<string> {
  const res = await request(app)
    .post("/api/auth/login")
    .send({ identifier: email, password });

  const cookies: string[] = res.headers["set-cookie"] as unknown as string[];
  const tokenCookie = cookies?.find((c: string) => c.startsWith("tokenAdmin="));
  if (!tokenCookie)
    throw new Error("tokenAdmin cookie tidak ditemukan setelah login owner");
  return tokenCookie.split(";")[0];
}

export { prisma };

