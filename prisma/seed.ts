import "dotenv/config";
import bcrypt from "bcrypt";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const SALT_ROUNDS = 10;

  const adminPassword = await bcrypt.hash("admin123", SALT_ROUNDS);
  const ownerPassword = await bcrypt.hash("owner123", SALT_ROUNDS);

  // Seed akun Admin
  const admin = await prisma.user.upsert({
    where: { email: "admin@citracake.com" },
    update: {},
    create: {
      userName: "admin",
      email: "admin@citracake.com",
      name: "Admin Citra Cake",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  // Seed akun Owner
  const owner = await prisma.user.upsert({
    where: { email: "owner@citracake.com" },
    update: {},
    create: {
      userName: "owner",
      email: "owner@citracake.com",
      name: "Owner Citra Cake",
      password: ownerPassword,
      role: "OWNER",
    },
  });

  console.log("Seeder selesai:");
  console.log({ admin: admin.userName, owner: owner.userName });
}

main()
  .catch((e) => {
    console.error("Seeder error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
