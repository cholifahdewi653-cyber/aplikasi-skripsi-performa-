/**
 * test/customCake/customCake.test.ts
 *
 * Skenario Use-Case: CUSTOM CAKE
 * ─────────────────────────────────────────────────────
 * UC-CC-01  GET semua opsi kustomisasi aktif (publik) → 200
 * UC-CC-02  Admin: CREATE opsi BaseCake baru → 201
 * UC-CC-03  Admin: GET semua opsi BaseCake → 200
 * UC-CC-04  Admin: UPDATE opsi BaseCake → 200
 * UC-CC-05  Admin: DELETE opsi BaseCake → 200
 * UC-CC-06  User: ORDER custom cake (with minimal required fields) → 201
 * UC-CC-07  User: GET detail custom cake order → 200
 * UC-CC-08  User: ORDER custom cake tanpa auth → 401
 * UC-CC-09  User: ORDER custom cake dengan referensi ID tidak valid → 404
 */

import request from "supertest";
import app from "../../server.js";
import { prisma, loginAsAdmin, loginAsUser } from "../helpers.js";

declare const logResponse: (label: string, status: number, body: unknown) => void;

const BASE = "/api/custom-cakes";

const suffix = Date.now();
const testUserData = {
  name: "Custom Cake User",
  email: `cakeuser_${suffix}@example.com`,
  password: "password123",
  confirmPassword: "password123",
};

let adminCookie = "";
let userCookie = "";
let createdOptionId = "";
let createdCustomCakeId = "";

let baseCakeId = "";
let tipeCreamId = "";
let warnaCreamId = "";
let layerId = "";
let sizeId = "";

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

  const baseCake = await prisma.baseCake.create({ data: { name: `BaseCake Test ${suffix}`, price: 50000 } });
  baseCakeId = baseCake.id;

  const tipeCream = await prisma.tipeCream.create({ data: { name: `TipeCream Test ${suffix}`, price: 15000 } });
  tipeCreamId = tipeCream.id;

  const warnaCream = await prisma.warnaCream.create({
    data: { name: `WarnaCream Test ${suffix}`, warna: "Merah", hex: `#FF${suffix.toString().slice(-4)}`, price: 10000 },
  });
  warnaCreamId = warnaCream.id;

  const layer = await prisma.layer.create({ data: { name: `Layer Test ${suffix}`, price: 20000 } });
  layerId = layer.id;

  const size = await prisma.size.create({ data: { name: `Size Test ${suffix}`, price: 5000 } });
  sizeId = size.id;
});

afterAll(async () => {
  if (createdCustomCakeId) {
    await prisma.customCake.deleteMany({ where: { id: createdCustomCakeId } }).catch(() => null);
  }
  await prisma.user.deleteMany({ where: { email: testUserData.email } }).catch(() => null);
  await prisma.size.deleteMany({ where: { id: sizeId } }).catch(() => null);
  await prisma.layer.deleteMany({ where: { id: layerId } }).catch(() => null);
  await prisma.warnaCream.deleteMany({ where: { id: warnaCreamId } }).catch(() => null);
  await prisma.tipeCream.deleteMany({ where: { id: tipeCreamId } }).catch(() => null);
  await prisma.baseCake.deleteMany({ where: { id: baseCakeId } }).catch(() => null);
  // prisma.$disconnect() dipindah ke test/globalTeardown.ts
});

