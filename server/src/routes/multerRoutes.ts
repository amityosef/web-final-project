import express, { Request, Response } from "express";
const router = express.Router();
import multer from "multer";
import path from "path";

const base = "http://" + process.env.DOMAIN_BASE + ":" + process.env.PORT + "/";
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/')
    },
    filename: function (req, file, cb) {
        const ext = file.originalname.split('.')
            .filter(Boolean) // removes empty extensions (e.g. `filename...txt`)
            .slice(1)
            .join('.')
        cb(null, Date.now() + "." + ext)
    }
})
const upload = multer({ storage: storage });

router.post('/', upload.single("file"), function (req: any, res: any) {
    console.log("router.post(/file: " + base + req.file.path)
    res.status(200).send({ url: base + req.file.path })
});


export default router;

// File filter to accept only images