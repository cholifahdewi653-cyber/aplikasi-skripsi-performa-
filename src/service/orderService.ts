import { prisma } from "../lib/prisma";
import {
  NotFoundError,
  ValidationError,
  ForbiddenError,
} from "../error/error";
import {
  createOrderSchema,
  updateOrderStatusSchema,
  verifyOrderSchema,
  shipOrderSchema,
  resolveCancelSchema,
  editPaymentSchema,
  requestCancelSchema,
} from "../schema/orderSchema";
import * as z from "zod";
import { uploadToCloudinary } from "../lib/cloudinary";

const ADMIN_FEE = 2500; // Rp 2.500 untuk metode transfer

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

// ─── CHECKOUT ─────────────────────────────────────────────────────────────────
export const createOrderService = async (
  userId: string,
  body: z.infer<typeof createOrderSchema>,
) => {
  // 1. Validasi paymentMethod + bank
  if (body.paymentMethod === "TRANSFER" && !body.bank) {
    throw new ValidationError({ bank: ["Bank wajib diisi jika metode pembayaran Transfer"] });
  }

  // 2. Load user + profile
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });
  if (!user) throw new NotFoundError("User");

  // 3. Determine shipping snapshot
  const recipientName = body.recipientName || user.name;
  const phoneNumber = body.phoneNumber || user.profile?.phoneNumber;
  const address = body.address || user.profile?.address;
  const city = body.city || user.profile?.city;
  const postalCode = body.postalCode || user.profile?.postalCode;

  const errors: Record<string, string[]> = {};
  if (!recipientName) errors.recipientName = ["Nama penerima wajib diisi"];
  if (!phoneNumber) errors.phoneNumber = ["Nomor telepon wajib diisi"];
  if (!address) errors.address = ["Alamat pengiriman wajib diisi"];
  if (!city) errors.city = ["Kota wajib diisi"];
  if (!postalCode) errors.postalCode = ["Kode pos wajib diisi"];
  if (Object.keys(errors).length > 0) throw new ValidationError(errors);

  // 4. Load cart items
  const cartItems = await prisma.cartItem.findMany({
    where: {
      id: { in: body.cartItemIds },
      userId,
    },
    include: {
      product: { include: { sizes: true } },
      productSize: true,
      customCake: true,
    },
  });

  if (cartItems.length === 0) {
    throw new NotFoundError("Cart items");
  }

  if (cartItems.length !== body.cartItemIds.length) {
    throw new ValidationError({ cartItemIds: ["Beberapa cart item tidak ditemukan"] });
  }

  // 5. Calculate subtotal and prepare order items
  let subtotal = 0;
  const orderItemsData: {
    type: "PRODUCT" | "CUSTOM_CAKE";
    productId: string | null;
    productSizeId: string | null;
    customCakeId: string | null;
    nameSnapshot: string;
    priceSnapshot: number;
    qty: number;
  }[] = [];

  for (const item of cartItems) {
    if (item.type === "PRODUCT" && item.product) {
      const priceSnapshot = calculateProductPrice(item.product, item.productSize);
      const sizeName = item.productSize ? ` (${item.productSize.name})` : "";
      const rasaName = (item as any).rasa ? ` - ${(item as any).rasa}` : "";
      const nameSnapshot = `${item.product.name}${sizeName}${rasaName}`;

      subtotal += priceSnapshot * item.qty;
      orderItemsData.push({
        type: "PRODUCT",
        productId: item.productId,
        productSizeId: item.productSizeId,
        customCakeId: null,
        nameSnapshot,
        priceSnapshot,
        qty: item.qty,
      });
    } else if (item.type === "CUSTOM_CAKE" && item.customCake) {
      subtotal += item.customCake.totalPrice * item.qty;
      orderItemsData.push({
        type: "CUSTOM_CAKE",
        productId: null,
        productSizeId: null,
        customCakeId: item.customCakeId,
        nameSnapshot: item.customCake.ucapan
          ? `Custom Cake: "${item.customCake.ucapan}"`
          : "Custom Cake",
        priceSnapshot: item.customCake.totalPrice,
        qty: item.qty,
      });
    }
  }

  // 6. Calculate fees
  const adminFee = body.paymentMethod === "TRANSFER" ? ADMIN_FEE : 0;
  const shippingCost = body.paymentMethod === "PICKUP" ? 0 : 0; // delivery fee default 0 for now
  const totalAmount = subtotal + adminFee + shippingCost;

  // 7. Parse delivery date
  const deliveryDate = new Date(body.deliveryDate);

  // 8. DB Transaction
  const order = await prisma.$transaction(async (tx) => {
    const createdOrder = await tx.order.create({
      data: {
        userId,
        orderNumber: `ORD-${Date.now()}`,
        status: "PENDING",
        paymentStatus: "UNPAID",
        recipientName: recipientName as string,
        phoneNumber: phoneNumber as string,
        address: address as string,
        city: city as string,
        postalCode: postalCode as string,
        notes: body.note || null,
        deliveryDate,
        paymentMethod: body.paymentMethod,
        bank: body.paymentMethod === "TRANSFER" ? body.bank! : null,
        subtotal,
        adminFee,
        shippingCost,
        totalAmount,
        items: {
          create: orderItemsData,
        },
      } as any,
      include: {
        items: true,
      },
    });

    // Delete checked-out cart items
    await tx.cartItem.deleteMany({
      where: {
        id: { in: body.cartItemIds },
        userId,
      },
    });

    return createdOrder;
  });

  return order;
};

