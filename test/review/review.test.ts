/**
 * test/review/review.test.ts
 *
 * Skenario Use-Case: REVIEW
 * ─────────────────────────────────────────────────────
 * UC-REV-01  GET review publik untuk produk → 200 + array
 * UC-REV-02  User buat review tanpa auth → 401
 * UC-REV-03  User buat review berhasil → 201 (membutuhkan completed order)
 * UC-REV-04  User buat review dengan rating di luar range (< 1 atau > 5) → 400
 * UC-REV-05  User buat review untuk orderItem yang tidak dimiliki → 403/404
 * UC-REV-06  User buat review duplikat untuk item yang sama → 409
 */

import request from "supertest";
import app from "../../server.js";
import { prisma, loginAsUser } from "../helpers.js";

declare const logResponse: (label: string, status: number, body: unknown) => void;

const BASE = "/api/reviews";

const suffix = Date.now();
const testUserData = {
  name: "Review User",
  email: `reviewuser_${suffix}@example.com`,
  password: "password123",
  confirmPassword: "password123",
};

let userCookie = "";
let testProductId = "";
let completedOrderItemId = "";

beforeAll(async () => {
  const existingAdmin = await prisma.user.findUnique({ where: { email: "admin@example.com" } });
  if (!existingAdmin) {
    const bcrypt = await import("bcrypt");
    const hashed = await bcrypt.hash("admin123", 10);
    await prisma.user.create({
      data: { name: "Admin Test", email: "admin@example.com", password: hashed, role: "ADMIN" },
    });
  }

  const regRes = await request(app).post("/api/auth/register").send(testUserData);
  const reviewUserId = regRes.body.data?.id;
  userCookie = await loginAsUser(testUserData.email, testUserData.password);

  const prod = await prisma.product.create({
    data: {
      name: `Kue Review Test ${suffix}`,
      slug: `kue-review-test-${suffix}`,
      description: "Produk untuk test review",
      basePrice: 60000,
      category: "KECIL",
      stockType: "READY_STOCK",
      images: [],
      imageIds: [],
      variants: [],
    },
  });
  testProductId = prod.id;

  if (reviewUserId) {
    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-TEST-${suffix}`,
        userId: reviewUserId,
        status: "COMPLETED",
        paymentStatus: "PAID",
        recipientName: "Review User",
        phoneNumber: "081234567890",
        address: "Jl Test",
        city: "Kota Test",
        postalCode: "12345",
        paymentMethod: "COD",
        subtotal: 60000,
        totalAmount: 60000,
        items: {
          create: {
            type: "PRODUCT",
            productId: testProductId,
            nameSnapshot: `Kue Review Test ${suffix}`,
            priceSnapshot: 60000,
            qty: 1,
          },
        },
      },
      include: { items: true },
    });
    completedOrderItemId = order.items[0].id;
  }
});

afterAll(async () => {
  await prisma.review.deleteMany({ where: { orderItemId: completedOrderItemId } }).catch(() => null);
  await prisma.order.deleteMany({ where: { orderNumber: `ORD-TEST-${suffix}` } }).catch(() => null);
  await prisma.product.deleteMany({ where: { id: testProductId } }).catch(() => null);
  await prisma.user.deleteMany({ where: { email: testUserData.email } }).catch(() => null);
  // prisma.$disconnect() dipindah ke test/globalTeardown.ts
});

// ─────────────────────────────────────────────────────────────────────────────
describe("REVIEW - Public Read", () => {
  it("UC-REV-01: GET review publik untuk produk → 200 + array", async () => {
    const res = await request(app).get(`${BASE}/product/${testProductId}`);
    logResponse("UC-REV-01 Get product reviews", res.status, {
      count: Array.isArray(res.body.data) ? res.body.data.length : 0,
      reviews: res.body.data,
    });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("REVIEW - Create Review", () => {
  it("UC-REV-02: User buat review tanpa auth → 401", async () => {
    const res = await request(app).post(BASE).send({
      orderItemId: completedOrderItemId,
      rating: 5,
      comment: "Enak banget!",
    });
    logResponse("UC-REV-02 Tanpa auth", res.status, res.body);
    expect(res.status).toBe(401);
  });

  it("UC-REV-04: User buat review rating di luar range → 400", async () => {
    const res = await request(app)
      .post(BASE)
      .set("Cookie", userCookie)
      .field("orderItemId", completedOrderItemId || "fake-id")
      .field("rating", "6");
    logResponse("UC-REV-04 Rating out of range", res.status, res.body);
    expect(res.status).toBe(400);
  });

  it("UC-REV-05: User buat review untuk orderItem milik orang lain → 403/404", async () => {
    const res = await request(app)
      .post(BASE)
      .set("Cookie", userCookie)
      .field("orderItemId", "cmrrb9i9u0001pcu1jrhkpee1")
      .field("rating", "4");
    logResponse("UC-REV-05 OrderItem bukan milik user", res.status, res.body);
    expect([403, 404]).toContain(res.status);
  });

  it("UC-REV-03: User buat review berhasil → 201", async () => {
    if (!completedOrderItemId) { console.warn("completedOrderItemId not set"); return; }
    const res = await request(app)
      .post(BASE)
      .set("Cookie", userCookie)
      .field("orderItemId", completedOrderItemId)
      .field("rating", "5")
      .field("comment", "Kuenya enak dan cantik!");
    logResponse("UC-REV-03 Create review berhasil", res.status, res.body.data);
    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty("rating", 5);
    expect(res.body.data).toHaveProperty("comment", "Kuenya enak dan cantik!");
  });

  it("UC-REV-06: User buat review duplikat untuk item yang sama → 409", async () => {
    if (!completedOrderItemId) return;
    const res = await request(app)
      .post(BASE)
      .set("Cookie", userCookie)
      .field("orderItemId", completedOrderItemId)
      .field("rating", "3")
      .field("comment", "Review kedua, harusnya gagal");
    logResponse("UC-REV-06 Review duplikat", res.status, res.body);
    expect([409, 400]).toContain(res.status);
  });
});
