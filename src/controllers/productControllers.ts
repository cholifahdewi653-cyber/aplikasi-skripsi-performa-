import { Request, Response } from "express";
import * as z from "zod";
import { prisma } from "../lib/prisma";
import {
  deleteManyFromCloudinary,
  uploadMultipleToCloudinary,
  uploadToCloudinary,
} from "../lib/cloudinary";

// schema
const variantSchema = z.object({
  name: z.string().min(3, "Varian minimal 3 karakter"),
  isBase: z.boolean().default(false),
  priceAdjust: z.number().int().default(0),
});

const sizeSchema = z.object({
  label: z.string().min(1, "Ukuran tidak boleh kosong"),
  isBase: z.boolean().default(false),
  priceAdjust: z.number().int().default(0),
  stock: z.number().int().min(0, "Stok tidak boleh negatif"),
});

const productSchema = z.object({
  name: z.string().min(3, "Nama minimal 3 karakter").max(100),
  slug: z.string().min(3, "Slug minimal 3 karakter"),
  images: z
    .array(z.string().url())
    .min(1, "Gambar tidak boleh kosong")
    .max(10, "maximum 10 gambar"),
  imageIds: z.array(z.string()),
  categoryId: z.string().min(1, "Kategori tidak boleh kosong"), // relasi FK
  description: z.string().min(5, "Deskripsi minimal 5 karakter").max(1000),
  pricingType: z.enum(["FIXED", "CUSTOM"]).default("FIXED"),
  basePrice: z.number().int().min(1, "Harga minimal 1"),
  isPublished: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  variants: z.array(variantSchema).default([]),
  sizes: z.array(sizeSchema).min(1, "Ukuran tidak boleh kosong"),
});

const formatError = (error: z.ZodError, res: Response) => {
  const message = error.issues.map((e: z.ZodIssue) => e.message);
  return res.status(400).json({
    success: false,
    errors: message,
  });
};

const resolveVariant = (variant: z.infer<typeof variantSchema>[]) => {
  const hasBase = variant.some((v) => v.isBase);

  if (variant.length === 0 || !hasBase) {
    return [
      {
        name: "Original",
        isBase: true,
        priceAdjust: 0,
      },
      ...variant.map((v) => ({ ...v, isBase: false })),
    ];
  }

  let baseFound = false;
  return variant.map((v) => {
    if (v.isBase && !baseFound) {
      baseFound = true;
      return v;
    }
    return { ...v, isBase: false };
  });
};

// Get All Product
export const getAllProduct = async (req: Request, res: Response) => {
  try {
    const product = await prisma.product.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        category: true, // relasi Category
        sizes: true,
        variants: true,
      },
    });

    return res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil data produk",
    });
  }
};

// Get One Product
export const getOneProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: {
        id: id as string,
      },
      include: {
        category: true, // relasi Category
        sizes: true,
        variants: true,
      },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Produk tidak ditemukan",
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil data produk",
    });
  }
};

// Create Product
export const createProduct = async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    const urlImages: string[] = req.body.images
      ? Array.isArray(req.body.images)
        ? req.body.images
        : [req.body.images]
      : [];

    if ((!files || files.length === 0) && urlImages.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Gambar tidak boleh kosong",
      });
    }

    const uploaded =
      files && files.length > 0
        ? await uploadMultipleToCloudinary(
            files.map((f) => f.buffer),
            { folder: "cake_folder" },
          )
        : await Promise.all(
            urlImages.map((url) =>
              uploadToCloudinary({ url, folder: "cake_folder" }),
            ),
          );

    let parsedVariant: unknown = [];
    let parsedSize: unknown = [];

    try {
      parsedVariant = req.body.variants
        ? typeof req.body.variants === "string"
          ? JSON.parse(req.body.variants)
          : req.body.variants
        : [];
    } catch (error) {
      console.log(error);
      return res.status(400).json({
        success: false,
        message: "Format variant tidak valid",
      });
    }

    try {
      parsedSize = req.body.sizes
        ? typeof req.body.sizes === "string"
          ? JSON.parse(req.body.sizes)
          : req.body.sizes
        : [];
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Format sizes tidak valid",
      });
    }

    const parsed = productSchema.parse({
      name: req.body.name,
      slug: req.body.slug,
      description: req.body.description,
      basePrice: Number(req.body.basePrice),
      pricingType: req.body.pricingType,
      categoryId: req.body.categoryId, // ✅ FK, bukan string kategori
      isPublished:
        req.body.isPublished !== undefined
          ? req.body.isPublished === "true" || req.body.isPublished === true
          : true,
      isFeatured:
        req.body.isFeatured === "true" || req.body.isFeatured === true,
      variants: parsedVariant,
      sizes: parsedSize,
      images: uploaded.map((u) => u.url),
      imageIds: uploaded.map((u) => u.id),
    });

    const resolvedVariant = resolveVariant(parsed.variants);

    const product = await prisma.product.create({
      data: {
        name: parsed.name,
        slug: parsed.slug, // ✅ slug wajib
        images: parsed.images,
        imageIds: parsed.imageIds,
        description: parsed.description,
        categoryId: parsed.categoryId, // ✅ FK ke Category
        basePrice: parsed.basePrice,
        pricingType: parsed.pricingType,
        isPublished: parsed.isPublished, // ✅ field schema
        isFeatured: parsed.isFeatured, // ✅ field schema
        variants: {
          create: resolvedVariant, // ✅ resolveVariant di create juga
        },
        sizes: {
          create: parsed.sizes,
        },
      },
      include: {
        category: true,
        variants: true,
        sizes: true,
      },
    });

    res.status(201).json({
      success: true,
      data: product,
      message: "Produk berhasil ditambahkan",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return formatError(error, res);
    }
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Gagal menambahkan produk",
    });
  }
};

