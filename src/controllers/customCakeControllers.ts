import { Request, Response } from "express";
import { customCakeOptionSchema } from "../schema/customCakeSchema";
import {
  createCustomCakeOptionService,
  getAllCustomCakeOptionsService,
  getOneCustomCakeOptionService,
  updateCustomCakeOptionService,
  deleteCustomCakeOptionService,
} from "../service/customCakeService";
import { wrap } from "../utils/helper/wrap.helpers";
import { validate } from "../utils/helper/validate.helpers";

export const createCustomCakeOption = wrap(
  async (req: Request, res: Response) => {
    const { category } = req.params as { category: string };
    const body = validate(customCakeOptionSchema, req.body);
    const data = await createCustomCakeOptionService(category, body);
    res.status(201).json({
      success: true,
      message: `${category} berhasil ditambahkan`,
      data,
    });
  },
);

export const getAllCustomCakeOptions = wrap(
  async (req: Request, res: Response) => {
    const { category } = req.params as { category: string };
    const data = await getAllCustomCakeOptionsService(category);
    res.status(200).json({
      success: true,
      data,
    });
  },
);

export const getOneCustomCakeOption = wrap(
  async (req: Request, res: Response) => {
    const { category, id } = req.params as { category: string; id: string };
    const data = await getOneCustomCakeOptionService(category, id);
    res.status(200).json({
      success: true,
      data,
    });
  },
);

export const updateCustomCakeOption = wrap(
  async (req: Request, res: Response) => {
    const { category, id } = req.params as { category: string; id: string };
    const body = validate(customCakeOptionSchema.partial(), req.body);
    const data = await updateCustomCakeOptionService(category, id, body);
    res.status(200).json({
      success: true,
      message: `${category} berhasil diperbarui`,
      data,
    });
  },
);

export const deleteCustomCakeOption = wrap(
  async (req: Request, res: Response) => {
    const { category, id } = req.params as { category: string; id: string };
    await deleteCustomCakeOptionService(category, id);
    res.status(200).json({
      success: true,
      message: `${category} berhasil dihapus`,
    });
  },
);
