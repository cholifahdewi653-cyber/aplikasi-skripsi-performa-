import { v2 as cloudinary } from "cloudinary";
import "dotenv/config";
import { UploadOptions, UploadResult } from "../types/cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// upload single file ke cloudinary
export const uploadToCloudinary = async ({
  fileBuffer = null,
  url = null,
  type = "image",
  folder = "cake_folder",
}: UploadOptions): Promise<UploadResult> => {
  const options = { folder, resource_type: type, unique_filename: true };

  //   upload file ke cloudinary
  if (fileBuffer) {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        options,
        (error, result) => {
          if (error || !result)
            return reject(error ?? new Error("Gagal Upload File"));
          resolve({ url: result.url, id: result.public_id });
        },
      );
      stream.end(fileBuffer);
    });
  }

  //   upload url
  if (url) {
    const result = await cloudinary.uploader.upload(url, options);
    return { url: result.url, id: result.public_id };
  }

  throw new Error("file atau url harus diisi");
};

// upload multiple file ke cloudinary
export const uploadMultipleToCloudinary = async (
  buffers: Buffer[],
  options?: Omit<UploadOptions, "fileBuffer" | "url">,
): Promise<UploadResult[]> => {
  return Promise.all(
    buffers.map((buffer) =>
      uploadToCloudinary({ fileBuffer: buffer, ...options }),
    ),
  );
};

// delete file di cloudinary
export const deleteFromCloudinary = async (
  public_id: string,
): Promise<void> => {
  await cloudinary.uploader.destroy(public_id);
};

// delete multiple files
export const deleteManyFromCloudinary = async (
  publicIds: string[],
): Promise<void> => {
  await Promise.all(publicIds.map((id) => cloudinary.uploader.destroy(id)));
};