// ─── USER: Lihat order sendiri ────────────────────────────────────────────────
export const getMyOrdersService = async (userId: string) => {
  return prisma.order.findMany({
    where: { userId },
    include: {
      items: {
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
            },
          },
        },
      },
      trackings: true,
      paymentSubmissions: true,
      requests: true,
    },
    orderBy: { createdAt: "desc" },
  });
};

// ─── ADMIN: Lihat semua order ─────────────────────────────────────────────────
export const getAllOrdersService = async () => {
  return prisma.order.findMany({
    include: {
      user: { select: { id: true, name: true, email: true } },
      items: {
        include: {
          product: true,
          productSize: true,
          customCake: true,
        },
      },
      trackings: true,
      paymentSubmissions: true,
      requests: true,
    },
    orderBy: { createdAt: "desc" },
  });
};

// ─── ADMIN: Update status order ───────────────────────────────────────────────
export const updateOrderStatusService = async (
  id: string,
  adminId: string,
  body: z.infer<typeof updateOrderStatusSchema>,
) => {
  const checkOrder = await prisma.order.findUnique({ where: { id } });
  if (!checkOrder) throw new NotFoundError("Order");

  const updatedOrder = await prisma.order.update({
    where: { id },
    data: {
      status: body.status,
    },
    include: {
      items: true,
      trackings: true,
    },
  });

  // Map OrderStatus to TrackingStatus
  let trackingStatus: any = null;
  if (body.status === "PROCESSING") trackingStatus = "PACKED";
  else if (body.status === "SHIPPED") trackingStatus = "ON_THE_WAY";
  else if (body.status === "ARRIVED") trackingStatus = "ARRIVED";

  if (trackingStatus) {
    await prisma.orderTracking.create({
      data: {
        orderId: id,
        status: trackingStatus,
        note: body.note || `Status order diubah ke ${body.status}`,
      },
    });
  }

  return updatedOrder;
};

