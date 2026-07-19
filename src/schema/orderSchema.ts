import { z } from "zod";

export const createOrderSchema = z.object({
  // Item checkout
  cartItemIds: z.array(z.string().cuid()).min(1, "Minimal pilih 1 item dari cart"),

  // Data pengiriman
  recipientName: z.string().min(1, "Nama penerima wajib diisi").optional(),
  phoneNumber: z.string().min(1, "Nomor telepon wajib diisi").optional(),
  address: z.string().min(1, "Alamat wajib diisi").optional(),
  city: z.string().min(1, "Kota wajib diisi").optional(),
  postalCode: z.string().min(1, "Kode pos wajib diisi").optional(),

  // Checkout fields (PRD Task 6)
  deliveryDate: z.string().min(1, "Tanggal pengiriman wajib diisi"), // ISO date string
  note: z.string().optional(),
  paymentMethod: z.enum(["TRANSFER", "COD", "PICKUP"]),
  bank: z.string().optional(), // wajib jika paymentMethod = TRANSFER
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    "PENDING",
    "REJECTED",
    "PROCESSING",
    "SHIPPED",
    "ARRIVED",
    "COMPLETED",
    "CANCELLED",
    "RETURNED",
  ]),
  note: z.string().optional(),
});

// Task 7: verifyOrderSchema
export const verifyOrderSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  reason: z.string().optional(),
}).refine((data) => {
  if (data.action === "REJECT" && (!data.reason || data.reason.trim() === "")) {
    return false;
  }
  return true;
}, {
  message: "Alasan penolakan wajib diisi jika pesanan ditolak",
  path: ["reason"],
});

// Task 7: shipOrderSchema
export const shipOrderSchema = z.object({
  expedition: z.string().min(1, "Nama ekspedisi wajib diisi"),
  resi: z.string().min(1, "Nomor resi wajib diisi"),
});

// Task 7: resolveCancelSchema
export const resolveCancelSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  settlementType: z.enum(["REFUND", "GANTI_PRODUK"]).optional(),
  refundType: z.string().optional(),
  adminNote: z.string().optional(),
}).refine((data) => {
  if (data.action === "APPROVE" && !data.settlementType) {
    return false;
  }
  return true;
}, {
  message: "Jenis penyelesaian wajib ditentukan jika pembatalan disetujui",
  path: ["settlementType"],
});

// Task 8: editPaymentSchema
export const editPaymentSchema = z.object({
  paymentMethod: z.enum(["TRANSFER", "COD", "PICKUP"]),
  bank: z.string().optional(),
}).refine((data) => {
  if (data.paymentMethod === "TRANSFER" && (!data.bank || data.bank.trim() === "")) {
    return false;
  }
  return true;
}, {
  message: "Bank wajib diisi jika metode pembayaran Transfer",
  path: ["bank"],
});

// Task 8: requestCancelSchema
export const requestCancelSchema = z.object({
  reason: z.string().min(5, "Alasan pembatalan minimal 5 karakter"),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type VerifyOrderInput = z.infer<typeof verifyOrderSchema>;
export type ShipOrderInput = z.infer<typeof shipOrderSchema>;
export type ResolveCancelInput = z.infer<typeof resolveCancelSchema>;
export type EditPaymentInput = z.infer<typeof editPaymentSchema>;
export type RequestCancelInput = z.infer<typeof requestCancelSchema>;