// ─────────────────────────────────────────────────────────────────────────────
describe("CUSTOM CAKE - Options (Public)", () => {
  it("UC-CC-01: GET semua opsi kustomisasi aktif → 200", async () => {
    const res = await request(app).get(`${BASE}/all-options`);
    logResponse("UC-CC-01 All options", res.status, {
      baseCakes: res.body.data?.baseCakes?.length,
      layers: res.body.data?.layers?.length,
      tipeCreams: res.body.data?.tipeCreams?.length,
      warnaCreams: res.body.data?.warnaCreams?.length,
      sizes: res.body.data?.sizes?.length,
    });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("baseCakes");
    expect(res.body.data).toHaveProperty("layers");
    expect(res.body.data).toHaveProperty("tipeCreams");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("CUSTOM CAKE - Admin Option CRUD", () => {
  it("UC-CC-02: Admin CREATE opsi BaseCake baru → 201", async () => {
    const res = await request(app)
      .post(`${BASE}/options/base-cake`)
      .set("Cookie", adminCookie)
      .send({ name: `Admin BaseCake ${suffix}`, price: 60000 });
    logResponse("UC-CC-02 Admin create BaseCake", res.status, res.body.data);
    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty("id");
    createdOptionId = res.body.data.id;
  });

  it("UC-CC-03: Admin GET semua opsi BaseCake → 200", async () => {
    const res = await request(app).get(`${BASE}/options/base-cake`).set("Cookie", adminCookie);
    logResponse("UC-CC-03 Get all BaseCake", res.status, { count: Array.isArray(res.body.data) ? res.body.data.length : 0 });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("UC-CC-04: Admin UPDATE opsi BaseCake → 200", async () => {
    if (!createdOptionId) return;
    const res = await request(app)
      .patch(`${BASE}/options/base-cake/${createdOptionId}`)
      .set("Cookie", adminCookie)
      .send({ name: `Updated BaseCake ${suffix}`, price: 65000, status: false });
    logResponse("UC-CC-04 Update BaseCake", res.status, res.body.data);
    expect(res.status).toBe(200);
    expect(res.body.data.price).toBe(65000);
    expect(res.body.data.status).toBe(false);
  });

  it("UC-CC-05: Admin DELETE opsi BaseCake → 200", async () => {
    if (!createdOptionId) return;
    const res = await request(app)
      .delete(`${BASE}/options/base-cake/${createdOptionId}`)
      .set("Cookie", adminCookie);
    logResponse("UC-CC-05 Delete BaseCake", res.status, res.body);
    expect(res.status).toBe(200);
    createdOptionId = "";
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("CUSTOM CAKE - User Order", () => {
  it("UC-CC-08: ORDER custom cake tanpa auth → 401", async () => {
    const res = await request(app).post(`${BASE}/order`).send({
      baseCakeId, tipeCreamId, warnaCreamId, layers: [{ layerId, sizeId, position: 1 }],
    });
    logResponse("UC-CC-08 Tanpa auth", res.status, res.body);
    expect(res.status).toBe(401);
  });

  it("UC-CC-09: ORDER custom cake dengan ID tidak valid → 404", async () => {
    const res = await request(app)
      .post(`${BASE}/order`)
      .set("Cookie", userCookie)
      .send({ baseCakeId: "id-tidak-ada", tipeCreamId, warnaCreamId, layers: [{ layerId, sizeId, position: 1 }] });
    logResponse("UC-CC-09 ID tidak valid", res.status, res.body);
    expect([400, 404]).toContain(res.status);
  });

  it("UC-CC-06: User ORDER custom cake berhasil → 201", async () => {
    const res = await request(app)
      .post(`${BASE}/order`)
      .set("Cookie", userCookie)
      .field("baseCakeId", baseCakeId)
      .field("tipeCreamId", tipeCreamId)
      .field("warnaCreamId", warnaCreamId)
      .field("layers", JSON.stringify([{ layerId, sizeId, position: 1 }]))
      .field("ucapan", "Selamat Ulang Tahun!")
      .field("catatan", "Tolong dibuat manis");
    logResponse("UC-CC-06 Create custom cake order", res.status, res.body.data);
    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty("id");
    createdCustomCakeId = res.body.data.id;
  });

  it("UC-CC-07: User GET detail custom cake order → 200", async () => {
    if (!createdCustomCakeId) return;
    const res = await request(app)
      .get(`${BASE}/order/${createdCustomCakeId}`)
      .set("Cookie", userCookie);
    logResponse("UC-CC-07 Detail custom cake", res.status, res.body.data);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("id", createdCustomCakeId);
    expect(res.body.data).toHaveProperty("baseCake");
  });
});
