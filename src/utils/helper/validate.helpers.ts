import { ZodSchema, ZodError } from "zod";
import { ValidationError } from "../../error/error";
import { formatZodIssues } from "../zodErrorFormatter";

/**
 * Validasi data menggunakan Zod schema.
 * Jika gagal, melempar ValidationError dengan pesan terformat (Bahasa Indonesia)
 * dari formatZodIssues — bukan raw ZodError.
 *
 * Gunakan ini di controller sebagai pengganti schema.parse(data) agar
 * pesan error sudah terformat sebelum masuk ke global errorHandler.
 */
export const validate = <T>(schema: ZodSchema<T>, data: unknown): T => {
  const result = schema.safeParse(data);

  if (!result.success) {
    const formatted = formatZodIssues(result.error as ZodError);
    throw new ValidationError(formatted);
  }

  return result.data;
};
