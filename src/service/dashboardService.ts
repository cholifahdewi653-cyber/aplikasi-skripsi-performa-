import { prisma } from "../lib/prisma";

export const getOwnerDashboardService = async () => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  startDate.setHours(0, 0, 0, 0);

  // 1. Calculate Omset (last 30 days)
  const omsetMap = new Map<string, number>();
  const dates: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    dates.push(dateStr);
    omsetMap.set(dateStr, 0);
  }

  const ordersForOmset = await prisma.order.findMany({
    where: {
      createdAt: { gte: startDate },
      status: { notIn: ["REJECTED", "CANCELLED"] },
    },
    select: {
      createdAt: true,
      totalAmount: true,
    },
  });

  for (const o of ordersForOmset) {
    const dateStr = o.createdAt.toISOString().split("T")[0];
    if (omsetMap.has(dateStr)) {
      omsetMap.set(dateStr, omsetMap.get(dateStr)! + o.totalAmount);
    }
  }

  const omset = dates.map((date) => ({
    date,
    total: omsetMap.get(date) || 0,
  }));

  // 2. Active Orders (PROCESSING, SHIPPED, ARRIVED, CANCELLED, RETURNED)
  const activeOrders = await prisma.order.findMany({
    where: {
      status: {
        in: ["PROCESSING", "SHIPPED", "ARRIVED", "CANCELLED", "RETURNED"],
      },
    },
    orderBy: { updatedAt: "desc" },
    include: {
      user: {
        select: { name: true, email: true },
      },
      items: true,
    },
  });

  // 3. Orders in Last 30 Days (all statuses, all types)
  const orders30Days = await prisma.order.findMany({
    where: {
      createdAt: { gte: startDate },
    },
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: { name: true, email: true },
      },
      items: true,
    },
  });

  return { omset, activeOrders, orders30Days };
};

export const getAdminDashboardService = async () => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  startDate.setHours(0, 0, 0, 0);

  // 1. Active Orders (PROCESSING, SHIPPED, ARRIVED, CANCELLED, RETURNED)
  const activeOrders = await prisma.order.findMany({
    where: {
      status: {
        in: ["PROCESSING", "SHIPPED", "ARRIVED", "CANCELLED", "RETURNED"],
      },
    },
    orderBy: { updatedAt: "desc" },
    include: {
      user: {
        select: { name: true, email: true },
      },
      items: true,
    },
  });

  // 2. Orders in Last 30 Days (all statuses, all types)
  const orders30Days = await prisma.order.findMany({
    where: {
      createdAt: { gte: startDate },
    },
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: { name: true, email: true },
      },
      items: true,
    },
  });

  return { activeOrders, orders30Days };
};
