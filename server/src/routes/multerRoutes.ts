import express from "express";
import multer from "multer";

const router = express.Router();
const base = "http://" + process.env.DOMAIN_BASE + ":" + process.env.PORT + "/";

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, "public/uploads/"),
    filename: (_req, file, cb) => {
        const ext = file.originalname.split(".").filter(Boolean).slice(1).join(".");
        cb(null, Date.now() + "." + ext);
    }
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
router.post("/", upload.single("file"), (req: any, res: any) => {
    res.status(200).send({ url: base + req.file.path });
});

export default router;