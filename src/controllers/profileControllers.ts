import { Request, Response } from "express";
import { ZodError } from "zod";
import { prisma } from "../lib/prisma";
import { updateProfileSchema } from "../schema/profileSchema";
import { deleteFromCloudinary, uploadToCloudinary } from "../lib/cloudinary";

// UPDATE profile sendiri
export const updateMyProfile = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const userId = req.user.id;
    const role = req.user.role;
    const file = req.file as Express.Multer.File | undefined;

    const parsed = updateProfileSchema.parse(req.body);

    const {
      name,
      address,
      city,
      postalCode,
      adminNotes,
      department,
      ...profileFields
    } = parsed;

    // USER tidak boleh isi field ADMIN
    if (role === "USER" && (adminNotes || department)) {
      return res.status(403).json({
        success: false,
        message: "Tidak diizinkan mengisi field admin",
      });
    }

    // ADMIN tidak boleh isi field USER
    if (role === "ADMIN" && (address || city || postalCode)) {
      return res.status(403).json({
        success: false,
        message: "Tidak diizinkan mengisi field user",
      });
    }

    // update nama user
    if (name !== undefined) {
      await prisma.user.update({
        where: { id: userId },
        data: { name },
      });
    }

    let avatarData = {};

    // jika upload foto baru
    if (file) {
      const existingProfile = await prisma.profile.findUnique({
        where: { userId },
        select: { avatarId: true },
      });

      // hapus foto lama
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

    const profile = await prisma.profile.upsert({
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

    return res.status(200).json({
      success: true,
      message: "Profil berhasil diupdate",
      data: profile,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: error.issues[0].message,
      });
    }

    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Gagal update profil",
    });
  }
};
