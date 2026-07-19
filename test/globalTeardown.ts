/**
 * test/globalTeardown.ts
 *
 * Dijalankan SEKALI setelah seluruh test suite selesai.
 * Memutus koneksi Prisma agar Jest bisa keluar dengan bersih.
 *
 * globalTeardown berjalan melalui Jest transformer (ts-jest),
 * namun path resolution menggunakan CJS rules — gunakan path tanpa .js
 */
export default async function globalTeardown() {
  const { prisma } = await import("../src/lib/prisma");
  await prisma.$disconnect();
}
