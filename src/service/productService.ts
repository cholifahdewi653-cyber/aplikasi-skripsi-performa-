import { prisma } from "../lib/prisma";
import {
  deleteManyFromCloudinary,
  uploadMultipleToCloudinary,
  uploadToCloudinary,
} from "../lib/cloudinary";
import { NotFoundError, ValidationError, ConflictError } from "../error/error";
import { productSchema, ProductInput } from "../schema/productSchema";
import { parseJsonField, slugify } from "../utils/helper/product.helpers";

// ─── Service Functions ────────────────────────────────────────────────────────
export const getAllProductService = async () => {
  return prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: { sizes: true },
  });
};

export const getOneProductService = async (id: string) => {
  const product = await prisma.product.findUnique({
    where: { id },
    include: { sizes: true },
  });

  if (!product) throw new NotFoundError("Produk");
  return product;
};

export const createProductService = async (
  files: Express.Multer.File[] | undefined,
  body: Record<string, unknown>,
) => {
  // Parse sizes from JSON string if necessary
  const parsedSizes = parseJsonField(body.sizes, "sizes");

  const parsed = productSchema.parse({
    name: body.name,
    category: body.category,
    basePrice: body.basePrice ? Number(body.basePrice) : undefined,
    description: body.description,
    sizes: parsedSizes,
    variantRasa: body.variantRasa,
    stock: body.stock,
    discount: body.discount === "true" || body.discount === true,
    discountType: body.discountType || null,
    discountValue: body.discountValue ? Number(body.discountValue) : null,
  });

  const slug = slugify(parsed.name);

  // Check for unique slug
  const existing = await prisma.product.findUnique({ where: { slug } });
  if (existing) {
    throw new ConflictError("Nama produk sudah terdaftar (slug duplikat)");
  }

  // Cloudinary image upload handling
  const urlImages: string[] = body.images
    ? Array.isArray(body.images)
      ? (body.images as string[])
      : [body.images as string]
    : [];

  if ((!files || files.length === 0) && urlImages.length === 0) {
    throw new ValidationError({ images: ["Gambar tidak boleh kosong"] });
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

  return prisma.product.create({
    data: {
      name: parsed.name,
      slug,
      images: uploaded.map((u) => u.url),
      imageIds: uploaded.map((u) => u.id),
      description: parsed.description,
      category: parsed.category,
      basePrice: parsed.basePrice,
      hasDiscount: parsed.discount,
      discountType: parsed.discount ? (parsed.discountType === "percentage" ? "PERCENTAGE" : "FIXED") : null,
      discountValue: parsed.discount ? parsed.discountValue : null,
      variants: [parsed.variantRasa],
      stockType: parsed.stock === "ready" ? "READY_STOCK" : "PRE_ORDER",
      sizes: {
        create: parsed.sizes.map((s) => ({
          name: s.name,
          price: s.price,
          status: true,
        })),
      },
    },
    include: { sizes: true },
  });
};

export const updateProductService = async (
  id: string,
  files: Express.Multer.File[] | undefined,
  body: Record<string, unknown>,
) => {
  const existingProduct = await prisma.product.findUnique({ where: { id } });
  if (!existingProduct) throw new NotFoundError("Produk");

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

  // Optional updates
  const parsedSizes = body.sizes ? parseJsonField(body.sizes, "sizes") : undefined;

  const parsed = productSchema.partial().parse({
    name: body.name,
    category: body.category,
    basePrice: body.basePrice ? Number(body.basePrice) : undefined,
    description: body.description,
    sizes: parsedSizes,
    variantRasa: body.variantRasa,
    stock: body.stock,
    discount: body.discount !== undefined ? (body.discount === "true" || body.discount === true) : undefined,
    discountType: body.discountType || undefined,
    discountValue: body.discountValue ? Number(body.discountValue) : undefined,
  });

  const slug = parsed.name ? slugify(parsed.name) : undefined;
  if (slug && slug !== existingProduct.slug) {
    const collision = await prisma.product.findUnique({ where: { slug } });
    if (collision) {
      throw new ConflictError("Nama produk baru sudah terdaftar (slug duplikat)");
    }
  }

  // Map to DB values
  const updateData: any = {
    ...(parsed.name && { name: parsed.name, slug }),
    ...(parsed.category && { category: parsed.category }),
    ...(parsed.description && { description: parsed.description }),
    ...(parsed.basePrice !== undefined && { basePrice: parsed.basePrice }),
    ...(parsed.discount !== undefined && { hasDiscount: parsed.discount }),
    ...(parsed.discount !== undefined && {
      discountType: parsed.discount ? (parsed.discountType === "percentage" ? "PERCENTAGE" : "FIXED") : null,
      discountValue: parsed.discount ? parsed.discountValue : null,
    }),
    ...(parsed.variantRasa && { variants: [parsed.variantRasa] }),
    ...(parsed.stock && { stockType: parsed.stock === "ready" ? "READY_STOCK" : "PRE_ORDER" }),
    ...(hasNewImages && {
      images: uploadedImages.map((u) => u.url),
      imageIds: uploadedImages.map((u) => u.id),
    }),
  };

  return prisma.product.update({
    where: { id },
    data: {
      ...updateData,
      ...(parsed.sizes && {
        sizes: {
          deleteMany: {},
          create: parsed.sizes.map((s) => ({
            name: s.name,
            price: s.price,
            status: true,
          })),
        },
      }),
    },
    include: { sizes: true },
  });
};

export const deleteProductService = async (id: string) => {
  const existingProduct = await prisma.product.findUnique({ where: { id } });
  if (!existingProduct) throw new NotFoundError("Produk");

  if (existingProduct.imageIds.length > 0) {
    await deleteManyFromCloudinary(existingProduct.imageIds);
  }

  await prisma.product.delete({ where: { id } });
};

export const getBestSellersService = async () => {
  const bestSellers = await prisma.orderItem.groupBy({
    by: ["productId"],
    where: {
      productId: { not: null },
      order: {
        status: { notIn: ["REJECTED", "CANCELLED"] },
      },
    },
    _sum: {
      qty: true,
    },
    orderBy: {
      _sum: {
        qty: "desc",
      },
    },
    take: 5,
  });

  const productIds = bestSellers.map((b) => b.productId).filter(Boolean) as string[];

  let products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
      isPublished: true,
    },
    include: { sizes: true },
  });

  products.sort((a, b) => productIds.indexOf(a.id) - productIds.indexOf(b.id));

  if (products.length < 5) {
    const excludeIds = products.map((p) => p.id);
    const additional = await prisma.product.findMany({
      where: {
        id: { notIn: excludeIds },
        isPublished: true,
      },
      orderBy: { createdAt: "desc" },
      take: 5 - products.length,
      include: { sizes: true },
    });
    products = [...products, ...additional];
  }

  return products;
};

export const getNewestProductsService = async () => {
  return prisma.product.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { sizes: true },
  });
};

export const getProductsByCategoryService = async (category: string) => {
  return prisma.product.findMany({
    where: {
      category: {
        equals: category,
        mode: "insensitive",
      },
      isPublished: true,
    },
    orderBy: { createdAt: "desc" },
    include: { sizes: true },
  });
};

