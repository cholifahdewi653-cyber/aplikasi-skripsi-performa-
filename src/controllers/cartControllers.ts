import { Request, Response } from "express";
import { AuthError } from "../error/error";
import {
  getAllCartService,
  addToCartService,
  deleteCartService,
} from "../service/cartService";
import { addToCartSchema, deleteCartItemSchema } from "../schema/cartSchema";
import { wrap } from "../utils/helper/wrap.helpers";
import { validate } from "../utils/helper/validate.helpers";

// ─── GET /api/cart ────────────────────────────────────────────────────────────
export const getAllCart = wrap(async (req: Request, res: Response) => {
  if (!req.user) throw new AuthError();
  const data = await getAllCartService(req.user.id);

  res.status(200).json({ success: true, data });
});

// ─── POST /api/cart ───────────────────────────────────────────────────────────
export const addToCart = wrap(async (req: Request, res: Response) => {
  if (!req.user) throw new AuthError();

  const parsed = validate(addToCartSchema, req.body);
  const { cartItem, isUpdate } = await addToCartService(req.user.id, parsed);

  res.status(200).json({
    success: true,
    message: isUpdate
      ? "Quantity cart diperbarui"
      : "Produk berhasil ditambahkan ke cart",
    data: cartItem,
  });
});

// ─── DELETE /api/cart/:cartItemId ─────────────────────────────────────────────
export const deleteCart = wrap(async (req: Request, res: Response) => {
  if (!req.user) throw new AuthError();

  const { cartItemId } = validate(deleteCartItemSchema, req.params);
  await deleteCartService(req.user.id, cartItemId);

  res
    .status(200)
    .json({ success: true, message: "Item berhasil dihapus dari cart" });
});