// ─── TASK 7: ADMIN — Verify Order ─────────────────────────────────────────────
export const verifyOrderService = async (
  id: string,
  adminId: string,
  body: z.infer<typeof verifyOrderSchema>,
) => {
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) throw new NotFoundError("Order");

  if (order.status !== "PENDING") {
    throw new ValidationError({ status: ["Hanya pesanan berstatus PENDING yang bisa diverifikasi"] });
  }

  if (body.action === "APPROVE") {
    const updated = await prisma.order.update({
      where: { id },
      data: {
        status: "PROCESSING",
        paymentStatus: (order as any).paymentMethod === "TRANSFER" ? "PAID" : order.paymentStatus,
      } as any,
    });

    await prisma.orderTracking.create({
      data: {
        orderId: id,
        status: "PACKED",
        note: "Pesanan diterima dan mulai diproses",
      },
    });

    return updated;
  } else {
    // REJECT
    const updated = await prisma.order.update({
      where: { id },
      data: {
        status: "REJECTED",
        rejectReason: body.reason || null,
      } as any,
    });

    return updated;
  }
};

// ─── TASK 7: ADMIN — Ship Order ───────────────────────────────────────────────
export const shipOrderService = async (
  id: string,
  adminId: string,
  body: z.infer<typeof shipOrderSchema>,
) => {
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) throw new NotFoundError("Order");

  if (order.status !== "PROCESSING") {
    throw new ValidationError({ status: ["Hanya pesanan berstatus PROCESSING yang bisa dikirim"] });
  }

  const updated = await prisma.order.update({
    where: { id },
    data: {
      status: "SHIPPED",
      expedition: body.expedition,
      resi: body.resi,
    } as any,
  });

  await prisma.orderTracking.create({
    data: {
      orderId: id,
      status: "ON_THE_WAY",
      location: body.expedition,
      note: `Pesanan sedang dikirim via ${body.expedition} dengan nomor resi: ${body.resi}`,
    },
  });

  return updated;
};

// ─── TASK 7: ADMIN — Upload Delivery Proof (Bukti Sampai) ──────────────────────
export const proofDeliveryService = async (
  id: string,
  adminId: string,
  fileBuffer: Buffer,
) => {
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) throw new NotFoundError("Order");

  if (order.status !== "SHIPPED" && order.status !== "PROCESSING") {
    throw new ValidationError({ status: ["Bukti sampai hanya bisa diunggah untuk pesanan berstatus SHIPPED atau PROCESSING"] });
  }

  // Upload ke Cloudinary
  const uploadResult = await uploadToCloudinary({
    fileBuffer,
    folder: "delivery_proof_folder",
  });

  const updated = await prisma.order.update({
    where: { id },
    data: {
      status: "ARRIVED",
      proofOfDelivery: uploadResult.url,
      proofOfDeliveryId: uploadResult.id,
    } as any,
  });

  await prisma.orderTracking.create({
    data: {
      orderId: id,
      status: "ARRIVED",
      note: "Pesanan telah sampai di tujuan. Bukti sampai telah diunggah oleh admin.",
    },
  });

  return updated;
};

// ─── TASK 7: ADMIN — Confirm Arrival ──────────────────────────────────────────
export const confirmArrivalService = async (id: string, adminId: string) => {
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) throw new NotFoundError("Order");

  if (order.status !== "ARRIVED") {
    throw new ValidationError({ status: ["Konfirmasi sampai hanya bisa dilakukan untuk pesanan berstatus ARRIVED"] });
  }

  const updated = await prisma.order.update({
    where: { id },
    data: {
      status: "COMPLETED",
      paymentStatus: "PAID", // otomatis lunas saat selesai
    },
  });

  return updated;
};

