import express from "express";
const router = express.Router();
import postController from "../controllers/postController";
import authMiddleware from "../middleware/authMiddleware";

/**
 * @swagger
 * /post:
 *   get:
 *     summary: Get all posts with pagination
 *     description: Retrieve a paginated list of all posts. Authentication optional but enhances response with like status.
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *       - {}
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Number of posts per page
 *       - in: query
 *         name: owner
 *         schema:
 *           type: string
 *         description: Filter by owner ID
 *     responses:
 *       200:
 *         description: Successfully retrieved posts
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
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/", (req, res, next) => {
    // Optional authentication - try to authenticate but don't fail if no token
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
        return authMiddleware(req as any, res, next);
    }
    next();
}, postController.getPosts.bind(postController));

/**
 * @swagger
 * /post/{id}:
 *   get:
 *     summary: Get post by ID
 *     description: Retrieve a specific post by its ID
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *       - {}
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Successfully retrieved post
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/:id", (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
        return authMiddleware(req as any, res, next);
    }
    next();
}, postController.getPostById.bind(postController));

/**
 * @swagger
 * /post:
 *   post:
 *     summary: Create a new post
 *     description: Create a new post. Requires authentication.
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content:
 *                 type: string
 *                 description: Post content
 *                 example: "This is my first post!"
 *               image:
 *                 type: string
 *                 description: URL to post image
 *                 example: "/public/uploads/1234567890.jpg"
 *     responses:
 *       201:
 *         description: Post successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post("/", authMiddleware, postController.createPost.bind(postController));

/**
 * @swagger
 * /post/{id}:
 *   put:
 *     summary: Update a post
 *     description: Update an existing post. Only the owner can update.
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 description: Updated post content
 *               image:
 *                 type: string
 *                 description: Updated image URL
 *     responses:
 *       200:
 *         description: Post successfully updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.put("/:id", authMiddleware, postController.updatePost.bind(postController));

/**
 * @swagger
 * /post/{id}:
 *   delete:
 *     summary: Delete a post
 *     description: Delete a post. Only the owner can delete.
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Post successfully deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Post deleted successfully"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete("/:id", authMiddleware, postController.deletePost.bind(postController));

/**
 * @swagger
 * /post/{id}/like:
 *   post:
 *     summary: Toggle like on a post
 *     description: Like or unlike a post. Requires authentication.
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Like toggled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 postId:
 *                   type: string
 *                 isLiked:
 *                   type: boolean
 *                 likesCount:
 *                   type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post("/:id/like", authMiddleware, postController.toggleLike.bind(postController));

/**
 * @swagger
 * /post/user/{userId}:
 *   get:
 *     summary: Get posts by user
 *     description: Retrieve all posts by a specific user with pagination
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *       - {}
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Posts per page
 *     responses:
 *       200:
 *         description: Successfully retrieved user posts
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
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/user/:userId", (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
        return authMiddleware(req as any, res, next);
    }
    next();
}, postController.getUserPosts.bind(postController));

export default router;
