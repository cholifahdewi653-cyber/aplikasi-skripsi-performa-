import express from "express";
import { prisma } from "./src/lib/prisma";
import cookieParser from "cookie-parser";
import "dotenv/config";

// Routes
import authRoutes from "./src/routes/authRoutes";
import productRoutes from "./src/routes/productRoutes";
import categoryRoutes from "./src/routes/categoryRoutes";
import profileRoutes from "./src/routes/profileRoutes";
import cartRoutes from "./src/routes/cartRoutes";
import orderRoutes from "./src/routes/orderRoutes";

const app = express();
const port = process.env.PORT;

// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/order", orderRoutes);

async function startServer() {
  try {
    await prisma.$connect();
    console.log("Database connected");
    app.listen(port, () => {
      console.log(`Server listening on http://localhost:${port}`);
    });
  } catch (error) {
    console.log(error);
    console.error(error);
  }
}

startServer();
