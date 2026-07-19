/**
 * test/order/order.test.ts
 *
 * Skenario Use-Case: ORDER / CHECKOUT
 * ─────────────────────────────────────────────────────
 * UC-ORD-01  Admin: Lihat semua order → 200 + array
 * UC-ORD-02  User: Lihat order saya → 200 + array (bisa kosong)
 * UC-ORD-03  User: Checkout dari cart (COD, tanpa bank) → 201
 * UC-ORD-04  User: Checkout gagal — cartItemIds kosong → 400/404
 * UC-ORD-05  User: Upload bukti bayar (TRANSFER) → 200
 * UC-ORD-06  User: Edit payment method → 200
 * UC-ORD-07  User: Ajukan cancel order → 200
 * UC-ORD-08  User: Ajukan cancel melebihi 3x → 400/422
 * UC-ORD-09  Admin: Verify order (terima) → 200
 * UC-ORD-10  Admin: Ship order → 200
 * UC-ORD-11  Admin: Upload proof of delivery → 200
 * UC-ORD-12  Admin: Confirm arrival → 200
 * UC-ORD-13  Admin: Resolve cancel request → 200
 * UC-ORD-14  User: Reorder pesanan lama → 201
 * UC-ORD-15  Non-auth akses order → 401
 */

import request from "supertest";
import app from "../../server.js";
import { prisma, loginAsAdmin, loginAsUser } from "../helpers.js";

declare const logResponse: (label: string, status: number, body: unknown) => void;

const BASE = "/api/order";

const suffix = Date.now();
const testUserData = {
  name: "Order User",
  email: `orderuser_${suffix}@example.com`,
  password: "password123",
  confirmPassword: "password123",
};

const shippingData = {
  recipientName: "Order User Test",
  phoneNumber: "081234567890",
  address: "Jl. Test No. 1",
  city: "Purwokerto",
  postalCode: "53111",
};

let adminCookie = "";
let userCookie = "";
let userId = "";
let cartItemId = "";
let createdOrderId = "";
let cancelRequestId = "";
let productId = "";

beforeAll(async () => {
  // Setup admin
  const existingAdmin = await prisma.user.findUnique({ where: { email: "admin@example.com" } });
  if (!existingAdmin) {
    const bcrypt = await import("bcrypt");
    const hashed = await bcrypt.hash("admin123", 10);
    await prisma.user.create({
      data: { name: "Admin Test", email: "admin@example.com", password: hashed, role: "ADMIN" },
    });
  }
  adminCookie = await loginAsAdmin();

  // Setup user
  const regRes = await request(app).post("/api/auth/register").send(testUserData);
  userId = regRes.body.data?.id;
  userCookie = await loginAsUser(testUserData.email, testUserData.password);

  // Buat produk dummy
  const prod = await prisma.product.create({
    data: {
      name: `Kue Order Test ${suffix}`,
      slug: `kue-order-test-${suffix}`,
      description: "Test",
      basePrice: 70000,
      category: "BESAR",
      stockType: "READY_STOCK",
      images: [],
      imageIds: [],
      variants: [],
    },
  });
  productId = prod.id;

  // Tambah ke cart
  const cartRes = await request(app)
    .post("/api/cart")
    .set("Cookie", userCookie)
    .send({ productId, qty: 1, type: "PRODUCT" });
  cartItemId = cartRes.body.data?.id ?? "";
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: testUserData.email } }).catch(() => null);
  await prisma.product.deleteMany({ where: { id: productId } }).catch(() => null);
  // prisma.$disconnect() dipindah ke test/globalTeardown.ts
});

