import { prisma } from "../lib/prisma";
import { ForbiddenError } from "../error/error";
import { updateProfileSchema } from "../schema/profileSchema";
import { deleteFromCloudinary, uploadToCloudinary } from "../lib/cloudinary";
import * as z from "zod";

// ─── Service Functions ────────────────────────────────────────────────────────
export const updateMyProfileService = async (
  userId: string,
  role: string,
  file: Express.Multer.File | undefined,
  body: z.infer<typeof updateProfileSchema>,
) => {
  const {
    name,
    address,
    city,
    postalCode,
    adminNotes,
    department,
    ...profileFields
  } = body;

  // USER tidak boleh isi field ADMIN
  if (role === "USER" && (adminNotes || department)) {
    throw new ForbiddenError("Tidak diizinkan mengisi field admin");
  }

  // ADMIN tidak boleh isi field USER
  if (role === "ADMIN" && (address || city || postalCode)) {
    throw new ForbiddenError("Tidak diizinkan mengisi field user");
  }

  // update nama user
  if (name !== undefined) {
    await prisma.user.update({
      where: { id: userId },
      data: { name },
    });
  }

  let avatarData = {};

  if (file) {
    const existingProfile = await prisma.profile.findUnique({
      where: { userId },
      select: { avatarId: true },
    });

    if (existingProfile?.avatarId) {
      await deleteFromCloudinary(existingProfile.avatarId);
    }

    const uploaded = await uploadToCloudinary({
      fileBuffer: file.buffer,
      folder: "profile_folder",
    });

    avatarData = {
      avatar: uploaded.url,
      avatarId: uploaded.id,
    };
  }

  return prisma.profile.upsert({
    where: { userId },
    create: {
      userId,
      ...profileFields,
      ...(role === "USER" && { address, city, postalCode }),
      ...(role === "ADMIN" && { adminNotes, department }),
      ...avatarData,
    },
    update: {
      ...profileFields,
      ...(role === "USER" && { address, city, postalCode }),
      ...(role === "ADMIN" && { adminNotes, department }),
      ...avatarData,
    },
  });
};
