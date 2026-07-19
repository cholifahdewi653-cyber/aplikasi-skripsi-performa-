/**
 * test/dashboard/dashboard.test.ts
 *
 * Skenario Use-Case: DASHBOARD (Task 10)
 * ─────────────────────────────────────────────────────
 * UC-DSH-01  User/Public: GET best-seller products → 200
 * UC-DSH-02  User/Public: GET newest products → 200
 * UC-DSH-03  User/Public: GET products by category → 200
 * UC-DSH-04  Owner: GET owner dashboard (omset, activeOrders, orders30Days) → 200
 * UC-DSH-05  Admin: GET admin dashboard (activeOrders, orders30Days) → 200
 * UC-DSH-06  Non-auth / Regular user: GET owner dashboard → 401/403
 * UC-DSH-07  Non-auth / Regular user: GET admin dashboard → 401/403
 */

import request from "supertest";
import app from "../../server.js";
import { prisma, loginAsAdmin, loginAsOwner, loginAsUser } from "../helpers.js";

declare const logResponse: (
  label: string,
  status: number,
  body: unknown,
) => void;

const suffix = Date.now();
const testCategory = `CategoryTest_${suffix}`;
const testUserData = {
  name: "Dashboard Regular User",
  email: `dashuser_${suffix}@example.com`,
  password: "password123",
  confirmPassword: "password123",
};

let adminCookie = "";
let ownerCookie = "";
let userCookie = "";
let createdProductId = "";
let createdOrderId = "";

beforeAll(async () => {
  // 1. Seed Admin
  const existingAdmin = await prisma.user.findUnique({
    where: { email: "admin@example.com" },
  });
  if (!existingAdmin) {
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
  adminCookie = await loginAsAdmin();

  // 2. Seed Owner
  const existingOwner = await prisma.user.findUnique({
    where: { email: "owner@example.com" },
  });
  if (!existingOwner) {
    const bcrypt = await import("bcrypt");
    const hashed = await bcrypt.hash("owner123", 10);
    await prisma.user.create({
      data: {
        name: "Owner Test",
        email: "owner@example.com",
        password: hashed,
        role: "OWNER",
      },
    });
  }
  ownerCookie = await loginAsOwner();

  // 3. Register & Login Regular User
  const regRes = await request(app)
    .post("/api/auth/register")
    .send(testUserData);
  const userId = regRes.body.data?.id;
  userCookie = await loginAsUser(testUserData.email, testUserData.password);

  // 4. Create a test product
  const product = await prisma.product.create({
    data: {
      name: `Kue Dashboard ${suffix}`,
      slug: `kue-dashboard-${suffix}`,
      description: "Test product for dashboard",
      basePrice: 50000,
      category: testCategory,
      stockType: "READY_STOCK",
      images: [],
      imageIds: [],
      variants: [],
    },
  });
  createdProductId = product.id;

  // 5. Create a completed order to generate best-seller metrics & omset
  if (userId) {
    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-DASH-${suffix}`,
        userId,
        status: "COMPLETED",
        paymentStatus: "PAID",
        recipientName: "Dash User",
        phoneNumber: "081234567890",
        address: "Jl Test",
        city: "Kota Test",
        postalCode: "12345",
        paymentMethod: "COD",
        subtotal: 50000,
        totalAmount: 50000,
        items: {
          create: {
            type: "PRODUCT",
            productId: createdProductId,
            nameSnapshot: `Kue Dashboard ${suffix}`,
            priceSnapshot: 50000,
            qty: 2,
          },
        },
      },
    });
    createdOrderId = order.id;
  }
});

afterAll(async () => {
  if (createdOrderId) {
    await prisma.order
      .deleteMany({ where: { id: createdOrderId } })
      .catch(() => null);
  }
  if (createdProductId) {
    await prisma.product
      .deleteMany({ where: { id: createdProductId } })
      .catch(() => null);
  }
  await prisma.user
    .deleteMany({ where: { email: testUserData.email } })
    .catch(() => null);
  // prisma.$disconnect() dipindah ke test/globalTeardown.ts
});

// ─────────────────────────────────────────────────────────────────────────────
describe("DASHBOARD - User (Public)", () => {
  it("UC-DSH-01: GET best-seller products → 200", async () => {
    const res = await request(app).get("/api/products/best-seller");
    logResponse("UC-DSH-01 Best Seller Products", res.status, {
      count: res.body.data?.length,
      products: res.body.data?.map((p: any) => ({ id: p.id, name: p.name })),
    });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it("UC-DSH-02: GET newest products → 200", async () => {
    const res = await request(app).get("/api/products/newest");
    logResponse("UC-DSH-02 Newest Products", res.status, {
      count: res.body.data?.length,
      products: res.body.data?.map((p: any) => ({ id: p.id, name: p.name })),
    });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it("UC-DSH-03: GET products by category → 200", async () => {
    const res = await request(app).get(
      `/api/products/category/${testCategory}`,
    );
    logResponse("UC-DSH-03 Products By Category", res.status, {
      category: testCategory,
      count: res.body.data?.length,
      products: res.body.data,
    });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].id).toBe(createdProductId);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("DASHBOARD - Owner", () => {
  it("UC-DSH-04: Owner GET owner dashboard (omset, activeOrders, orders30Days) → 200", async () => {
    const res = await request(app)
      .get("/api/dashboard/owner")
      .set("Cookie", ownerCookie);
    logResponse("UC-DSH-04 Owner Dashboard", res.status, {
      omsetLength: res.body.data?.omset?.length,
      activeOrdersCount: res.body.data?.activeOrders?.length,
      orders30DaysCount: res.body.data?.orders30Days?.length,
      sampleOmset: res.body.data?.omset?.slice(-3),
    });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("omset");
    expect(res.body.data).toHaveProperty("activeOrders");
    expect(res.body.data).toHaveProperty("orders30Days");
    expect(Array.isArray(res.body.data.omset)).toBe(true);
    expect(Array.isArray(res.body.data.activeOrders)).toBe(true);
    expect(Array.isArray(res.body.data.orders30Days)).toBe(true);
  });

  it("UC-DSH-06: Regular user GET owner dashboard → 401/403", async () => {
    const res = await request(app)
      .get("/api/dashboard/owner")
      .set("Cookie", userCookie);
    logResponse("UC-DSH-06 User akses Owner Dashboard", res.status, res.body);
    expect([401, 403]).toContain(res.status);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("DASHBOARD - Admin", () => {
  it("UC-DSH-05: Admin GET admin dashboard (activeOrders, orders30Days) → 200", async () => {
    const res = await request(app)
      .get("/api/dashboard/admin")
      .set("Cookie", adminCookie);
    logResponse("UC-DSH-05 Admin Dashboard", res.status, {
      activeOrdersCount: res.body.data?.activeOrders?.length,
      orders30DaysCount: res.body.data?.orders30Days?.length,
    });
    expect(res.status).toBe(200);
    expect(res.body.data).not.toHaveProperty("omset");
    expect(res.body.data).toHaveProperty("activeOrders");
    expect(res.body.data).toHaveProperty("orders30Days");
    expect(Array.isArray(res.body.data.activeOrders)).toBe(true);
    expect(Array.isArray(res.body.data.orders30Days)).toBe(true);
  });

  it("UC-DSH-07: Regular user GET admin dashboard → 401/403", async () => {
    const res = await request(app)
      .get("/api/dashboard/admin")
      .set("Cookie", userCookie);
    logResponse("UC-DSH-07 User akses Admin Dashboard", res.status, res.body);
    expect([401, 403]).toContain(res.status);
  });
});