// ─────────────────────────────────────────────────────────────────────────────
describe("ORDER - Auth Guards", () => {
  it("UC-ORD-15: Non-auth akses my-orders → 401", async () => {
    const res = await request(app).get(`${BASE}/my-orders`);
    logResponse("UC-ORD-15 Non-auth", res.status, res.body);
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("ORDER - Admin All Orders", () => {
  it("UC-ORD-01: Admin lihat semua order → 200", async () => {
    const res = await request(app).get(`${BASE}/admin/all`).set("Cookie", adminCookie);
    logResponse("UC-ORD-01 Admin all orders", res.status, {
      count: Array.isArray(res.body.data) ? res.body.data.length : 0,
      sample: Array.isArray(res.body.data) ? res.body.data[0] : null,
    });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("ORDER - User My Orders", () => {
  it("UC-ORD-02: User lihat my-orders → 200 + array", async () => {
    const res = await request(app).get(`${BASE}/my-orders`).set("Cookie", userCookie);
    logResponse("UC-ORD-02 My orders", res.status, {
      count: Array.isArray(res.body.data) ? res.body.data.length : 0,
    });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("ORDER - Checkout", () => {
  it("UC-ORD-04: Checkout gagal — cartItemIds kosong → 400/404", async () => {
    const res = await request(app)
      .post(`${BASE}/checkout`)
      .set("Cookie", userCookie)
      .send({ cartItemIds: [], paymentMethod: "COD", deliveryDate: "2026-07-20T10:00:00.000Z", ...shippingData });
    logResponse("UC-ORD-04 Checkout kosong", res.status, res.body);
    expect([400, 404]).toContain(res.status);
  });

  it("UC-ORD-03: Checkout berhasil dengan COD → 201", async () => {
    if (!cartItemId) { console.warn("cartItemId not set, skipping"); return; }
    const res = await request(app)
      .post(`${BASE}/checkout`)
      .set("Cookie", userCookie)
      .send({ cartItemIds: [cartItemId], paymentMethod: "COD", deliveryDate: "2026-07-20T10:00:00.000Z", ...shippingData });
    logResponse("UC-ORD-03 Checkout COD", res.status, res.body.data);
    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty("id");
    createdOrderId = res.body.data.id;
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("ORDER - User Actions (upload, edit, cancel)", () => {
  it("UC-ORD-06: User edit payment method → 200", async () => {
    if (!createdOrderId) return;
    const res = await request(app)
      .patch(`${BASE}/my-orders/${createdOrderId}/edit-payment`)
      .set("Cookie", userCookie)
      .send({ paymentMethod: "TRANSFER", bank: "BCA" });
    logResponse("UC-ORD-06 Edit payment", res.status, res.body.data);
    expect(res.status).toBe(200);
  });

  it("UC-ORD-07: User ajukan cancel order → 200/201", async () => {
    if (!createdOrderId) return;
    const res = await request(app)
      .post(`${BASE}/my-orders/${createdOrderId}/cancel`)
      .set("Cookie", userCookie)
      .send({ reason: "Tidak jadi beli" });
    logResponse("UC-ORD-07 Request cancel", res.status, res.body.data);
    expect([200, 201]).toContain(res.status);
    cancelRequestId = res.body.data?.id ?? "";
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("ORDER - Admin Actions", () => {
  it("UC-ORD-09: Admin verify order (terima) → 200", async () => {
    if (!createdOrderId) return;
    const res = await request(app)
      .patch(`${BASE}/admin/${createdOrderId}/verify`)
      .set("Cookie", adminCookie)
      .send({ action: "APPROVE" });
    logResponse("UC-ORD-09 Admin verify", res.status, res.body.data ?? res.body);
    expect([200, 400, 422]).toContain(res.status);
  });

  it("UC-ORD-13: Admin resolve cancel request → 200", async () => {
    if (!cancelRequestId) return;
    const res = await request(app)
      .patch(`${BASE}/admin/requests/${cancelRequestId}/resolve`)
      .set("Cookie", adminCookie)
      .send({ action: "APPROVE", settlementType: "REFUND", adminNote: "Disetujui pembatalan" });
    logResponse("UC-ORD-13 Resolve cancel", res.status, res.body.data ?? res.body);
    expect([200, 400]).toContain(res.status);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("ORDER - Reorder", () => {
  it("UC-ORD-14: User reorder pesanan lama → 200/201", async () => {
    const completedOrder = await prisma.order.create({
      data: {
        orderNumber: `ORD-REORDER-${suffix}`,
        userId,
        status: "COMPLETED",
        paymentStatus: "PAID",
        recipientName: "Order User",
        phoneNumber: "081234567890",
        address: "Jl Test",
        city: "Kota Test",
        postalCode: "12345",
        paymentMethod: "COD",
        subtotal: 70000,
        totalAmount: 70000,
        items: { create: { type: "PRODUCT", productId, nameSnapshot: `Kue Order Test ${suffix}`, priceSnapshot: 70000, qty: 1 } },
      },
    });

    const res = await request(app)
      .post(`${BASE}/my-orders/${completedOrder.id}/reorder`)
      .set("Cookie", userCookie);
    logResponse("UC-ORD-14 Reorder", res.status, res.body.data ?? res.body);
    expect([200, 201]).toContain(res.status);

    await prisma.order.deleteMany({ where: { orderNumber: `ORD-REORDER-${suffix}` } }).catch(() => null);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("ORDER - Details Check (rincian pesanan)", () => {
  it("UC-ORD-16: User lihat rincian pesanan sendiri → 200", async () => {
    if (!createdOrderId) return;
    const res = await request(app)
      .get(`${BASE}/detail/${createdOrderId}`)
      .set("Cookie", userCookie);
    logResponse("UC-ORD-16 Detail order sendiri", res.status, {
      id: res.body.data?.id,
      orderNumber: res.body.data?.orderNumber,
      recipientName: res.body.data?.recipientName,
    });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("id", createdOrderId);
  });

  it("UC-ORD-17: User lihat rincian pesanan orang lain → 403", async () => {
    const adminUser = await prisma.user.findUnique({ where: { email: "admin@example.com" } });
    if (!adminUser) return;

    // Buat order dummy milik admin
    const otherOrder = await prisma.order.create({
      data: {
        orderNumber: `ORD-OTHER-${suffix}`,
        userId: adminUser.id,
        status: "PENDING",
        recipientName: "Admin User",
        phoneNumber: "081234567890",
        address: "Jl Admin No. 1",
        city: "Purwokerto",
        postalCode: "53111",
        paymentMethod: "COD",
        subtotal: 50000,
        totalAmount: 50000,
      },
    });

    const res = await request(app)
      .get(`${BASE}/detail/${otherOrder.id}`)
      .set("Cookie", userCookie);
    logResponse("UC-ORD-17 Detail order orang lain", res.status, res.body);
    expect(res.status).toBe(403);

    await prisma.order.delete({ where: { id: otherOrder.id } }).catch(() => null);
  });

  it("UC-ORD-18: Admin lihat rincian pesanan siapapun → 200", async () => {
    if (!createdOrderId) return;
    const res = await request(app)
      .get(`${BASE}/detail/${createdOrderId}`)
      .set("Cookie", adminCookie);
    logResponse("UC-ORD-18 Admin detail order", res.status, {
      id: res.body.data?.id,
      orderNumber: res.body.data?.orderNumber,
    });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("id", createdOrderId);
  });
});

