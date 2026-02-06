import express from "express";
import aiController from "../controllers/aiController";
import authMiddleware from "../middleware/authMiddleware";

const router = express.Router();

/**
 * @swagger
 * /ai/search:
 *   post:
 *     summary: Smart search for posts using AI
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
 *                 description: Search query
 *               page:
 *                 type: integer
 *                 default: 1
 *               limit:
 *                 type: integer
 *                 default: 10
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 posts:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Post'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       400:
 *         description: Query is required
 *       401:
 *         description: Unauthorized
 */
router.post("/search", authMiddleware, aiController.smartSearch.bind(aiController));

/**
 * @swagger
 * /ai/analyze/{postId}:
 *   get:
 *     summary: Analyze a post using AI
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post analysis
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 analysis:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Post not found
 */
router.get("/analyze/:postId", authMiddleware, aiController.analyzePost.bind(aiController));

/**
 * @swagger
 * /ai/suggestions:
 *   post:
 *     summary: Generate post suggestions using AI
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 description: Content context for suggestions
 *               mood:
 *                 type: string
 *                 description: Desired mood for suggestions
 *     responses:
 *       200:
 *         description: Generated suggestions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 suggestions:
 *                   type: array
 *                   items:
 *                     type: string
 *       401:
 *         description: Unauthorized
 */
router.post("/suggestions", authMiddleware, aiController.generateSuggestions.bind(aiController));

export default router;
