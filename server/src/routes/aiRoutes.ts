import express from "express";
const router = express.Router();
import aiController from "../controllers/aiController";
import authMiddleware from "../middleware/authMiddleware";

/**
 * @swagger
 * /ai/search:
 *   post:
 *     summary: Smart search posts using AI
 *     description: Search posts using natural language. AI will analyze your query and find relevant posts.
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
 *                 description: Natural language search query
 *                 example: "Find me posts about technology and innovation"
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
 *                 aiAnalysis:
 *                   type: object
 *                   properties:
 *                     searchTerms:
 *                       type: array
 *                       items:
 *                         type: string
 *                     topics:
 *                       type: array
 *                       items:
 *                         type: string
 *                     sentiment:
 *                       type: string
 *                     explanation:
 *                       type: string
 *                 totalResults:
 *                   type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       429:
 *         description: Rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Rate limit exceeded. Please try again later."
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post("/search", authMiddleware, aiController.smartSearch.bind(aiController));

/**
 * @swagger
 * /ai/analyze/{postId}:
 *   get:
 *     summary: Analyze a post using AI
 *     description: Get AI-powered analysis of a post's content including topic, sentiment, and suggested tags.
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID to analyze
 *     responses:
 *       200:
 *         description: Post analysis
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 postId:
 *                   type: string
 *                 analysis:
 *                   type: object
 *                   properties:
 *                     topic:
 *                       type: string
 *                     sentiment:
 *                       type: string
 *                       enum: [positive, negative, neutral]
 *                     tags:
 *                       type: array
 *                       items:
 *                         type: string
 *                     summary:
 *                       type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       429:
 *         description: Rate limit exceeded
 *       503:
 *         description: AI service not available
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/analyze/:postId", authMiddleware, aiController.analyzePost.bind(aiController));

/**
 * @swagger
 * /ai/suggestions:
 *   post:
 *     summary: Generate post suggestions using AI
 *     description: Get AI-generated post ideas based on a topic or interest.
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               topic:
 *                 type: string
 *                 description: Topic or interest for suggestions
 *                 example: "photography tips"
 *     responses:
 *       200:
 *         description: Post suggestions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 suggestions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       title:
 *                         type: string
 *                       content:
 *                         type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       429:
 *         description: Rate limit exceeded
 *       503:
 *         description: AI service not available
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post("/suggestions", authMiddleware, aiController.generateSuggestions.bind(aiController));

export default router;
