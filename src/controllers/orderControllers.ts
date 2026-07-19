import { Request, Response } from "express";
import { AuthError, ValidationError } from "../error/error";
import {
  createOrderSchema,
  updateOrderStatusSchema,
  verifyOrderSchema,
  shipOrderSchema,
  resolveCancelSchema,
  editPaymentSchema,
  requestCancelSchema,
} from "../schema/orderSchema";
import {
  createOrderService,
  getAllOrdersService,
  getMyOrdersService,
  updateOrderStatusService,
  verifyOrderService,
  shipOrderService,
  proofDeliveryService,
  confirmArrivalService,
  resolveCancelService,
  uploadPaymentProofService,
  editPaymentService,
  requestCancelService,
  reorderService,
  getOrderDetailService,
} from "../service/orderService";
import { wrap } from "../utils/helper/wrap.helpers";
import { validate } from "../utils/helper/validate.helpers";

// ─── USER CHECKOUT ────────────────────────────────────────────────────────────
export const createOrder = wrap(async (req: Request, res: Response) => {
  if (!req.user) throw new AuthError();

  const body = validate(createOrderSchema, req.body);
  const order = await createOrderService(req.user.id, body);

  res.status(201).json({ success: true, message: "Checkout berhasil", data: order });
});

// ─── USER LIHAT ORDER SENDIRI ─────────────────────────────────────────────────
export const getMyOrders = wrap(async (req: Request, res: Response) => {
  if (!req.user) throw new AuthError();

  const data = await getMyOrdersService(req.user.id);
  res.status(200).json({ success: true, data });
});

// ─── ADMIN LIHAT SEMUA ORDER ──────────────────────────────────────────────────
export const getAllOrders = wrap(async (_req: Request, res: Response) => {
  const data = await getAllOrdersService();
  res.status(200).json({ success: true, data });
});

// ─── ADMIN UPDATE STATUS ORDER ────────────────────────────────────────────────
export const updateOrderStatus = wrap(async (req: Request, res: Response) => {
  if (!req.user) throw new AuthError();

  const { id } = req.params as { id: string };
  const body = validate(updateOrderStatusSchema, req.body);
  const data = await updateOrderStatusService(id, req.user.id, body);

  res.status(200).json({ success: true, message: "Status order berhasil diupdate", data });
});

// ─── TASK 7: ADMIN — Verify Order ─────────────────────────────────────────────
export const verifyOrder = wrap(async (req: Request, res: Response) => {
  if (!req.user) throw new AuthError();

  const { id } = req.params as { id: string };
  const body = validate(verifyOrderSchema, req.body);
  const data = await verifyOrderService(id, req.user.id, body);

  res.status(200).json({
    success: true,
    message: body.action === "APPROVE" ? "Pesanan disetujui" : "Pesanan ditolak",
    data,
  });
});

// ─── TASK 7: ADMIN — Ship Order ───────────────────────────────────────────────
export const shipOrder = wrap(async (req: Request, res: Response) => {
  if (!req.user) throw new AuthError();

  const { id } = req.params as { id: string };
  const body = validate(shipOrderSchema, req.body);
  const data = await shipOrderService(id, req.user.id, body);

  res.status(200).json({
    success: true,
    message: "Pesanan berhasil dikirim",
    data,
  });
});

// ─── TASK 7: ADMIN — Upload Delivery Proof (Bukti Sampai) ──────────────────────
export const proofDelivery = wrap(async (req: Request, res: Response) => {
  if (!req.user) throw new AuthError();
  if (!req.file) throw new ValidationError({ foto: ["File bukti sampai wajib diunggah"] });

  const { id } = req.params as { id: string };
  const data = await proofDeliveryService(id, req.user.id, req.file.buffer);

  res.status(200).json({
    success: true,
    message: "Bukti pengiriman berhasil diunggah",
    data,
  });
});

// ─── TASK 7: ADMIN — Confirm Arrival ──────────────────────────────────────────
export const confirmArrival = wrap(async (req: Request, res: Response) => {
  if (!req.user) throw new AuthError();

  const { id } = req.params as { id: string };
  const data = await confirmArrivalService(id, req.user.id);

  res.status(200).json({
    success: true,
    message: "Pesanan berhasil diselesaikan",
    data,
  });
});

// ─── TASK 7: ADMIN — Resolve Cancellation Request ─────────────────────────────
export const resolveCancel = wrap(async (req: Request, res: Response) => {
  if (!req.user) throw new AuthError();

  const { requestId } = req.params as { requestId: string };
  const body = validate(resolveCancelSchema, req.body);
  const data = await resolveCancelService(requestId, req.user.id, body);

  res.status(200).json({
    success: true,
    message: data.requestStatus === "ACCEPTED" ? "Pembatalan disetujui" : "Pembatalan ditolak",
    data: data.order,
  });
});

// ─── TASK 8: USER — Upload Payment Proof ──────────────────────────────────────
export const uploadPaymentProof = wrap(async (req: Request, res: Response) => {
  if (!req.user) throw new AuthError();
  if (!req.file) throw new ValidationError({ bukti: ["Bukti transfer wajib diunggah"] });

  const { id } = req.params as { id: string };
  const data = await uploadPaymentProofService(id, req.user.id, req.file.buffer);

  res.status(201).json({
    success: true,
    message: "Bukti transfer berhasil diunggah",
    data,
  });
});

// ─── TASK 8: USER — Edit Payment ──────────────────────────────────────────────
export const editPayment = wrap(async (req: Request, res: Response) => {
  if (!req.user) throw new AuthError();

  const { id } = req.params as { id: string };
  const body = validate(editPaymentSchema, req.body);
  const data = await editPaymentService(id, req.user.id, body);

  res.status(200).json({
    success: true,
    message: "Detail pembayaran berhasil diubah",
    data,
  });
});

// ─── TASK 8: USER — Request Cancel Order ──────────────────────────────────────
export const requestCancel = wrap(async (req: Request, res: Response) => {
  if (!req.user) throw new AuthError();

  const { id } = req.params as { id: string };
  const body = validate(requestCancelSchema, req.body);
  const data = await requestCancelService(id, req.user.id, body);

  res.status(201).json({
    success: true,
    message: "Pengajuan pembatalan berhasil dikirim",
    data,
  });
});

// ─── TASK 8: USER — Beli Lagi (Reorder) ───────────────────────────────────────
export const reorder = wrap(async (req: Request, res: Response) => {
  if (!req.user) throw new AuthError();

  const { id } = req.params as { id: string };
  const data = await reorderService(id, req.user.id);

  res.status(200).json({
    success: true,
    message: data.message,
  });
});

export const getOrderDetail = wrap(async (req: Request, res: Response) => {
  if (!req.user) throw new AuthError();

  const { id } = req.params as { id: string };
  const data = await getOrderDetailService(id, req.user.id, req.user.role);

  res.status(200).json({ success: true, data });
});

