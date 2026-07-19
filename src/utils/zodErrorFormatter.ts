import { ZodError } from "zod";

// ─── Enum Label Map ────────────────────────────────────────────────────────
// Disesuaikan dengan enum di schema Citra Cake (bukan Klasin lagi)
const ENUM_LABELS: Record<string, string> = {
  // Role
  ADMIN: "Admin",
  USER: "User",
  OWNER: "Owner",

  // JenisKelamin
  LAKI_LAKI: "Laki-laki",
  PEREMPUAN: "Perempuan",

  // StockType
  READY_STOCK: "Ready Stock",
  PRE_ORDER: "Pre-Order",

  // DiscountType
  PERCENTAGE: "Persentase",
  FIXED: "Nominal Tetap",

  // CartItemType
  PRODUCT: "Produk",
  CUSTOM_CAKE: "Custom Cake",

  // OrderStatus
  PENDING: "Menunggu",
  REJECTED: "Ditolak",
  PROCESSING: "Diproses",
  SHIPPED: "Dikirim",
  ARRIVED: "Sampai Tujuan",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
  RETURNED: "Dikembalikan",

  // RequestType
  CANCEL: "Pembatalan",
  RETURN: "Pengembalian",

  // RequestStatus
  ACCEPTED: "Diterima",
  // PENDING & REJECTED sudah ada di atas (dipakai bareng OrderStatus)

  // PaymentStatus
  UNPAID: "Belum Bayar",
  PAID: "Sudah Bayar",
  FAILED: "Gagal",
  REFUNDED: "Dikembalikan (Refund)",

  // ReturnReasonType
  CAKE_DAMAGED: "Cake Rusak",
  ORDER_MISMATCH: "Pesanan Tidak Sesuai",
  QUALITY_MISMATCH: "Rasa/Kualitas Tidak Sesuai",
  OTHER: "Lainnya",

  // TrackingStatus
  PACKED: "Paket Dikemas",
  PICKED_UP: "Diambil Kurir",
  ON_THE_WAY: "Dalam Perjalanan",
  NEARBY: "Sudah Dekat Lokasi",
  ARRIVED_TRACKING: "Sampai Tujuan", // alias, ARRIVED sudah dipakai OrderStatus

  // PaymentMethod
  TRANSFER: "Transfer Bank",
  COD: "Bayar di Tempat (COD)",
  PICKUP: "Ambil Sendiri",
};

function labelize(value: unknown): string {
  const str = String(value);
  return ENUM_LABELS[str] ?? str;
}

// ─── Translator per issue code ───────────────────────────────────────────────
function translateZodIssue(issue: ZodError["issues"][number]): string {
  switch (issue.code) {
    case "invalid_type":
      return "Tipe data tidak sesuai";

    case "invalid_value": {
      if ("values" in issue && Array.isArray(issue.values)) {
        return `Pilih salah satu dari: ${issue.values.map(labelize).join(", ")}`;
      }
      return "Nilai tidak valid";
    }

    case "too_small": {
      if ("minimum" in issue) {
        return issue.origin === "string"
          ? `Minimal ${issue.minimum} karakter`
          : `Minimal ${issue.minimum}`;
      }
      return "Nilai terlalu kecil";
    }

    case "too_big": {
      if ("maximum" in issue) {
        return issue.origin === "string"
          ? `Maksimal ${issue.maximum} karakter`
          : `Maksimal ${issue.maximum}`;
      }
      return "Nilai terlalu besar";
    }

    case "unrecognized_keys": {
      if ("keys" in issue && Array.isArray(issue.keys)) {
        return `Field tidak dikenal: ${issue.keys.join(", ")}`;
      }
      return "Ada field yang tidak dikenal";
    }

    case "invalid_format":
      return "Format tidak valid";

    case "custom":
      return issue.message; // refine message manual, udah Bahasa Indonesia

    default:
      return issue.message; // fallback aman kalau ada code yang belum di-handle
  }
}

// ─── Formatter utama ──────────────────────────────────────────────────────────
export function formatZodIssues(error: ZodError): Record<string, string[]> {
  const result: Record<string, string[]> = Object.create(null);

  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_root";
    const message = translateZodIssue(issue);
    if (!result[key]) result[key] = [];
    result[key].push(message);
  }

  return result;
}
