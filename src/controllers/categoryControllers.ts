import { Request, Response } from "express";
import { z, ZodError } from "zod";
import { prisma } from "../lib/prisma";
import { categorySchema } from "../schema/categorySchema";

// GET ALL
export const getAllCategories = async (req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil data kategori",
    });
  }
};

// GET BY ID
export const getCategoryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };

    const category = await prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Kategori tidak ditemukan",
      });
    }

    return res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil data kategori",
    });
  }
};

// CREATE
export const createCategory = async (req: Request, res: Response) => {
  try {
    const parsed = categorySchema.parse({
      name: req.body.name,
      slug: req.body.slug,
    });

    const existing = await prisma.category.findFirst({
      where: {
        OR: [{ name: parsed.name }, { slug: parsed.slug }],
      },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Nama atau slug kategori sudah digunakan",
      });
    }

    const category = await prisma.category.create({
      data: {
        name: parsed.name,
        slug: parsed.slug,
      },
    });

    return res.status(201).json({
      success: true,
      data: category,
      message: "Kategori berhasil ditambahkan",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: error.issues[0].message, // pakai .issues bukan .errors
      });
    }
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Gagal menambahkan kategori",
    });
  }
};

// UPDATE
export const updateCategory = async (req: Request, res: Response) => {
  try {
    console.log("req.body", req.body);
    const { id } = req.params as { id: string };

    const existing = await prisma.category.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Kategori tidak ditemukan",
      });
    }

    const parsed = categorySchema.parse({
      name: req.body.name,
      slug: req.body.slug,
    });
    console.log("parsed", parsed);

    const duplicate = await prisma.category.findFirst({
      where: {
        OR: [{ name: parsed.name }, { slug: parsed.slug }],
        NOT: { id },
      },
    });

    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: "Nama atau slug kategori sudah digunakan",
      });
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        name: parsed.name,
        slug: parsed.slug,
      },
    });

    return res.status(200).json({
      success: true,
      data: category,
      message: "Kategori berhasil diupdate",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: error.issues[0].message, // pakai .issues bukan .errors
      });
    }
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Gagal mengupdate kategori",
    });
  }
};

// DELETE
export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };

    const existing = await prisma.category.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Kategori tidak ditemukan",
      });
    }
    const productCount = await prisma.product.count({
      where: { categoryId: id },
    });

    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Kategori tidak bisa dihapus karena masih digunakan oleh ${productCount} produk`,
      });
    }

    await prisma.category.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: "Kategori berhasil dihapus",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Gagal menghapus kategori",
    });
  }
};