// Update Product
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const files = req.files as Express.Multer.File[];

    const existingProduct = await prisma.product.findUnique({
      where: {
        id: id as string,
      },
    });

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: "Produk tidak ditemukan",
      });
    }

    let uploadedImages: { url: string; id: string }[] = [];

    if (files && files.length > 0) {
      if (existingProduct.imageIds && existingProduct.imageIds.length > 0) {
        await deleteManyFromCloudinary(existingProduct.imageIds);
      }

      uploadedImages = await uploadMultipleToCloudinary(
        files.map((f) => f.buffer),
        { folder: "cake_folder" },
      );
    }

    const hasNewImages = uploadedImages.length > 0;

    let parsedVariant: unknown = undefined;
    let parsedSize: unknown = undefined;

    try {
      parsedVariant = req.body.variants
        ? typeof req.body.variants === "string"
          ? JSON.parse(req.body.variants)
          : req.body.variants
        : undefined;
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Format variant tidak valid",
      });
    }

    try {
      parsedSize = req.body.sizes
        ? typeof req.body.sizes === "string"
          ? JSON.parse(req.body.sizes)
          : req.body.sizes
        : undefined;
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Format sizes tidak valid",
      });
    }

    const { variants, sizes, ...rest } = productSchema.partial().parse({
      name: req.body.name,
      slug: req.body.slug,
      description: req.body.description,
      basePrice: req.body.basePrice ? Number(req.body.basePrice) : undefined,
      pricingType: req.body.pricingType,
      categoryId: req.body.categoryId,
      isPublished:
        req.body.isPublished !== undefined
          ? req.body.isPublished === "true" || req.body.isPublished === true
          : undefined,
      isFeatured:
        req.body.isFeatured !== undefined
          ? req.body.isFeatured === "true" || req.body.isFeatured === true
          : undefined,
      variants: parsedVariant,
      sizes: parsedSize,
      ...(hasNewImages && {
        images: uploadedImages.map((u) => u.url),
        imageIds: uploadedImages.map((u) => u.id),
      }),
    });

    const resolvedVariant = variants ? resolveVariant(variants) : undefined;

    const product = await prisma.product.update({
      where: {
        id: id as string,
      },
      data: {
        ...rest,
        ...(resolvedVariant && {
          variants: {
            deleteMany: {},
            create: resolvedVariant,
          },
        }),
        ...(sizes && {
          sizes: {
            deleteMany: {},
            create: sizes,
          },
        }),
      },
      include: {
        category: true,
        variants: true,
        sizes: true,
      },
    });

    res.status(200).json({
      success: true,
      data: product,
      message: "Produk berhasil diperbarui",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return formatError(error, res);
    }

    return res.status(500).json({
      success: false,
      message: "Gagal memperbarui produk",
    });
  }
};

// Delete Product
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existingProduct = await prisma.product.findUnique({
      where: {
        id: id as string,
      },
    });

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: "Produk tidak ditemukan",
      });
    }

    if (existingProduct.imageIds.length > 0) {
      await deleteManyFromCloudinary(existingProduct.imageIds);
    }

    await prisma.product.delete({
      where: {
        id: id as string,
      },
    });

    res.status(200).json({
      success: true,
      message: "Produk berhasil dihapus",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Gagal menghapus produk",
    });
  }
};
