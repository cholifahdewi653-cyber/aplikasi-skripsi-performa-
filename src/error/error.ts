export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number,
    public readonly code: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class ValidationError extends AppError {
  constructor(details?: unknown) {
    super("", 400, "VALIDATION_ERROR", details);
    this.name = "ValidationError";
  }
}

export class AuthError extends AppError {
  constructor(message = "") {
    super(message, 401, "UNAUTHORIZED");
    this.name = "AuthError";
  }
}

export class CredentialError extends AppError {
  constructor(message = "Email atau password salah") {
    super(message, 401, "INVALID_CREDENTIALS");
    this.name = "CredentialError";
  }
}

export class OtpError extends AppError {
  constructor(message: string) {
    // wajib diisi, tidak di UX_MESSAGES
    super(message, 400, "OTP_ERROR");
    this.name = "OtpError";
  }
}

export class ForbiddenError extends AppError {
  constructor(
    message = "Kamu tidak punya akses ke halaman ini.",
    details?: unknown,
  ) {
    // FORBIDDEN tidak ada di UX_MESSAGES → default message wajib diisi di sini
    super(message, 403, "FORBIDDEN", details);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource = "") {
    // kalau dikasih resource, custom. Kalau tidak, UX_MESSAGES
    const message = resource ? `${resource} tidak ditemukan` : "";
    super(message, 404, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    // wajib diisi (pesan conflict selalu spesifik)
    super(message, 409, "CONFLICT_ERROR");
    this.name = "ConflictError";
  }
}

export class RateLimitError extends AppError {
  constructor(
    message = "Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.",
    public readonly retryAfter?: number,
  ) {
    // TOO_MANY_REQUESTS tidak ada di UX_MESSAGES → default message wajib diisi di sini
    super(message, 429, "TOO_MANY_REQUESTS");
    this.name = "RateLimitError";
  }
}

export class InternalError extends AppError {
  constructor(message = "") {
    // default kosong, pakai UX_MESSAGES
    super(message, 500, "INTERNAL_SERVER_ERROR");
    this.name = "InternalError";
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message = "Server sedang sibuk. Coba lagi dalam beberapa saat.") {
    // SERVICE_UNAVAILABLE tidak ada di UX_MESSAGES → default message wajib diisi di sini
    super(message, 503, "SERVICE_UNAVAILABLE");
    this.name = "ServiceUnavailableError";
  }
}

// ─── Stock / Order domain-specific (Citra Cake) ───────────────────────────
export class OutOfStockError extends AppError {
  constructor(message = "Stok produk tidak mencukupi") {
    super(message, 409, "OUT_OF_STOCK");
    this.name = "OutOfStockError";
  }
}

export class InvalidOrderStatusError extends AppError {
  constructor(message = "Status order tidak valid untuk aksi ini") {
    super(message, 400, "INVALID_ORDER_STATUS");
    this.name = "InvalidOrderStatusError";
  }
}
