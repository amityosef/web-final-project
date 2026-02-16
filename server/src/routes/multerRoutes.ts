import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";

const router = express.Router();

const uploadDir = path.join(process.cwd(), "public/uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
        const ext = file.originalname.split(".").filter(Boolean).slice(1).join(".");
        cb(null, Date.now() + "." + ext);
    },
});

const upload = multer({ storage });

/**
 * @swagger
 * /upload:
 *   post:
 *     summary: Upload a file
 *     tags: [Upload]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                   description: URL of the uploaded file
 */
router.post("/", upload.single("file"), (req, res) => {
    const base = `http://${process.env.DOMAIN_BASE}`;
    const port = process.env.NODE_ENV === "production" ? "" : `:${process.env.PORT}`;
    const relativePath = `/public/uploads/${req.file?.filename}`;
    res.status(200).send({ url: base + port + relativePath });
});

export default router;
