import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

import {
  createOrderSchema,
  updateOrderStatusSchema,
} from "../schema/orderSchema";
import { ZodError } from "zod";

// ======================================
// USER CHECKOUT -> CART MENJADI ORDER
// ======================================
export const createOrder = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const userId = req.user.id;
    const body = createOrderSchema.parse(req.body);

    // ===============================
    // ADDRESS FINAL
    // ===============================
    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: {
        address: true,
        city: true,
        postalCode: true,
      },
    });

    const finalAddress =
      body.shippingAddress ||
      (profile?.address
        ? `${profile.address}, ${profile.city ?? ""}, ${profile.postalCode ?? ""}`
        : null);

    if (!finalAddress) {
      return res.status(400).json({
        success: false,
        message: "Alamat pengiriman wajib diisi",
      });
    }

    // ===============================
    // MODE CART / DIRECT
    // ===============================
    let checkoutItems: {
      productId: string;
      quantity: number;
      variantId?: string | null;
      sizeId?: string | null;
    }[] = [];

    let deleteCartIds: string[] = [];

    // MODE 1 = CART
    if (body.cartItemIds?.length) {
      const cartItems = await prisma.cartItem.findMany({
        where: {
          id: { in: body.cartItemIds },
          userId,
        },
      });

      if (!cartItems.length) {
        return res.status(400).json({
          success: false,
          message: "Cart item tidak ditemukan",
        });
      }

      checkoutItems = cartItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        variantId: item.variantId,
        sizeId: item.sizeId,
      }));

      deleteCartIds = cartItems.map((item) => item.id);
    }

    // MODE 2 = DIRECT CHECKOUT
    else if (body.items?.length) {
      checkoutItems = body.items;
    }

    // tidak ada input
    else {
      return res.status(400).json({
        success: false,
        message: "Pilih cartItemIds atau items",
      });
    }

    // ===============================
    // HITUNG TOTAL + VALIDASI
    // ===============================
    let totalAmount = 0;

    const finalItems: {
      productId: string;
      name: string;
      quantity: number;
      price: number;
    }[] = [];

    for (const item of checkoutItems) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product || !product.isPublished) {
        return res.status(400).json({
          success: false,
          message: "Produk tidak valid",
        });
      }

      const [variant, size] = await Promise.all([
        item.variantId
          ? prisma.variants.findUnique({
              where: { id: item.variantId },
            })
          : null,

        item.sizeId
          ? prisma.size.findUnique({
              where: { id: item.sizeId },
            })
          : null,
      ]);

      if (size && size.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Stok size ${size.label} tidak cukup`,
        });
      }

      const finalPrice =
        product.basePrice +
        (variant?.priceAdjust ?? 0) +
        (size?.priceAdjust ?? 0);

      const subtotal = finalPrice * item.quantity;

      totalAmount += subtotal;

      finalItems.push({
        productId: item.productId,
        name: product.name,
        quantity: item.quantity,
        price: finalPrice,
      });
    }

    // ===============================
    // TRANSACTION
    // ===============================
    const order = await prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          userId,
          orderNumber: `ORD-${Date.now()}`,
          shippingAddress: finalAddress,
          totalAmount,
          status: "PENDING",

          items: {
            create: finalItems,
          },

          logs: {
            create: {
              status: "PENDING",
              note: "Order dibuat oleh user",
            },
          },
        },
        include: {
          items: true,
          logs: true,
        },
      });

      // kurangi stok
      for (const item of checkoutItems) {
        if (item.sizeId) {
          await tx.size.update({
            where: { id: item.sizeId },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          });
        }
      }

      // hapus cart jika mode cart
      if (deleteCartIds.length) {
        await tx.cartItem.deleteMany({
          where: {
            id: { in: deleteCartIds },
            userId,
          },
        });
      }

      return createdOrder;
    });

    return res.status(201).json({
      success: true,
      message: "Checkout berhasil",
      data: order,
    });
  } catch (error: unknown) {
    console.error(error);

    if (error instanceof ZodError) {
      return res.status(422).json({
        success: false,
        message: "Validasi gagal",
        errors: error.issues,
      });
    }

    if (error instanceof Error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
// ======================================
// USER LIHAT ORDER SENDIRI
// ======================================
export const getMyOrders = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const userId = req.user.id;

    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        items: true,
        logs: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json({
      success: true,
      data: orders,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================
// ADMIN LIHAT SEMUA ORDER
// ======================================
export const getAllOrders = async (req: Request, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: true,
        logs: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json({
      success: true,
      data: orders,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================
// ADMIN UPDATE STATUS ORDER
// ======================================
export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };

    const body = updateOrderStatusSchema.parse(req.body);

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const checkOrder = await prisma.order.findUnique({
      where: { id },
    });

    if (!checkOrder) {
      return res.status(404).json({
        success: false,
        message: "Order tidak ditemukan",
      });
    }

    const updated = await prisma.order.update({
      where: { id },
      data: {
        status: body.status,

        logs: {
          create: {
            status: body.status,
            note: body.note,
            adminId: req.user.id,
          },
        },
      },
      include: {
        logs: true,
      },
    });

    return res.json({
      success: true,
      message: "Status order berhasil diupdate",
      data: updated,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.errors || error.message,
    });
  }
};
