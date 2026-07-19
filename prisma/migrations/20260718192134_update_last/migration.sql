/*
  Warnings:

  - The values [ORDERED,PACKING] on the enum `OrderStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `quantity` on the `CartItem` table. All the data in the column will be lost.
  - You are about to drop the column `sizeId` on the `CartItem` table. All the data in the column will be lost.
  - You are about to drop the column `variantId` on the `CartItem` table. All the data in the column will be lost.
  - You are about to drop the column `courierName` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `shippingAddress` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `trackingNumber` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `sizeLabel` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `variantName` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `categoryId` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `pricingType` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `isBase` on the `Size` table. All the data in the column will be lost.
  - You are about to drop the column `label` on the `Size` table. All the data in the column will be lost.
  - You are about to drop the column `priceAdjust` on the `Size` table. All the data in the column will be lost.
  - You are about to drop the column `productId` on the `Size` table. All the data in the column will be lost.
  - You are about to drop the column `stock` on the `Size` table. All the data in the column will be lost.
  - You are about to drop the `Category` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OrderLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Variants` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[customCakeId]` on the table `CartItem` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[customCakeId]` on the table `OrderItem` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userName]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `type` to the `CartItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `address` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `city` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phoneNumber` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `postalCode` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recipientName` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subtotal` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nameSnapshot` to the `OrderItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `priceSnapshot` to the `OrderItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `OrderItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `category` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Size` table without a default value. This is not possible if the table is not empty.
  - Added the required column `price` to the `Size` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "JenisKelamin" AS ENUM ('LAKI_LAKI', 'PEREMPUAN');

-- CreateEnum
CREATE TYPE "StockType" AS ENUM ('READY_STOCK', 'PRE_ORDER');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED');

-- CreateEnum
CREATE TYPE "CartItemType" AS ENUM ('PRODUCT', 'CUSTOM_CAKE');

-- CreateEnum
CREATE TYPE "RequestType" AS ENUM ('CANCEL', 'RETURN');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PAID', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "ReturnReasonType" AS ENUM ('CAKE_DAMAGED', 'ORDER_MISMATCH', 'QUALITY_MISMATCH', 'OTHER');

-- CreateEnum
CREATE TYPE "TrackingStatus" AS ENUM ('PACKED', 'PICKED_UP', 'ON_THE_WAY', 'NEARBY', 'ARRIVED');

-- DropForeignKey (dipindah ke atas, harus sebelum OrderStatus di-alter karena OrderLog.status masih pakai enum lama)
ALTER TABLE "OrderLog" DROP CONSTRAINT "OrderLog_orderId_fkey";

-- DropTable (dipindah ke atas, sebelum OrderStatus di-alter)
DROP TABLE "OrderLog";

-- AlterEnum
BEGIN;
CREATE TYPE "OrderStatus_new" AS ENUM ('PENDING', 'REJECTED', 'PROCESSING', 'SHIPPED', 'ARRIVED', 'COMPLETED', 'CANCELLED', 'RETURNED');
ALTER TABLE "public"."Order" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Order" ALTER COLUMN "status" TYPE "OrderStatus_new" USING ("status"::text::"OrderStatus_new");
ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";
ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";
DROP TYPE "public"."OrderStatus_old";
ALTER TABLE "Order" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'OWNER';

-- DropForeignKey
ALTER TABLE "CartItem" DROP CONSTRAINT "CartItem_productId_fkey";

-- DropForeignKey
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_productId_fkey";

-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "Size" DROP CONSTRAINT "Size_productId_fkey";

-- DropForeignKey
ALTER TABLE "Variants" DROP CONSTRAINT "Variants_productId_fkey";

-- AlterTable
ALTER TABLE "CartItem" DROP COLUMN "quantity",
DROP COLUMN "sizeId",
DROP COLUMN "variantId",
ADD COLUMN     "customCakeId" TEXT,
ADD COLUMN     "productSizeId" TEXT,
ADD COLUMN     "qty" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "type" "CartItemType" NOT NULL,
ALTER COLUMN "productId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "courierName",
DROP COLUMN "shippingAddress",
DROP COLUMN "trackingNumber",
ADD COLUMN     "address" TEXT NOT NULL,
ADD COLUMN     "city" TEXT NOT NULL,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
ADD COLUMN     "phoneNumber" TEXT NOT NULL,
ADD COLUMN     "postalCode" TEXT NOT NULL,
ADD COLUMN     "recipientName" TEXT NOT NULL,
ADD COLUMN     "shippingCost" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "subtotal" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "OrderItem" DROP COLUMN "name",
DROP COLUMN "price",
DROP COLUMN "quantity",
DROP COLUMN "sizeLabel",
DROP COLUMN "variantName",
ADD COLUMN     "customCakeId" TEXT,
ADD COLUMN     "nameSnapshot" TEXT NOT NULL,
ADD COLUMN     "priceSnapshot" INTEGER NOT NULL,
ADD COLUMN     "productSizeId" TEXT,
ADD COLUMN     "qty" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "type" "CartItemType" NOT NULL,
ALTER COLUMN "productId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "categoryId",
DROP COLUMN "pricingType",
ADD COLUMN     "category" TEXT NOT NULL,
ADD COLUMN     "discountType" "DiscountType",
ADD COLUMN     "discountValue" INTEGER,
ADD COLUMN     "hasDiscount" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "stockType" "StockType" NOT NULL DEFAULT 'READY_STOCK',
ADD COLUMN     "variants" TEXT[];

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "jenisKelamin" "JenisKelamin";

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "foto_public_id" TEXT,
ADD COLUMN     "foto_url" TEXT;

-- AlterTable
ALTER TABLE "Size" DROP COLUMN "isBase",
DROP COLUMN "label",
DROP COLUMN "priceAdjust",
DROP COLUMN "productId",
DROP COLUMN "stock",
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "price" INTEGER NOT NULL,
ADD COLUMN     "status" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "userName" TEXT;

-- DropTable
DROP TABLE "Category";

-- DropTable
DROP TABLE "Variants";

-- DropEnum
DROP TYPE "PricingType";

-- CreateTable
CREATE TABLE "ProductSize" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductSize_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BaseCake" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BaseCake_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TipeCream" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TipeCream_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WarnaCream" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "warna" TEXT NOT NULL,
    "hex" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WarnaCream_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Layer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Layer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Topping" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Topping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lilin" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lilin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Topper" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Topper_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomCake" (
    "id" TEXT NOT NULL,
    "baseCakeId" TEXT NOT NULL,
    "tipeCreamId" TEXT NOT NULL,
    "warnaCreamId" TEXT NOT NULL,
    "topperId" TEXT,
    "lilinId" TEXT,
    "ucapan" TEXT,
    "catatan" TEXT,
    "dekorasiLainnya" TEXT,
    "lilinAngkaGoldQty" INTEGER NOT NULL DEFAULT 0,
    "totalPrice" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomCake_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomCakeLayer" (
    "id" TEXT NOT NULL,
    "customCakeId" TEXT NOT NULL,
    "layerId" TEXT NOT NULL,
    "sizeId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "CustomCakeLayer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomCakeTopping" (
    "id" TEXT NOT NULL,
    "customCakeId" TEXT NOT NULL,
    "toppingId" TEXT NOT NULL,
    "qty" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "CustomCakeTopping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderRequest" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "type" "RequestType" NOT NULL,
    "reasonType" "ReturnReasonType",
    "reasonNote" TEXT,
    "proofImages" TEXT[],
    "proofIds" TEXT[],
    "cancelReason" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,
    "processedBy" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentSubmission" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "proofUrl" TEXT NOT NULL,
    "proofId" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "rejectedNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderTracking" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "status" "TrackingStatus" NOT NULL,
    "location" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderTracking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductSize_productId_idx" ON "ProductSize"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "WarnaCream_hex_key" ON "WarnaCream"("hex");

-- CreateIndex
CREATE INDEX "CustomCakeLayer_customCakeId_idx" ON "CustomCakeLayer"("customCakeId");

-- CreateIndex
CREATE INDEX "CustomCakeTopping_customCakeId_idx" ON "CustomCakeTopping"("customCakeId");

-- CreateIndex
CREATE INDEX "OrderRequest_orderId_idx" ON "OrderRequest"("orderId");

-- CreateIndex
CREATE INDEX "PaymentSubmission_orderId_idx" ON "PaymentSubmission"("orderId");

-- CreateIndex
CREATE INDEX "OrderTracking_orderId_idx" ON "OrderTracking"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "CartItem_customCakeId_key" ON "CartItem"("customCakeId");

-- CreateIndex
CREATE INDEX "CartItem_userId_idx" ON "CartItem"("userId");

-- CreateIndex
CREATE INDEX "Order_userId_idx" ON "Order"("userId");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE UNIQUE INDEX "OrderItem_customCakeId_key" ON "OrderItem"("customCakeId");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "Product_category_idx" ON "Product"("category");

-- CreateIndex
CREATE INDEX "Product_isPublished_idx" ON "Product"("isPublished");

-- CreateIndex
CREATE UNIQUE INDEX "User_userName_key" ON "User"("userName");

-- AddForeignKey
ALTER TABLE "ProductSize" ADD CONSTRAINT "ProductSize_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomCake" ADD CONSTRAINT "CustomCake_baseCakeId_fkey" FOREIGN KEY ("baseCakeId") REFERENCES "BaseCake"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomCake" ADD CONSTRAINT "CustomCake_tipeCreamId_fkey" FOREIGN KEY ("tipeCreamId") REFERENCES "TipeCream"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomCake" ADD CONSTRAINT "CustomCake_warnaCreamId_fkey" FOREIGN KEY ("warnaCreamId") REFERENCES "WarnaCream"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomCake" ADD CONSTRAINT "CustomCake_topperId_fkey" FOREIGN KEY ("topperId") REFERENCES "Topper"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomCake" ADD CONSTRAINT "CustomCake_lilinId_fkey" FOREIGN KEY ("lilinId") REFERENCES "Lilin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomCakeLayer" ADD CONSTRAINT "CustomCakeLayer_customCakeId_fkey" FOREIGN KEY ("customCakeId") REFERENCES "CustomCake"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomCakeLayer" ADD CONSTRAINT "CustomCakeLayer_layerId_fkey" FOREIGN KEY ("layerId") REFERENCES "Layer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomCakeLayer" ADD CONSTRAINT "CustomCakeLayer_sizeId_fkey" FOREIGN KEY ("sizeId") REFERENCES "Size"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomCakeTopping" ADD CONSTRAINT "CustomCakeTopping_customCakeId_fkey" FOREIGN KEY ("customCakeId") REFERENCES "CustomCake"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomCakeTopping" ADD CONSTRAINT "CustomCakeTopping_toppingId_fkey" FOREIGN KEY ("toppingId") REFERENCES "Topping"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_productSizeId_fkey" FOREIGN KEY ("productSizeId") REFERENCES "ProductSize"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_customCakeId_fkey" FOREIGN KEY ("customCakeId") REFERENCES "CustomCake"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productSizeId_fkey" FOREIGN KEY ("productSizeId") REFERENCES "ProductSize"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_customCakeId_fkey" FOREIGN KEY ("customCakeId") REFERENCES "CustomCake"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderRequest" ADD CONSTRAINT "OrderRequest_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentSubmission" ADD CONSTRAINT "PaymentSubmission_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderTracking" ADD CONSTRAINT "OrderTracking_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;