// ─── TASK 7: ADMIN — Resolve Cancellation Request ─────────────────────────────
export const resolveCancelService = async (
  requestId: string,
  adminId: string,
  body: z.infer<typeof resolveCancelSchema>,
) => {
  const request = await prisma.orderRequest.findUnique({
    where: { id: requestId },
  });
  if (!request) throw new NotFoundError("Pengajuan pembatalan");

  if (request.type !== "CANCEL" || request.status !== "PENDING") {
    throw new ValidationError({ request: ["Hanya pengajuan pembatalan berstatus PENDING yang bisa di-resolve"] });
  }

  const order = await prisma.order.findUnique({ where: { id: request.orderId } });
  if (!order) throw new NotFoundError("Order");

  if (body.action === "APPROVE") {
    // Setuju pembatalan
    await prisma.orderRequest.update({
      where: { id: requestId },
      data: {
        status: "ACCEPTED",
        settlementType: body.settlementType || "REFUND",
        refundStatus: body.settlementType === "REFUND" ? "COMPLETED" : null,
        refundType: body.refundType || null,
        adminNote: body.adminNote || null,
        processedBy: adminId,
        processedAt: new Date(),
      } as any,
    });

    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "CANCELLED",
      },
    });

    return { order: updatedOrder, requestStatus: "ACCEPTED" };
  } else {
    // Tolak pembatalan (wajib alasan)
    if (!body.adminNote || body.adminNote.trim() === "") {
      throw new ValidationError({ adminNote: ["Alasan penolakan pembatalan wajib diisi"] });
    }

    await prisma.orderRequest.update({
      where: { id: requestId },
      data: {
        status: "REJECTED",
        adminNote: body.adminNote,
        processedBy: adminId,
        processedAt: new Date(),
      },
    });

    return { order, requestStatus: "REJECTED" };
  }
};

// ─── TASK 8: USER — Upload Payment Proof ──────────────────────────────────────
export const uploadPaymentProofService = async (
  orderId: string,
  userId: string,
  fileBuffer: Buffer,
) => {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new NotFoundError("Order");
  if (order.userId !== userId) throw new ValidationError({ order: ["Pesanan tidak valid untuk user ini"] });

  if (order.status !== "PENDING" || (order as any).paymentMethod !== "TRANSFER") {
    throw new ValidationError({ order: ["Bukti transfer hanya bisa diunggah untuk order PENDING bermetode TRANSFER"] });
  }

  // Upload ke Cloudinary
  const uploadResult = await uploadToCloudinary({
    fileBuffer,
    folder: "payment_submission_folder",
  });

  // Buat record PaymentSubmission
  const submission = await prisma.paymentSubmission.create({
    data: {
      orderId,
      paymentMethod: `TRANSFER ${(order as any).bank || ""}`.trim(),
      proofUrl: uploadResult.url,
      proofId: uploadResult.id,
      status: "UNPAID", // menunggu verifikasi admin
    },
  });

  return submission;
};

// ─── TASK 8: USER — Edit Payment ──────────────────────────────────────────────
export const editPaymentService = async (
  orderId: string,
  userId: string,
  body: z.infer<typeof editPaymentSchema>,
) => {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new NotFoundError("Order");
  if (order.userId !== userId) throw new ValidationError({ order: ["Pesanan tidak valid untuk user ini"] });

  if (order.status !== "PENDING" || order.paymentStatus !== "UNPAID") {
    throw new ValidationError({ order: ["Edit pembayaran hanya bisa dilakukan pada pesanan Belum Bayar (PENDING)"] });
  }

  const newAdminFee = body.paymentMethod === "TRANSFER" ? ADMIN_FEE : 0;
  const newTotal = order.subtotal + newAdminFee + order.shippingCost;

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      paymentMethod: body.paymentMethod,
      bank: body.paymentMethod === "TRANSFER" ? body.bank! : null,
      adminFee: newAdminFee,
      totalAmount: newTotal,
    } as any,
  });

  return updated;
};

