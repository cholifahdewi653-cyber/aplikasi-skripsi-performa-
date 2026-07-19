import express from "express";
import { prisma } from "./src/lib/prisma";
import cookieParser from "cookie-parser";
import "dotenv/config";

// Routes
import authRoutes from "./src/routes/authRoutes";
import productRoutes from "./src/routes/productRoutes";
import customCakeRoutes from "./src/routes/customCakeRoutes";
import profileRoutes from "./src/routes/profileRoutes";
import cartRoutes from "./src/routes/cartRoutes";
import orderRoutes from "./src/routes/orderRoutes";
import reviewRoutes from "./src/routes/reviewRoutes";
import dashboardRoutes from "./src/routes/dashboardRoutes";


// Global error handler
import { errorHandler } from "./src/error/errorHandle";

const app = express();
const port = process.env.PORT;

// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/custom-cakes", customCakeRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/order", orderRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/dashboard", dashboardRoutes);


// ─── Global Error Handler (harus paling akhir) ────────────────────────────────
app.use(errorHandler);

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

if (process.env.NODE_ENV !== "test") {
  startServer();
}

export default app;
