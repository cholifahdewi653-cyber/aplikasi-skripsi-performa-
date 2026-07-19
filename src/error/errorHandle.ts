import "dotenv/config";
import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "./error";
import { formatZodIssues } from "../utils/zodErrorFormatter";
import { Prisma } from "../../generated/prisma/client";

const isDev = process.env.NODE_ENV === "development";
const isTest = process.env.NODE_ENV === "test";

// ─── Field Error Sanitizer ─────────────────────────────────────────────────
const BLOCKED_FIELD_NAMES = new Set([
  "__proto__",
  "constructor",
  "prototype",
  "toString",
  "valueOf",
  "hasOwnProperty",
]);

function sanitizeFieldErrors(
  raw: unknown,
): Record<string, string[]> | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;

  const result: Record<string, string[]> = Object.create(null);

  for (const [field, messages] of Object.entries(
    raw as Record<string, unknown>,
  )) {
    if (BLOCKED_FIELD_NAMES.has(field)) continue;
    if (field.length > 100) continue;

    if (Array.isArray(messages)) {
      const safe = messages
        .filter((m) => typeof m === "string")
        .slice(0, 10)
        .map((m: string) =>
          m
            .replace(/\bat\s+\S+:\d+:\d+\b/g, "")
            .replace(/\/[\w/.-]+\.(ts|js|mjs|cjs)/g, "")
            .replace(/node:(internal|fs|http|net)\/\S+/g, "")
            .trim(),
        )
        .filter((m) => m.length > 0 && m.length < 300);

      if (safe.length > 0) result[field] = safe;
    }
  }

  return Object.keys(result).length > 0 ? result : undefined;
}

// ─── UX Message Map ───────────────────────────────────────────────────────────
// Hanya 6 tipe error ini yang boleh di-override ke pesan UX-friendly:
// auth, validation, credentials, notFound, conflict, internal
const UX_MESSAGES: Record<string, string> = {
  UNAUTHORIZED: "Sesi kamu sudah berakhir. Silakan login kembali.",
  VALIDATION_ERROR: "Ada data yang tidak sesuai. Periksa kembali isian kamu.",
  INVALID_CREDENTIALS: "Email atau password salah.",
  NOT_FOUND: "Halaman atau data yang kamu cari tidak ditemukan.",
  CONFLICT_ERROR: "Data sudah ada. Coba gunakan yang berbeda.",
  INTERNAL_SERVER_ERROR:
    "Terjadi kesalahan pada server. Tim kami sedang menangani.",
};

const getUxMessage = (code: string, fallback: string): string =>
  fallback || UX_MESSAGES[code] || "Terjadi kesalahan";

// ─── Main Error Handler ───────────────────────────────────────────────────────
export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  // Saat test: diam saja, output dihandle oleh test logger
  if (!isTest) {
    if (isDev) {
      console.error("=== [DEBUG ERROR] ===");
      console.error(err);
    } else {
      console.error(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          method: req.method,
          path: req.path,
          ip: req.ip,
          error: (err as Error)?.name ?? "UnknownError",
          code: (err as AppError)?.code ?? "UNKNOWN",
        }),
      );
    }
  }

  // ── Zod Validation Error ──────────────────────────────────
  if (err instanceof ZodError) {
    const fieldErrors = formatZodIssues(err);
    const sanitized = sanitizeFieldErrors(fieldErrors);

    return res.status(400).json({
      status: "error",
      code: "VALIDATION_ERROR",
      message: getUxMessage("VALIDATION_ERROR", "Data tidak valid"),
      errors: sanitized,
      ...(isDev ? { debug: fieldErrors } : {}),
    });
  }

  // ── AppError (ForbiddenError, OutOfStockError, dll) ───────────────────────
  if (err instanceof AppError) {
    const isValidation = err.code === "VALIDATION_ERROR";
    const sanitized = isValidation
      ? sanitizeFieldErrors(err.details)
      : undefined;

    return res.status(err.statusCode).json({
      status: "error",
      code: err.code,
      // Untuk 6 kode di UX_MESSAGES: message di-override kalau err.message kosong.
      // Untuk kode lain: selalu pakai err.message asli.
      message: getUxMessage(err.code, err.message),
      ...(sanitized ? { errors: sanitized } : {}),
      ...(isDev && err.details && !isValidation ? { debug: err.details } : {}),
    });
  }

  // ── Prisma Known Errors ───────────────────────────────────
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return handlePrismaError(err, res);
  }

  // ── Fallback 500 ──────────────────────────────────────────
  return res.status(500).json({
    status: "error",
    code: "INTERNAL_SERVER_ERROR",
    message: getUxMessage(
      "INTERNAL_SERVER_ERROR",
      "Terjadi kesalahan pada server",
    ),
    ...(isDev ? { debug: (err as Error)?.message ?? String(err) } : {}),
  });
};

// ─── Prisma Error Handler ─────────────────────────────────────────────────────
function handlePrismaError(
  err: Prisma.PrismaClientKnownRequestError,
  res: Response,
) {
  switch (err.code) {
    case "P2002": {
      const target = err.meta?.target;
      let message = "Data sudah terdaftar";

      if (Array.isArray(target)) {
        if (target.includes("email"))
          message = "Email sudah digunakan, coba gunakan email lain";
        else if (target.includes("userName"))
          message = "Username sudah digunakan, coba yang lain";
        else if (target.includes("slug"))
          message = "Slug produk sudah dipakai, coba nama lain";
        else if (target.includes("hex"))
          message = "Warna cream (kode hex) ini sudah terdaftar";
        else if (target.includes("orderNumber"))
          message = "Nomor order sudah ada, coba generate ulang";
      }

      return res.status(409).json({
        status: "error",
        code: "CONFLICT_ERROR",
        message,
      });
    }

    case "P2003":
      return res.status(422).json({
        status: "error",
        code: "INVALID_REFERENCE",
        message: "Data referensi tidak ditemukan atau sudah dihapus",
      });

    case "P2025":
      return res.status(404).json({
        status: "error",
        code: "NOT_FOUND",
        message: getUxMessage("NOT_FOUND", "Data tidak ditemukan"),
      });

    default:
      return res.status(500).json({
        status: "error",
        code: "DATABASE_ERROR",
        message: "Gagal memproses data, coba lagi dalam beberapa saat",
      });
  }
}
