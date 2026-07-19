import { prisma } from "../lib/prisma";
import { ValidationError, NotFoundError, ConflictError } from "../error/error";
import { CustomCakeOptionInput } from "../schema/customCakeSchema";

const validateWarnaCream = (category: string, body: Partial<CustomCakeOptionInput>) => {
  if (category.toLowerCase() === "warna-cream") {
    if (body.warna === undefined || body.warna === "") {
      throw new ValidationError({ warna: ["Warna wajib diisi untuk Warna Cream"] });
    }
    if (body.hex === undefined || body.hex === "") {
      throw new ValidationError({ hex: ["Kode Hex wajib diisi untuk Warna Cream"] });
    }
  }
};

export const createCustomCakeOptionService = async (
  category: string,
  body: CustomCakeOptionInput,
) => {
  const cat = category.toLowerCase();
  
  if (cat === "warna-cream") {
    validateWarnaCream(category, body);
    // Check hex uniqueness
    const existing = await prisma.warnaCream.findUnique({ where: { hex: body.hex } });
    if (existing) throw new ConflictError("Kode hex warna cream sudah terdaftar");

    return prisma.warnaCream.create({
      data: {
        name: body.name,
        warna: body.warna!,
        hex: body.hex!,
        price: body.price,
        status: body.status,
      },
    });
  }

  switch (cat) {
    case "base-cake":
      return prisma.baseCake.create({ data: { name: body.name, price: body.price, status: body.status } });
    case "tipe-cream":
      return prisma.tipeCream.create({ data: { name: body.name, price: body.price, status: body.status } });
    case "layer":
      return prisma.layer.create({ data: { name: body.name, price: body.price, status: body.status } });
    case "ukuran":
      return prisma.size.create({ data: { name: body.name, price: body.price, status: body.status } });
    case "topping":
      return prisma.topping.create({ data: { name: body.name, price: body.price, status: body.status } });
    case "lilin":
      return prisma.lilin.create({ data: { name: body.name, price: body.price, status: body.status } });
    case "topper":
      return prisma.topper.create({ data: { name: body.name, price: body.price, status: body.status } });
    default:
      throw new ValidationError({ category: ["Kategori kustomisasi tidak valid"] });
  }
};

export const getAllCustomCakeOptionsService = async (category: string) => {
  const cat = category.toLowerCase();
  switch (cat) {
    case "base-cake":
      return prisma.baseCake.findMany({ orderBy: { createdAt: "desc" } });
    case "tipe-cream":
      return prisma.tipeCream.findMany({ orderBy: { createdAt: "desc" } });
    case "warna-cream":
      return prisma.warnaCream.findMany({ orderBy: { createdAt: "desc" } });
    case "layer":
      return prisma.layer.findMany({ orderBy: { createdAt: "desc" } });
    case "ukuran":
      return prisma.size.findMany({ orderBy: { createdAt: "desc" } });
    case "topping":
      return prisma.topping.findMany({ orderBy: { createdAt: "desc" } });
    case "lilin":
      return prisma.lilin.findMany({ orderBy: { createdAt: "desc" } });
    case "topper":
      return prisma.topper.findMany({ orderBy: { createdAt: "desc" } });
    default:
      throw new ValidationError({ category: ["Kategori kustomisasi tidak valid"] });
  }
};

export const getOneCustomCakeOptionService = async (category: string, id: string) => {
  const cat = category.toLowerCase();
  let item;
  switch (cat) {
    case "base-cake":
      item = await prisma.baseCake.findUnique({ where: { id } });
      break;
    case "tipe-cream":
      item = await prisma.tipeCream.findUnique({ where: { id } });
      break;
    case "warna-cream":
      item = await prisma.warnaCream.findUnique({ where: { id } });
      break;
    case "layer":
      item = await prisma.layer.findUnique({ where: { id } });
      break;
    case "ukuran":
      item = await prisma.size.findUnique({ where: { id } });
      break;
    case "topping":
      item = await prisma.topping.findUnique({ where: { id } });
      break;
    case "lilin":
      item = await prisma.lilin.findUnique({ where: { id } });
      break;
    case "topper":
      item = await prisma.topper.findUnique({ where: { id } });
      break;
    default:
      throw new ValidationError({ category: ["Kategori kustomisasi tidak valid"] });
  }
  if (!item) throw new NotFoundError(`${category} dengan ID tersebut`);
  return item;
};

export const updateCustomCakeOptionService = async (
  category: string,
  id: string,
  body: Partial<CustomCakeOptionInput>,
) => {
  const cat = category.toLowerCase();
  // Check existence
  await getOneCustomCakeOptionService(category, id);

  if (cat === "warna-cream") {
    if (body.hex) {
      const collision = await prisma.warnaCream.findFirst({ where: { hex: body.hex, NOT: { id } } });
      if (collision) throw new ConflictError("Kode hex warna cream sudah digunakan");
    }
    return prisma.warnaCream.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.warna && { warna: body.warna }),
        ...(body.hex && { hex: body.hex }),
        ...(body.price !== undefined && { price: body.price }),
        ...(body.status !== undefined && { status: body.status }),
      },
    });
  }

  const updateData = {
    ...(body.name && { name: body.name }),
    ...(body.price !== undefined && { price: body.price }),
    ...(body.status !== undefined && { status: body.status }),
  };

  switch (cat) {
    case "base-cake":
      return prisma.baseCake.update({ where: { id }, data: updateData });
    case "tipe-cream":
      return prisma.tipeCream.update({ where: { id }, data: updateData });
    case "layer":
      return prisma.layer.update({ where: { id }, data: updateData });
    case "ukuran":
      return prisma.size.update({ where: { id }, data: updateData });
    case "topping":
      return prisma.topping.update({ where: { id }, data: updateData });
    case "lilin":
      return prisma.lilin.update({ where: { id }, data: updateData });
    case "topper":
      return prisma.topper.update({ where: { id }, data: updateData });
    default:
      throw new ValidationError({ category: ["Kategori kustomisasi tidak valid"] });
  }
};

export const deleteCustomCakeOptionService = async (category: string, id: string) => {
  const cat = category.toLowerCase();
  // Check existence
  await getOneCustomCakeOptionService(category, id);

  try {
    switch (cat) {
      case "base-cake":
        await prisma.baseCake.delete({ where: { id } });
        break;
      case "tipe-cream":
        await prisma.tipeCream.delete({ where: { id } });
        break;
      case "warna-cream":
        await prisma.warnaCream.delete({ where: { id } });
        break;
      case "layer":
        await prisma.layer.delete({ where: { id } });
        break;
      case "ukuran":
        await prisma.size.delete({ where: { id } });
        break;
      case "topping":
        await prisma.topping.delete({ where: { id } });
        break;
      case "lilin":
        await prisma.lilin.delete({ where: { id } });
        break;
      case "topper":
        await prisma.topper.delete({ where: { id } });
        break;
      default:
        throw new ValidationError({ category: ["Kategori kustomisasi tidak valid"] });
    }
  } catch (error: any) {
    if (error.code === "P2003") {
      throw new ConflictError(
        "Tidak bisa menghapus opsi ini karena sudah digunakan dalam pesanan kustom. Silakan nonaktifkan status (set status = false) opsi ini saja."
      );
    }
    throw error;
  }
};
