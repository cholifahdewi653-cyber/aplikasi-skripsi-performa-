import { prisma } from "../lib/prisma";
import { NotFoundError, ValidationError, ConflictError } from "../error/error";
import { CreateReviewInput } from "../schema/reviewSchema";
import { uploadToCloudinary } from "../lib/cloudinary";

export const createReviewService = async (
  userId: string,
  body: CreateReviewInput,
  fileBuffer?: Buffer,
) => {
  const orderItem = await prisma.orderItem.findUnique({
    where: { id: body.orderItemId },
    include: {
      order: true,
      review: true,
    },
  });

  if (!orderItem) throw new NotFoundError("Item pesanan");

  if (orderItem.order.userId !== userId) {
    throw new ValidationError({ orderItemId: ["Item pesanan ini bukan milik Anda"] });
  }

  if (orderItem.order.status !== "COMPLETED") {
    throw new ValidationError({ orderItemId: ["Anda hanya dapat memberikan ulasan pada pesanan yang sudah selesai (COMPLETED)"] });
  }

  if (orderItem.review) {
    throw new ConflictError("Ulasan sudah diberikan untuk item pesanan ini");
  }

  let fotoUrl: string | null = null;
  let fotoId: string | null = null;

  if (fileBuffer) {
    const uploadResult = await uploadToCloudinary({
      fileBuffer,
      folder: "review_photos_folder",
    });
    fotoUrl = uploadResult.url;
    fotoId = uploadResult.id;
  } else if (body.foto) {
    const uploadResult = await uploadToCloudinary({
      url: body.foto,
      folder: "review_photos_folder",
    });
    fotoUrl = uploadResult.url;
    fotoId = uploadResult.id;
  }

  const review = await prisma.review.create({
    data: {
      rating: body.rating,
      comment: body.comment || null,
      foto_url: fotoUrl,
      foto_public_id: fotoId,
      userId,
      productId: orderItem.productId || null, // null untuk custom cake, value untuk reguler
      orderItemId: body.orderItemId,
    } as any,
  });

  return review;
};

export const getProductReviewsService = async (productId: string) => {
  return prisma.review.findMany({
    where: { productId },
    include: {
      user: { select: { name: true, profile: { select: { avatar: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });
};
