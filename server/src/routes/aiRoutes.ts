import express from "express";
import aiController from "../controllers/aiController";
import authMiddleware from "../middleware/authMiddleware";

const router = express.Router();

/**
 * @swagger
 * /ai/search:
 *   post:
 *     summary: RAG-powered semantic search across posts
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [query]
 *             properties:
 *               query:
 *                 type: string
 *                 description: The search query
 *     responses:
 *       200:
 *         description: AI-generated answer with source posts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 answer:
 *                   type: string
 *                 sources:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       postId:
 *                         type: string
 *                       content:
 *                         type: string
 *                       score:
 *                         type: number
 *                 processingTime:
 *                   type: number
 *                 noResults:
 *                   type: boolean
 */
router.post("/search", authMiddleware, aiController.smartSearch);

/**
 * @swagger
 * /ai/query:
 *   post:
 *     summary: RAG query (alias for /search)
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [query]
 *             properties:
 *               query:
 *                 type: string
 *     responses:
 *       200:
 *         description: RAG response with answer and sources
 */
router.post("/query", authMiddleware, aiController.ragSearch);

/**
 * @swagger
 * /ai/reindex:
 *   post:
 *     summary: Re-index all posts (admin utility)
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Reindex results
 */
router.post("/reindex", authMiddleware, aiController.reindexAllPosts);

export default router;