// ─── TASK 8: USER — Request Cancel Order ──────────────────────────────────────
export const requestCancelService = async (
  orderId: string,
  userId: string,
  body: z.infer<typeof requestCancelSchema>,
) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { requests: true },
  });
  if (!order) throw new NotFoundError("Order");
  if (order.userId !== userId) throw new ValidationError({ order: ["Pesanan tidak valid untuk user ini"] });

  if (order.status === "COMPLETED" || order.status === "CANCELLED" || order.status === "REJECTED") {
    throw new ValidationError({ order: ["Pesanan dengan status selesai, batal, atau ditolak tidak dapat dibatalkan"] });
  }

  // Hitung jumlah pengajuan cancel yang pernah dibuat untuk order ini
  const cancelRequestsCount = order.requests.filter(r => r.type === "CANCEL").length;

  if (cancelRequestsCount >= 3) {
    throw new ValidationError({ order: ["Batas maksimal pengajuan pembatalan (3 kali) telah tercapai"] });
  }

  // Buat request cancel baru
  const request = await prisma.orderRequest.create({
    data: {
      orderId,
      type: "CANCEL",
      cancelReason: body.reason,
      status: "PENDING",
    },
  });

  // Update counter di Order
  await prisma.order.update({
    where: { id: orderId },
    data: {
      cancelRequestCount: cancelRequestsCount + 1,
    } as any,
  });

  return request;
};

// ─── TASK 8: USER — Beli Lagi (Reorder) ───────────────────────────────────────
export const reorderService = async (orderId: string, userId: string) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
    },
  });

  if (!order) throw new NotFoundError("Order");
  if (order.userId !== userId) throw new ValidationError({ order: ["Pesanan tidak valid untuk user ini"] });
  if (order.status !== "COMPLETED") {
    throw new ValidationError({ order: ["Hanya pesanan yang sudah berstatus COMPLETED yang dapat dibeli lagi"] });
  }

  // Salin item ke keranjang belanja
  for (const item of order.items) {
    if (item.type === "PRODUCT") {
      await prisma.cartItem.create({
        data: {
          userId,
          type: "PRODUCT",
          productId: item.productId,
          productSizeId: item.productSizeId,
          qty: item.qty,
        },
      });
    } else if (item.type === "CUSTOM_CAKE" && item.customCakeId) {
      // Duplikasi custom cake beserta konfigurasi detailnya
      const originalCake = await prisma.customCake.findUnique({
        where: { id: item.customCakeId },
        include: {
          layers: true,
          toppings: true,
        },
      });

      if (originalCake) {
        const duplicatedCake = await prisma.customCake.create({
          data: {
            baseCakeId: originalCake.baseCakeId,
            tipeCreamId: originalCake.tipeCreamId,
            warnaCreamId: originalCake.warnaCreamId,
            topperId: originalCake.topperId,
            lilinId: originalCake.lilinId,
            ucapan: originalCake.ucapan,
            catatan: originalCake.catatan,
            dekorasiLainnya: originalCake.dekorasiLainnya,
            lilinAngkaGoldQty: originalCake.lilinAngkaGoldQty,
            foto: (originalCake as any).foto,
            fotoPublicId: (originalCake as any).fotoPublicId,
            totalPrice: originalCake.totalPrice,
            layers: {
              create: originalCake.layers.map((l) => ({
                layerId: l.layerId,
                sizeId: l.sizeId,
                position: l.position,
              })),
            },
            toppings: {
              create: originalCake.toppings.map((t) => ({
                toppingId: t.toppingId,
                qty: t.qty,
              })),
            },
          } as any,
        });

        await prisma.cartItem.create({
          data: {
            userId,
            type: "CUSTOM_CAKE",
            customCakeId: duplicatedCake.id,
            qty: item.qty,
          },
        });
      }
    }
  }

  return { success: true, message: "Item pesanan berhasil ditambahkan kembali ke keranjang" };
};

export const getOrderDetailService = async (
  orderId: string,
  userId: string,
  role: string,
) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: { select: { id: true, name: true, email: true } },
      items: {
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
      },
      trackings: true,
      paymentSubmissions: true,
      requests: true,
    },
  });

  if (!order) throw new NotFoundError("Order");

  if (role === "USER" && order.userId !== userId) {
    throw new ForbiddenError("Kamu tidak memiliki hak akses untuk melihat pesanan ini.");
  }

  return order;
};

