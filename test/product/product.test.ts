/**
 * test/product/product.test.ts
 *
 * Skenario Use-Case: PRODUCT
 * ─────────────────────────────────────────────────────
 * UC-PROD-01  GET semua produk (publik) → 200 + array
 * UC-PROD-02  GET satu produk by ID/slug → 200
 * UC-PROD-03  GET produk tidak ditemukan → 404
 * UC-PROD-04  Admin: CREATE produk baru → 201
 * UC-PROD-05  Non-admin CREATE produk → 403
 * UC-PROD-06  Admin: UPDATE produk → 200
 * UC-PROD-07  Admin: DELETE produk → 200
 * UC-PROD-08  DELETE produk yang tidak ada → 404
 */

import request from "supertest";
import app from "../../server.js";
import { prisma, loginAsAdmin } from "../helpers.js";

declare const logResponse: (label: string, status: number, body: unknown) => void;

const BASE = "/api/products";

let adminCookie = "";
let createdProductId = "";

beforeAll(async () => {
  const existing = await prisma.user.findUnique({ where: { email: "admin@example.com" } });
  if (!existing) {
    const bcrypt = await import("bcrypt");
    const hashed = await bcrypt.hash("admin123", 10);
    await prisma.user.create({
      data: { name: "Admin Test", email: "admin@example.com", password: hashed, role: "ADMIN" },
    });
  }
  adminCookie = await loginAsAdmin();
});

afterAll(async () => {
  if (createdProductId) {
    await prisma.product.deleteMany({ where: { id: createdProductId } }).catch(() => null);
  }
  // prisma.$disconnect() dipindah ke test/globalTeardown.ts
});

// ─────────────────────────────────────────────────────────────────────────────
describe("PRODUCT - Read (Public)", () => {
  it("UC-PROD-01: GET semua produk → 200 + array", async () => {
    const res = await request(app).get(BASE);
    logResponse("UC-PROD-01 GET semua produk", res.status, {
      count: Array.isArray(res.body.data) ? res.body.data.length : 0,
      sample: Array.isArray(res.body.data) ? res.body.data[0] : null,
    });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("UC-PROD-03: GET produk tidak ditemukan → 404", async () => {
    const res = await request(app).get(`${BASE}/produk-yang-tidak-ada-xyz`);
    logResponse("UC-PROD-03 Produk tidak ada", res.status, res.body);
    expect(res.status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("PRODUCT - Admin CRUD", () => {
  it("UC-PROD-05: Non-admin CREATE produk → 401/403", async () => {
    const res = await request(app).post(BASE).send({
      name: "Produk Tidak Sah",
      description: "Test",
      basePrice: 50000,
      category: "ROTI",
      stockType: "READY_STOCK",
    });
    logResponse("UC-PROD-05 Non-admin create", res.status, res.body);
    expect([401, 403]).toContain(res.status);
  });

  it("UC-PROD-04: Admin CREATE produk baru → 201", async () => {
    const suffix = Date.now();
    const res = await request(app)
      .post(BASE)
      .set("Cookie", adminCookie)
      .field("name", `Kue Test ${suffix}`)
      .field("description", "Deskripsi kue test")
      .field("basePrice", "75000")
      .field("category", "KECIL")
      .field("stock", "ready")
      .field("variantRasa", "Cokelat")
      .field("sizes", JSON.stringify([{ name: "Standard", price: 75000 }]))
      .field("images", "http://example.com/image.png");

    logResponse("UC-PROD-04 Admin create produk", res.status, res.body.data);
    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty("id");
    createdProductId = res.body.data.id;
  });

  it("UC-PROD-02: GET satu produk by ID → 200", async () => {
    if (!createdProductId) return;
    const res = await request(app).get(`${BASE}/${createdProductId}`);
    logResponse("UC-PROD-02 GET by ID", res.status, res.body.data);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("id", createdProductId);
  });

  it("UC-PROD-06: Admin UPDATE produk → 200", async () => {
    if (!createdProductId) return;
    const res = await request(app)
      .patch(`${BASE}/${createdProductId}`)
      .set("Cookie", adminCookie)
      .field("name", "Kue Test Updated")
      .field("description", "Updated deskripsi")
      .field("basePrice", "80000")
      .field("category", "KECIL")
      .field("stock", "ready");

    logResponse("UC-PROD-06 Admin update", res.status, res.body.data);
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("Kue Test Updated");
  });

  it("UC-PROD-07: Admin DELETE produk → 200", async () => {
    if (!createdProductId) return;
    const res = await request(app)
      .delete(`${BASE}/${createdProductId}`)
      .set("Cookie", adminCookie);
    logResponse("UC-PROD-07 Admin delete", res.status, res.body);
    expect(res.status).toBe(200);
    createdProductId = "";
  });

  it("UC-PROD-08: DELETE produk tidak ada → 404", async () => {
    const res = await request(app)
      .delete(`${BASE}/id-tidak-ada-xyz`)
      .set("Cookie", adminCookie);
    logResponse("UC-PROD-08 Delete tidak ada", res.status, res.body);
    expect(res.status).toBe(404);
  });
});
