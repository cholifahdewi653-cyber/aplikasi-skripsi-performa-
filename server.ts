import express from "express";
import { prisma } from "./lib/prisma";
import "dotenv/config";

const app = express();
const port = process.env.PORT;

async function startServer() {
  try {
    await prisma.$connect();
    console.log("Database connected");
    app.listen(port, () => {
      console.log(`Server listening on http://localhost:${port}`);
    });
  } catch (error) {}
}

startServer();
