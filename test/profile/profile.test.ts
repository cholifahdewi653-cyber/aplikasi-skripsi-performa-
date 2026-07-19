/**
 * test/profile/profile.test.ts
 *
 * Skenario Use-Case: PROFILE
 * ─────────────────────────────────────────────────────
 * UC-PRF-01  Update profil tanpa auth → 401
 * UC-PRF-02  User update profil (nama, nomor HP, alamat) → 200
 * UC-PRF-03  User update profil dengan data parsial → 200
 * UC-PRF-04  Admin update profil sendiri (field adminNotes, department) → 200
 */

import request from "supertest";
import app from "../../server.js";
import { prisma, loginAsAdmin, loginAsUser } from "../helpers.js";

declare const logResponse: (label: string, status: number, body: unknown) => void;

const BASE = "/api/profile";

const suffix = Date.now();
const testUserData = {
  name: "Profile User",
  email: `profileuser_${suffix}@example.com`,
  password: "password123",
  confirmPassword: "password123",
};

let userCookie = "";
let adminCookie = "";

beforeAll(async () => {
  const existingAdmin = await prisma.user.findUnique({ where: { email: "admin@example.com" } });
  if (!existingAdmin) {
    const bcrypt = await import("bcrypt");
    const hashed = await bcrypt.hash("admin123", 10);
    await prisma.user.create({
      data: { name: "Admin Test", email: "admin@example.com", password: hashed, role: "ADMIN" },
    });
  }
  adminCookie = await loginAsAdmin();
  await request(app).post("/api/auth/register").send(testUserData);
  userCookie = await loginAsUser(testUserData.email, testUserData.password);
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: testUserData.email } }).catch(() => null);
  // prisma.$disconnect() dipindah ke test/globalTeardown.ts
});

// ─────────────────────────────────────────────────────────────────────────────
describe("PROFILE - Auth Guard", () => {
  it("UC-PRF-01: Update profil tanpa auth → 401", async () => {
    const res = await request(app).patch(`${BASE}/update-profile`).field("name", "Unauthorized User");
    logResponse("UC-PRF-01 Tanpa auth", res.status, res.body);
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("PROFILE - User Update Profile", () => {
  it("UC-PRF-02: User update profil lengkap → 200", async () => {
    const res = await request(app)
      .patch(`${BASE}/update-profile`)
      .set("Cookie", userCookie)
      .field("name", "Updated Profile User")
      .field("phoneNumber", "081298765432")
      .field("address", "Jl. Baru No. 2")
      .field("city", "Semarang")
      .field("postalCode", "50123")
      .field("jenisKelamin", "PEREMPUAN");
    logResponse("UC-PRF-02 Update profil lengkap", res.status, res.body.data);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("phoneNumber", "081298765432");
    expect(res.body.data).toHaveProperty("city", "Semarang");
  });

  it("UC-PRF-03: User update profil parsial (hanya city) → 200", async () => {
    const res = await request(app)
      .patch(`${BASE}/update-profile`)
      .set("Cookie", userCookie)
      .field("city", "Yogyakarta");
    logResponse("UC-PRF-03 Update parsial city", res.status, res.body.data);
    expect(res.status).toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("PROFILE - Admin Update Profile", () => {
  it("UC-PRF-04: Admin update profil dengan field admin → 200", async () => {
    const res = await request(app)
      .patch(`${BASE}/update-profile`)
      .set("Cookie", adminCookie)
      .field("department", "Operasional")
      .field("adminNotes", "Admin aktif");
    logResponse("UC-PRF-04 Admin update profil", res.status, res.body.data);
    expect(res.status).toBe(200);
  });
});
