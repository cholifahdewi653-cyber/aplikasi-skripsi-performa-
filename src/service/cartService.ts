import { prisma } from "../lib/prisma";
import { ForbiddenError, NotFoundError, ValidationError } from "../error/error";
import { addToCartSchema } from "../schema/cartSchema";
import * as z from "zod";

// Helper to calculate discounted price
const calculateProductPrice = (product: any, size: any) => {
  let price = size ? size.price : product.basePrice;
  if (product.hasDiscount && product.discountValue) {
    if (product.discountType === "PERCENTAGE") {
      price = Math.max(0, price - (price * product.discountValue) / 100);
    } else if (product.discountType === "FIXED") {
      price = Math.max(0, price - product.discountValue);
    }
  }
  return price;
};

// ─── Service Functions ────────────────────────────────────────────────────────
export const getAllCartService = async (userId: string) => {
  const cartItems = await prisma.cartItem.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      product: true,
      productSize: true,
      customCake: {
        include: {
          baseCake: true,
          tipeCream: true,
          warnaCream: true,
          topper: true,
          lilin: true,
          layers: {
            include: {
              layer: true,
              size: true,
            },
          },
          toppings: {
            include: {
              topping: true,
            },
          },
        },
      },
    },
  });

  const enriched = cartItems.map((item) => {
    let finalPrice = 0;

    if (item.type === "PRODUCT" && item.product) {
      finalPrice = calculateProductPrice(item.product, item.productSize);
    } else if (item.type === "CUSTOM_CAKE" && item.customCake) {
      finalPrice = item.customCake.totalPrice;
    }

    return {
      ...item,
      finalPrice,
      subtotal: finalPrice * item.qty,
    };
  });

  const totalItems = enriched.reduce((acc, i) => acc + i.qty, 0);
  const grandTotal = enriched.reduce((acc, i) => acc + i.subtotal, 0);

  return { cartItems: enriched, summary: { totalItems, grandTotal } };
};

export const addToCartService = async (
  userId: string,
  body: z.infer<typeof addToCartSchema>,
) => {
  const { type, productId, productSizeId, customCakeId, rasa, qty } = body;

  if (type === "PRODUCT") {
    if (!productId)
      throw new ValidationError({
        productId: ["productId wajib diisi untuk type PRODUCT"],
      });

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, isPublished: true },
    });

    if (!product || !product.isPublished) {
      throw new NotFoundError("Produk");
    }

    if (productSizeId) {
      const size = await prisma.productSize.findUnique({
        where: { id: productSizeId },
        select: { productId: true, status: true },
      });

      if (!size || size.productId !== productId || !size.status) {
        throw new ValidationError({
          productSizeId: ["Ukuran tidak valid untuk produk ini"],
        });
      }
    }

    const existing = await prisma.cartItem.findFirst({
      where: {
        userId,
        type: "PRODUCT",
        productId,
        productSizeId: productSizeId ?? null,
        rasa: rasa ?? null,
      },
    });

    let cartItem;
    let isUpdate = false;

    if (existing) {
      cartItem = await prisma.cartItem.update({
        where: { id: existing.id },
        data: { qty: existing.qty + qty },
      });
      isUpdate = true;
    } else {
      cartItem = await prisma.cartItem.create({
        data: {
          userId,
          type: "PRODUCT",
          productId,
          productSizeId: productSizeId ?? null,
          rasa: rasa ?? null,
          qty,
        },
      });
    }

    return { cartItem, isUpdate };
  } else {
    // CUSTOM_CAKE
    if (!customCakeId)
      throw new ValidationError({
        customCakeId: ["customCakeId wajib diisi untuk type CUSTOM_CAKE"],
      });

    const customCake = await prisma.customCake.findUnique({
      where: { id: customCakeId },
    });

    if (!customCake) {
      throw new NotFoundError("Custom Cake");
    }

    // Check if custom cake already exists in cart for this user
    const existing = await prisma.cartItem.findUnique({
      where: { customCakeId },
    });

    if (existing && existing.userId !== userId) {
      throw new ForbiddenError("Custom cake ini milik pengguna lain");
    }

    let cartItem;
    let isUpdate = false;

    if (existing) {
      cartItem = await prisma.cartItem.update({
        where: { id: existing.id },
        data: { qty: existing.qty + qty },
      });
      isUpdate = true;
    } else {
      cartItem = await prisma.cartItem.create({
        data: {
          userId,
          type: "CUSTOM_CAKE",
          customCakeId,
          qty,
        },
      });
    }

    return { cartItem, isUpdate };
  }
};

export const deleteCartService = async (userId: string, cartItemId: string) => {
  const cartItem = await prisma.cartItem.findUnique({
    where: { id: cartItemId },
  });

  if (!cartItem) throw new NotFoundError("Item cart");

  if (cartItem.userId !== userId) throw new ForbiddenError();

  await prisma.cartItem.delete({ where: { id: cartItemId } });
};
