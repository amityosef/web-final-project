import express, { Express } from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

// Load environment variables based on NODE_ENV
dotenv.config({ path: ".env" });

// Import routes
import movieRoutes from "./routes/movieRoutes";
import commentRoutes from "./routes/commentRoutes";
import authRoutes from "./routes/authRoutes";
import postRoutes from "./routes/postRoutes";
import userRoutes from "./routes/userRoutes";
import aiRoutes from "./routes/aiRoutes";
import multerRoute from "./routes/multerRoutes";
import { specs, swaggerUi } from "./swagger";
import cors from "cors";

const app = express();

const initApp = () => {
  const promise = new Promise<Express>((resolve, reject) => {
    app.use(express.urlencoded({ extended: false }));
    app.use(express.json());

    const allowedOrigins = process.env.CORS_ORIGIN?.split(",") || ["http://localhost:5173", "https://localhost:5173"];

    app.use(cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization"]
    }));

    // Static files
    app.use("/public", express.static(path.join(__dirname, "../public")));
    app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));

    // File upload route
    app.use("/upload", multerRoute);

    // Swagger Documentation (only in non-production or if explicitly enabled)
    if (process.env.NODE_ENV !== "production" || process.env.ENABLE_SWAGGER === "true") {
      app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs, {
        explorer: true,
        customCss: ".swagger-ui .topbar { display: none }",
        customSiteTitle: "Social Network API Documentation"
      }));

      app.get("/api-docs.json", (req, res) => {
        res.setHeader("Content-Type", "application/json");
        res.send(specs);
      });
    }

    // API Routes
    app.use("/auth", authRoutes);
    app.use("/user", userRoutes);
    app.use("/post", postRoutes);
    app.use("/comment", commentRoutes);
    app.use("/ai", aiRoutes);
    app.use("/movie", movieRoutes); // Legacy route, kept for backwards compatibility

    // Health check endpoint
    app.get("/health", (req, res) => {
      res.status(200).json({
        status: "ok",
        environment: process.env.NODE_ENV || "development",
        timestamp: new Date().toISOString()
      });
    });

    // 404 handler
    app.use((req, res) => {
      res.status(404).json({ error: "Not Found" });
    });

    // Database connection
    const dbUri = process.env.MONGODB_URI;
    if (!dbUri) {
      console.error("MONGODB_URI is not defined in the environment variables.");
      reject(new Error("MONGODB_URI is not defined"));
      return;
    }

    mongoose
      .connect(dbUri)
      .then(() => {
        console.log("Connected to MongoDB");
        resolve(app);
      })
      .catch((error) => {
        console.error("MongoDB connection error:", error);
        reject(error);
      });

    const db = mongoose.connection;
    db.on("error", (error) => {
      console.error("MongoDB error:", error);
    });
    db.on("disconnected", () => {
      console.log("MongoDB disconnected");
    });
  });
  return promise;
};

export default initApp;
