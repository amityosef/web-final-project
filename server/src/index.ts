import express, { Express } from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import cors from "cors";
import commentRoutes from "./routes/commentRoutes";
import authRoutes from "./routes/authRoutes";
import postRoutes from "./routes/postRoutes";
import userRoutes from "./routes/userRoutes";
import aiRoutes from "./routes/aiRoutes";
import multerRoute from "./routes/multerRoutes";
import { specs, swaggerUi } from "./swagger";
import pgService from "./services/pgService";
import embeddingService from "./services/embeddingService";

dotenv.config({ path: ".env" });

const app = express();

const initApp = () => {
    return new Promise<Express>((resolve, reject) => {
        app.use(express.urlencoded({ extended: false }));
        app.use(express.json());

        const allowedOrigins = process.env.CORS_ORIGIN?.split(",") || [
            "http://localhost:5173",
            "https://localhost:5173",
        ];

        app.use(
            cors({
                origin: (origin, callback) => {
                    if (!origin || allowedOrigins.includes(origin)) {
                        callback(null, true);
                    } else {
                        callback(new Error("Not allowed by CORS"));
                    }
                },
                credentials: true,
                methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                allowedHeaders: [
                    "Origin",
                    "X-Requested-With",
                    "Content-Type",
                    "Accept",
                    "Authorization",
                ],
            })
        );

        app.use("/public", express.static(path.join(__dirname, "../public")));
        app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));
        app.use("/upload", multerRoute);

        if (process.env.NODE_ENV !== "production" || process.env.ENABLE_SWAGGER === "true") {
            app.use(
                "/api-docs",
                swaggerUi.serve,
                swaggerUi.setup(specs, {
                    explorer: true,
                    customCss: ".swagger-ui .topbar { display: none }",
                    customSiteTitle: "Social Network API Documentation",
                })
            );

            app.get("/api-docs.json", (req, res) => {
                res.setHeader("Content-Type", "application/json");
                res.send(specs);
            });
        }

        app.use("/auth", authRoutes);
        app.use("/user", userRoutes);
        app.use("/post", postRoutes);
        app.use("/comment", commentRoutes);
        app.use("/ai", aiRoutes);

        app.get("/health", (req, res) => {
            res.status(200).json({
                status: "ok",
                environment: process.env.NODE_ENV || "development",
                timestamp: new Date().toISOString(),
            });
        });

        app.use((req, res) => {
            res.status(404).json({ error: "Not Found" });
        });

        const dbUri = process.env.MONGODB_URI;
        if (!dbUri) {
            reject(new Error("MONGODB_URI is not defined"));
            return;
        }

        mongoose
            .connect(dbUri)
            .then(async () => {
                try {
                    await pgService.initPostVectorsTable();
                } catch (err) {
                    console.warn("PostgreSQL init failed (vector search disabled):", err);
                }

                embeddingService.preloadModel().catch((err) => {
                    console.warn("Embedding model preload failed:", err.message);
                });

                resolve(app);
            })
            .catch((error) => reject(error));

        mongoose.connection.on("error", (error) => console.error("MongoDB error:", error));
    });
};

export default initApp;
