/**
 * test/cart/cart.test.ts
 *
 * Skenario Use-Case: CART
 * ─────────────────────────────────────────────────────
 * UC-CART-01  Tambah item produk ke keranjang → 201
 * UC-CART-02  Tambah item tanpa autentikasi → 401
 * UC-CART-03  Tambah item produk tidak valid (productId tidak ada) → 404/400
 * UC-CART-04  Lihat isi keranjang → 200 + array
 * UC-CART-05  Hapus item dari keranjang → 200
 * UC-CART-06  Hapus item milik user lain / tidak ada → 403/404
 */

import request from "supertest";
import app from "../../server.js";
import { prisma, loginAsUser } from "../helpers.js";

declare const logResponse: (label: string, status: number, body: unknown) => void;

const BASE = "/api/cart";

const suffix = Date.now();
const testUserData = {
  name: "Cart User",
  email: `cartuser_${suffix}@example.com`,
  password: "password123",
  confirmPassword: "password123",
};

let userCookie = "";
let createdCartItemId = "";
let productId = "";

beforeAll(async () => {
  await request(app).post("/api/auth/register").send(testUserData);
  userCookie = await loginAsUser(testUserData.email, testUserData.password);

  const admin = await prisma.user.findUnique({ where: { email: "admin@example.com" } });
  if (!admin) {
    const bcrypt = await import("bcrypt");
    const hashed = await bcrypt.hash("admin123", 10);
    await prisma.user.create({
      data: { name: "Admin Test", email: "admin@example.com", password: hashed, role: "ADMIN" },
    });
  }

  const existingProduct = await prisma.product.findFirst({ where: { isPublished: true } });
  if (existingProduct) {
    productId = existingProduct.id;
  } else {
    const newProduct = await prisma.product.create({
      data: {
        name: "Kue Cart Test",
        slug: `kue-cart-test-${suffix}`,
        description: "Produk untuk test cart",
        basePrice: 50000,
        category: "KECIL",
        stockType: "READY_STOCK",
        images: [],
        imageIds: [],
        variants: ["Cokelat"],
      },
    });
    productId = newProduct.id;
  }
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: testUserData.email } });
  // prisma.$disconnect() dipindah ke test/globalTeardown.ts
});

// ─────────────────────────────────────────────────────────────────────────────
describe("CART - Add to Cart", () => {
  it("UC-CART-02: Tambah item tanpa autentikasi → 401", async () => {
    const res = await request(app).post(BASE).send({ productId, qty: 1, type: "PRODUCT" });
    logResponse("UC-CART-02 Tanpa auth", res.status, res.body);
    expect(res.status).toBe(401);
  });

  it("UC-CART-01: Tambah item produk ke keranjang → 201", async () => {
    const res = await request(app)
      .post(BASE)
      .set("Cookie", userCookie)
      .send({ productId, qty: 2, type: "PRODUCT", rasa: "Cokelat" });
    logResponse("UC-CART-01 Tambah ke cart", res.status, res.body.data);
    expect([200, 201]).toContain(res.status);
    expect(res.body.data).toHaveProperty("id");
    createdCartItemId = res.body.data.id;
  });

  it("UC-CART-03: Tambah item dengan productId tidak ada → 404/400", async () => {
    const res = await request(app)
      .post(BASE)
      .set("Cookie", userCookie)
      .send({ productId: "id-tidak-ada-xyz", qty: 1, type: "PRODUCT" });
    logResponse("UC-CART-03 ProductId tidak ada", res.status, res.body);
    expect([400, 404]).toContain(res.status);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("CART - Get Cart", () => {
  it("UC-CART-04: Lihat isi keranjang → 200 + array", async () => {
    const res = await request(app).get(BASE).set("Cookie", userCookie);
    logResponse("UC-CART-04 Lihat cart", res.status, {
      itemCount: res.body.data?.cartItems?.length ?? 0,
      items: res.body.data?.cartItems,
    });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.cartItems)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("CART - Delete Cart Item", () => {
  it("UC-CART-05: Hapus item dari keranjang → 200", async () => {
    if (!createdCartItemId) return;
    const res = await request(app)
      .delete(`${BASE}/${createdCartItemId}`)
      .set("Cookie", userCookie);
    logResponse("UC-CART-05 Hapus cart item", res.status, res.body);
    expect(res.status).toBe(200);
  });

  it("UC-CART-06: Hapus item yang tidak ada → 404", async () => {
    const res = await request(app)
      .delete(`${BASE}/cmrrb9i9u0001pcu1jrhkpee1`)
      .set("Cookie", userCookie);
    logResponse("UC-CART-06 Hapus item tidak ada", res.status, res.body);
    expect([403, 404]).toContain(res.status);
  });
});
