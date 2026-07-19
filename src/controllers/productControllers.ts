import { Request, Response } from "express";
import {
  getAllProductService,
  getOneProductService,
  createProductService,
  updateProductService,
  deleteProductService,
  getBestSellersService,
  getNewestProductsService,
  getProductsByCategoryService,
} from "../service/productService";
import { wrap } from "../utils/helper/wrap.helpers";


// ─── Get All Product ──────────────────────────────────────────────────────────
export const getAllProduct = wrap(async (_req: Request, res: Response) => {
  const data = await getAllProductService();
  res.status(200).json({ success: true, data });
});

// ─── Get One Product ──────────────────────────────────────────────────────────
export const getOneProduct = wrap(async (req: Request, res: Response) => {
  const data = await getOneProductService(req.params.id as string);
  res.status(200).json({ success: true, data });
});

// ─── Create Product ───────────────────────────────────────────────────────────
export const createProduct = wrap(async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[] | undefined;
  const data = await createProductService(
    files,
    req.body as Record<string, unknown>,
  );

  res
    .status(201)
    .json({ success: true, message: "Produk berhasil ditambahkan", data });
});

// ─── Update Product ───────────────────────────────────────────────────────────
export const updateProduct = wrap(async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[] | undefined;
  const data = await updateProductService(
    req.params.id as string,
    files,
    req.body as Record<string, unknown>,
  );

  res
    .status(200)
    .json({ success: true, message: "Produk berhasil diperbarui", data });
});

// ─── Delete Product ───────────────────────────────────────────────────────────
export const deleteProduct = wrap(async (req: Request, res: Response) => {
  await deleteProductService(req.params.id as string);
  res.status(200).json({ success: true, message: "Produk berhasil dihapus" });
});

export const getBestSellers = wrap(async (_req: Request, res: Response) => {
  const data = await getBestSellersService();
  res.status(200).json({ success: true, data });
});

export const getNewestProducts = wrap(async (_req: Request, res: Response) => {
  const data = await getNewestProductsService();
  res.status(200).json({ success: true, data });
});

export const getProductsByCategory = wrap(async (req: Request, res: Response) => {
  const data = await getProductsByCategoryService(req.params.category as string);
  res.status(200).json({ success: true, data });
});

