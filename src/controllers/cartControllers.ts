import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { addToCartSchema, deleteCartItemSchema } from "../schema/cartSchema";

// GET /api/cart
export const getAllCart = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const userId = req.user.id;

    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            images: true,
            basePrice: true,
            pricingType: true,
            isPublished: true,
          },
        },
      },
    });

    const enriched = await Promise.all(
      cartItems.map(async (item) => {
        const [variant, size] = await Promise.all([
          item.variantId
            ? prisma.variants.findUnique({
                where: { id: item.variantId },
                select: { id: true, name: true, priceAdjust: true },
              })
            : null,
          item.sizeId
            ? prisma.size.findUnique({
                where: { id: item.sizeId },
                select: {
                  id: true,
                  label: true,
                  priceAdjust: true,
                  stock: true,
                },
              })
            : null,
        ]);

        const finalPrice =
          item.product.basePrice +
          (variant?.priceAdjust ?? 0) +
          (size?.priceAdjust ?? 0);

        return {
          ...item,
          variant,
          size,
          finalPrice,
          subtotal: finalPrice * item.quantity,
        };
      }),
    );

    const totalItems = enriched.reduce((acc, i) => acc + i.quantity, 0);
    const grandTotal = enriched.reduce((acc, i) => acc + i.subtotal, 0);

    return res.status(200).json({
      success: true,
      data: {
        cartItems: enriched,
        summary: { totalItems, grandTotal },
      },
    });
  } catch (error) {
    console.error("[getAllCart]", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

// POST /api/cart
export const addToCart = async (req: Request, res: Response) => {
  try {
    const parsed = addToCartSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(422).json({
        success: false,
        message: "Validasi gagal",
        errors: parsed.error.issues.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      });
    }

    const { productId, quantity, variantId, sizeId } = parsed.data;
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const userId = req.user.id;

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, isPublished: true },
    });

    if (!product || !product.isPublished) {
      return res
        .status(404)
        .json({ success: false, message: "Produk tidak ditemukan" });
    }

    if (sizeId) {
      const size = await prisma.size.findUnique({
        where: { id: sizeId },
        select: { stock: true, productId: true },
      });

      if (!size || size.productId !== productId) {
        return res.status(400).json({
          success: false,
          message: "Size tidak valid untuk produk ini",
        });
      }

      if (size.stock < quantity) {
        return res.status(400).json({
          success: false,
          message: `Stok tidak cukup. Tersedia: ${size.stock}`,
        });
      }
    }

    if (variantId) {
      const variant = await prisma.variants.findUnique({
        where: { id: variantId },
        select: { productId: true },
      });

      if (!variant || variant.productId !== productId) {
        return res.status(400).json({
          success: false,
          message: "Variant tidak valid untuk produk ini",
        });
      }
    }

    const existing = await prisma.cartItem.findFirst({
      where: {
        userId,
        productId,
        variantId: variantId ?? null,
        sizeId: sizeId ?? null,
      },
    });

    let cartItem;

    if (existing) {
      cartItem = await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + quantity },
      });
    } else {
      cartItem = await prisma.cartItem.create({
        data: { userId, productId, quantity, variantId, sizeId },
      });
    }

    return res.status(200).json({
      success: true,
      message: existing
        ? "Quantity cart diperbarui"
        : "Produk berhasil ditambahkan ke cart",
      data: cartItem,
    });
  } catch (error) {
    console.error("[addToCart]", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

// DELETE /api/cart/:cartItemId
export const deleteCart = async (req: Request, res: Response) => {
  try {
    const parsed = deleteCartItemSchema.safeParse(req.params);

    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!parsed.success) {
      return res.status(422).json({
        success: false,
        message: "Validasi gagal",
        errors: parsed.error.issues.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      });
    }

    const { cartItemId } = parsed.data;
    const userId = req.user.id;

    const cartItem = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
    });

    if (!cartItem) {
      return res
        .status(404)
        .json({ success: false, message: "Item cart tidak ditemukan" });
    }

    if (cartItem.userId !== userId) {
      return res.status(403).json({ success: false, message: "Akses ditolak" });
    }

    await prisma.cartItem.delete({ where: { id: cartItemId } });

    return res.status(200).json({
      success: true,
      message: "Item berhasil dihapus dari cart",
    });
  } catch (error) {
    console.error("[deleteCart]", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
