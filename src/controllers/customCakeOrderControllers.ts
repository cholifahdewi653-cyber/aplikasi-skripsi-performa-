import { Request, Response } from "express";
import { AuthError } from "../error/error";
import { createCustomCakeOrderSchema } from "../schema/customCakeOrderSchema";
import {
  createCustomCakeService,
  getCustomCakeOptionsService,
  getOneCustomCakeService,
} from "../service/customCakeOrderService";
import { wrap } from "../utils/helper/wrap.helpers";
import { validate } from "../utils/helper/validate.helpers";
import { uploadToCloudinary } from "../lib/cloudinary";

// ─── POST /api/custom-cakes/order — User buat custom cake ────────────────────
export const createCustomCakeOrder = wrap(async (req: Request, res: Response) => {
  if (!req.user) throw new AuthError();

  const body = validate(createCustomCakeOrderSchema, req.body);

  let fotoUrl: string | null = null;
  let fotoId: string | null = null;

  // Handle file upload via Multer buffer first
  if (req.file) {
    const uploadResult = await uploadToCloudinary({
      fileBuffer: req.file.buffer,
      folder: "custom_cake_folder",
    });
    fotoUrl = uploadResult.url;
    fotoId = uploadResult.id;
  }
  // Fallback to URL in request body if present
  else if (body.foto) {
    const uploadResult = await uploadToCloudinary({
      url: body.foto,
      folder: "custom_cake_folder",
    });
    fotoUrl = uploadResult.url;
    fotoId = uploadResult.id;
  }

  const data = await createCustomCakeService(req.user.id, {
    ...body,
    foto: fotoUrl,
    fotoPublicId: fotoId,
  });

  res.status(201).json({
    success: true,
    message: "Custom cake berhasil dibuat",
    data,
  });
});

// ─── GET /api/custom-cakes/options — Ambil semua opsi (user pilih) ────────────
export const getCustomCakeOptions = wrap(async (_req: Request, res: Response) => {
  const data = await getCustomCakeOptionsService();

  res.status(200).json({
    success: true,
    data,
  });
});

// ─── GET /api/custom-cakes/order/:id — Detail satu custom cake ───────────────
export const getCustomCakeDetail = wrap(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const data = await getOneCustomCakeService(id);

  res.status(200).json({
    success: true,
    data,
  });
});
