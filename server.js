import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.js";
import menuRoutes from "./routes/menu.js";
import cartRoutes from "./routes/cart.js";
import orderRoutes from "./routes/order.js";
import adminRoutes from "./routes/admin.js";
import { initializeCategories } from "./utils/initializeCategories.js";

dotenv.config();

const app = express();

/* ------------------ Middleware ------------------ */
app.use(cors({
  origin: "*",     // you can later lock this to your Vercel URL
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ------------------ Routes ------------------ */
app.use("/api/auth", authRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);

/* ------------------ Health Check ------------------ */
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Foodie API is running ✅" });
});

/* ------------------ MongoDB ------------------ */
const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("❌ MONGODB_URI not found in environment variables");
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    await initializeCategories();

  } catch (error) {
    console.error("MongoDB connection failed:");
    console.error(error.message);
    process.exit(1);
  }
};

connectDB();

/* ------------------ Server ------------------ */
const PORT = process.env.PORT || 10000;

app.listen(PORT, () =>
  console.log(`✅ Server running on port ${PORT}`)
);

