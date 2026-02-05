import express from "express";
import aiController from "../controllers/aiController";
import authMiddleware from "../middleware/authMiddleware";

const router = express.Router();

router.post("/search", authMiddleware, aiController.smartSearch.bind(aiController));
router.get("/analyze/:postId", authMiddleware, aiController.analyzePost.bind(aiController));
router.post("/suggestions", authMiddleware, aiController.generateSuggestions.bind(aiController));

export default router;
