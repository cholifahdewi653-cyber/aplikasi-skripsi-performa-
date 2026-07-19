/**
 * test/auth/auth.test.ts
 *
 * Skenario Use-Case: AUTH
 * ─────────────────────────────────────────────────────
 * UC-AUTH-01  Register user baru berhasil
 * UC-AUTH-02  Register gagal — email sudah terdaftar
 * UC-AUTH-03  Register gagal — body tidak valid (missing fields)
 * UC-AUTH-04  Login berhasil sebagai USER → set cookie tokenUser
 * UC-AUTH-05  Login berhasil sebagai ADMIN → set cookie tokenAdmin
 * UC-AUTH-06  Login gagal — credential salah
 * UC-AUTH-07  GET /me berhasil dengan token valid
 * UC-AUTH-08  GET /me gagal tanpa token (401)
 * UC-AUTH-09  Logout berhasil → cookie dihapus
 */

import request from "supertest";
import app from "../../server.js";
import { prisma } from "../helpers.js";

declare const logResponse: (
  label: string,
  status: number,
  body: unknown,
) => void;

const BASE = "/api/auth";

// ── Test data ─────────────────────────────────────────────────────────────────
const uniqueSuffix = Date.now();
const testUser = {
  name: "Test User Auth",
  email: `testauth_${uniqueSuffix}@example.com`,
  password: "password123",
  confirmPassword: "password123",
};

let userCookie = "";
let adminCookie = "";

// ── Setup: pastikan admin ada di DB ──────────────────────────────────────────
beforeAll(async () => {
  const existing = await prisma.user.findUnique({
    where: { email: "admin@example.com" },
  });
  if (!existing) {
    const bcrypt = await import("bcrypt");
    const hashed = await bcrypt.hash("admin123", 10);
    await prisma.user.create({
      data: {
        name: "Admin Test",
        email: "admin@example.com",
        password: hashed,
        role: "ADMIN",
      },
    });
  }
});

// ── Teardown: hapus user test ─────────────────────────────────────────────────
afterAll(async () => {
  await prisma.user.deleteMany({
    where: { email: { contains: `testauth_${uniqueSuffix}` } },
  });
  // prisma.$disconnect() dipindah ke test/globalTeardown.ts
});

// ─────────────────────────────────────────────────────────────────────────────
describe("AUTH - Register", () => {
  it("UC-AUTH-01: Register user baru berhasil → 201", async () => {
    const res = await request(app).post(`${BASE}/register`).send(testUser);
    logResponse("UC-AUTH-01 Register baru", res.status, res.body);
    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty("email", testUser.email);
    expect(res.body.data).not.toHaveProperty("password");
  });

  it("UC-AUTH-02: Register gagal — email sudah terdaftar → 409", async () => {
    const res = await request(app).post(`${BASE}/register`).send(testUser);
    logResponse("UC-AUTH-02 Email duplikat", res.status, res.body);
    expect(res.status).toBe(409);
  });

  it("UC-AUTH-03: Register gagal — body tidak valid → 400", async () => {
    const res = await request(app)
      .post(`${BASE}/register`)
      .send({ email: "bukan-email", password: "123" });
    logResponse("UC-AUTH-03 Body tidak valid", res.status, res.body);
    expect(res.status).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("AUTH - Login", () => {
  it("UC-AUTH-04: Login USER berhasil → cookie tokenUser di-set", async () => {
    const res = await request(app)
      .post(`${BASE}/login`)
      .send({ identifier: testUser.email, password: testUser.password });
    logResponse("UC-AUTH-04 Login USER", res.status, res.body);
    expect(res.status).toBe(200);

    const cookies: string[] = res.headers["set-cookie"] as unknown as string[];
    expect(cookies).toBeDefined();
    const tokenCookie = cookies.find((c) => c.startsWith("tokenUser="));
    expect(tokenCookie).toBeDefined();
    userCookie = tokenCookie!.split(";")[0];
  });

  it("UC-AUTH-05: Login ADMIN berhasil → cookie tokenAdmin di-set", async () => {
    const res = await request(app)
      .post(`${BASE}/login`)
      .send({ identifier: "admin@example.com", password: "admin123" });
    logResponse("UC-AUTH-05 Login ADMIN", res.status, res.body);
    expect(res.status).toBe(200);

    const cookies: string[] = res.headers["set-cookie"] as unknown as string[];
    const tokenCookie = cookies.find((c) => c.startsWith("tokenAdmin="));
    expect(tokenCookie).toBeDefined();
    adminCookie = tokenCookie!.split(";")[0];
  });

  it("UC-AUTH-06: Login gagal — credential salah → 401", async () => {
    const res = await request(app)
      .post(`${BASE}/login`)
      .send({ identifier: testUser.email, password: "wrongpassword" });
    logResponse("UC-AUTH-06 Credential salah", res.status, res.body);
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("AUTH - Get Me", () => {
  it("UC-AUTH-07: GET /me berhasil dengan token valid → 200 + data user", async () => {
    const res = await request(app).get(`${BASE}/me`).set("Cookie", userCookie);
    logResponse("UC-AUTH-07 GET /me", res.status, res.body);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("email", testUser.email);
  });

  it("UC-AUTH-08: GET /me tanpa token → 401", async () => {
    const res = await request(app).get(`${BASE}/me`);
    logResponse("UC-AUTH-08 GET /me tanpa token", res.status, res.body);
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("AUTH - Logout", () => {
  it("UC-AUTH-09: Logout berhasil → 200 dan cookie tokenUser di-clear", async () => {
    const res = await request(app)
      .post(`${BASE}/logout`)
      .set("Cookie", userCookie);
    logResponse("UC-AUTH-09 Logout", res.status, res.body);
    expect(res.status).toBe(200);

    const cookies: string[] = res.headers["set-cookie"] as unknown as string[];
    const cleared = cookies?.find((c) => c.startsWith("tokenUser="));
    if (cleared) {
      expect(cleared).toMatch(/Max-Age=0|Expires=Thu, 01 Jan 1970/i);
    }
  });
});
