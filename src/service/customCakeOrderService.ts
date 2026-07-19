import { prisma } from "../lib/prisma";
import { NotFoundError, ValidationError } from "../error/error";
import { CreateCustomCakeOrderServiceInput } from "../schema/customCakeOrderSchema";

const LILIN_ANGKA_GOLD_PRICE = 4000; // per pcs

// ─── Create Custom Cake ───────────────────────────────────────────────────────
export const createCustomCakeService = async (
  userId: string,
  body: CreateCustomCakeOrderServiceInput,
) => {
  // 1. Validasi dan ambil semua referensi option (harus aktif)
  const baseCake = await prisma.baseCake.findUnique({ where: { id: body.baseCakeId } });
  if (!baseCake || !baseCake.status) throw new NotFoundError("Base Cake");

  const tipeCream = await prisma.tipeCream.findUnique({ where: { id: body.tipeCreamId } });
  if (!tipeCream || !tipeCream.status) throw new NotFoundError("Tipe Cream");

  const warnaCream = await prisma.warnaCream.findUnique({ where: { id: body.warnaCreamId } });
  if (!warnaCream || !warnaCream.status) throw new NotFoundError("Warna Cream");

  // Validasi layers
  let layersTotal = 0;
  const layerData: { layerId: string; sizeId: string; position: number }[] = [];

  for (const l of body.layers) {
    const layer = await prisma.layer.findUnique({ where: { id: l.layerId } });
    if (!layer || !layer.status) throw new NotFoundError(`Layer dengan ID ${l.layerId}`);

    const size = await prisma.size.findUnique({ where: { id: l.sizeId } });
    if (!size || !size.status) throw new NotFoundError(`Ukuran dengan ID ${l.sizeId}`);

    layersTotal += layer.price + size.price;
    layerData.push({ layerId: l.layerId, sizeId: l.sizeId, position: l.position });
  }

  // Validasi toppings (opsional)
  let toppingsTotal = 0;
  const toppingData: { toppingId: string; qty: number }[] = [];

  if (body.toppings && body.toppings.length > 0) {
    for (const t of body.toppings) {
      const topping = await prisma.topping.findUnique({ where: { id: t.toppingId } });
      if (!topping || !topping.status) throw new NotFoundError(`Topping dengan ID ${t.toppingId}`);

      toppingsTotal += topping.price * t.qty;
      toppingData.push({ toppingId: t.toppingId, qty: t.qty });
    }
  }

  // Validasi lilin (opsional)
  let lilinPrice = 0;
  if (body.lilinId) {
    const lilin = await prisma.lilin.findUnique({ where: { id: body.lilinId } });
    if (!lilin || !lilin.status) throw new NotFoundError("Lilin");
    lilinPrice = lilin.price;
  }

  // Validasi topper (opsional)
  let topperPrice = 0;
  if (body.topperId) {
    const topper = await prisma.topper.findUnique({ where: { id: body.topperId } });
    if (!topper || !topper.status) throw new NotFoundError("Topper");
    topperPrice = topper.price;
  }

  // Lilin angka gold
  const lilinAngkaGoldTotal = (body.lilinAngkaGoldQty ?? 0) * LILIN_ANGKA_GOLD_PRICE;

  // 2. Hitung total price
  const totalPrice =
    baseCake.price +
    tipeCream.price +
    warnaCream.price +
    layersTotal +
    toppingsTotal +
    lilinPrice +
    topperPrice +
    lilinAngkaGoldTotal;

  // 3. Simpan ke database
  const customCake = await prisma.customCake.create({
    data: {
      baseCakeId: body.baseCakeId,
      tipeCreamId: body.tipeCreamId,
      warnaCreamId: body.warnaCreamId,
      topperId: body.topperId || null,
      lilinId: body.lilinId || null,
      ucapan: body.ucapan || null,
      catatan: body.catatan || null,
      dekorasiLainnya: body.dekorasiLainnya || null,
      lilinAngkaGoldQty: body.lilinAngkaGoldQty ?? 0,
      foto: body.foto || null,
      fotoPublicId: body.fotoPublicId || null,
      totalPrice,
      layers: {
        create: layerData.map((l) => ({
          layerId: l.layerId,
          sizeId: l.sizeId,
          position: l.position,
        })),
      },
      toppings: {
        create: toppingData.map((t) => ({
          toppingId: t.toppingId,
          qty: t.qty,
        })),
      },
    },
    include: {
      baseCake: true,
      tipeCream: true,
      warnaCream: true,
      topper: true,
      lilin: true,
      layers: { include: { layer: true, size: true }, orderBy: { position: "asc" } },
      toppings: { include: { topping: true } },
    },
  });

  return customCake;
};

// ─── Get All Custom Cakes Options (active only, for user selection) ───────────
export const getCustomCakeOptionsService = async () => {
  const [baseCakes, tipeCreams, warnaCreams, layers, sizes, toppings, lilins, toppers] =
    await Promise.all([
      prisma.baseCake.findMany({ where: { status: true }, orderBy: { name: "asc" } }),
      prisma.tipeCream.findMany({ where: { status: true }, orderBy: { name: "asc" } }),
      prisma.warnaCream.findMany({ where: { status: true }, orderBy: { name: "asc" } }),
      prisma.layer.findMany({ where: { status: true }, orderBy: { name: "asc" } }),
      prisma.size.findMany({ where: { status: true }, orderBy: { name: "asc" } }),
      prisma.topping.findMany({ where: { status: true }, orderBy: { name: "asc" } }),
      prisma.lilin.findMany({ where: { status: true }, orderBy: { name: "asc" } }),
      prisma.topper.findMany({ where: { status: true }, orderBy: { name: "asc" } }),
    ]);

  return {
    baseCakes,
    tipeCreams,
    warnaCreams,
    layers,
    sizes,
    toppings,
    lilins,
    toppers,
    lilinAngkaGoldPrice: LILIN_ANGKA_GOLD_PRICE,
  };
};

// ─── Get One Custom Cake Detail ───────────────────────────────────────────────
export const getOneCustomCakeService = async (id: string) => {
  const customCake = await prisma.customCake.findUnique({
    where: { id },
    include: {
      baseCake: true,
      tipeCream: true,
      warnaCream: true,
      topper: true,
      lilin: true,
      layers: { include: { layer: true, size: true }, orderBy: { position: "asc" } },
      toppings: { include: { topping: true } },
    },
  });

  if (!customCake) throw new NotFoundError("Custom Cake");

  return customCake;
};
