import { Request } from "express";
import multer, { FileFilterCallback } from "multer";

const allowedImage = ["image/png", "image/jpg", "image/jpeg", "image/webp"];

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
) => {
  const isImage = (allowedImage as readonly string[]).includes(file.mimetype);

  if (!isImage) {
    return cb(new Error("Format gambar tidak valid"));
  }

  return cb(null, true);
};

const storage = multer.memoryStorage(); // simpan di memory dalam bentuk buffer

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024, files: 10 },
});
