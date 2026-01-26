import express from "express";
const router = express.Router();
import movieController from "../controllers/movieController";
import authMiddleware from "../middleware/authMiddleware";

/**
 * @swagger
 * /movie:
 *   get:
 *     summary: Get all movies
 *     description: Retrieve a list of all movies. No authentication required.
 *     tags: [Movies]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Maximum number of movies to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: Number of movies to skip for pagination
 *     responses:
 *       200:
 *         description: Successfully retrieved movies
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Movie'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/", movieController.get.bind(movieController));

/**
 * @swagger
 * /movie/{id}:
 *   get:
 *     summary: Get movie by ID
 *     description: Retrieve a specific movie by its ID. No authentication required.
 *     tags: [Movies]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Movie ID
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Successfully retrieved movie
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Movie'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/:id", movieController.getById.bind(movieController));

/**
 * @swagger
 * /movie:
 *   post:
 *     summary: Create a new movie
 *     description: Create a new movie entry. Requires authentication.
 *     tags: [Movies]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, releaseYear]
 *             properties:
 *               title:
 *                 type: string
 *                 description: Movie title
 *                 example: "The Matrix"
 *               releaseYear:
 *                 type: number
 *                 description: Year the movie was released
 *                 example: 1999
 *     responses:
 *       201:
 *         description: Movie successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Movie'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post("/", authMiddleware, movieController.post.bind(movieController));

/**
 * @swagger
 * /movie/{id}:
 *   delete:
 *     summary: Delete a movie
 *     description: Delete an existing movie by ID. Requires authentication. Only the creator can delete their movie.
 *     tags: [Movies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Movie ID
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Movie successfully deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Movie deleted successfully"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - Can only delete own movies
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete("/:id", authMiddleware, movieController.del.bind(movieController));

/**
 * @swagger
 * /movie/{id}:
 *   put:
 *     summary: Update a movie
 *     description: Update an existing movie by ID. Requires authentication. Only the creator can update their movie.
 *     tags: [Movies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Movie ID
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Movie title
 *                 example: "The Matrix Reloaded"
 *               releaseYear:
 *                 type: number
 *                 description: Year the movie was released
 *                 example: 2003
 *     responses:
 *       200:
 *         description: Movie successfully updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Movie'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - Can only update own movies
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.put("/:id", authMiddleware, movieController.put.bind(movieController));

export default router;
