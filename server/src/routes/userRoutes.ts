import express from "express";
const router = express.Router();
import userController from "../controllers/userController";
import authMiddleware from "../middleware/authMiddleware";

/**
 * @swagger
 * /user/me:
 *   get:
 *     summary: Get current user's profile
 *     description: Retrieve the authenticated user's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfile'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/me", authMiddleware, userController.getMyProfile.bind(userController));

/**
 * @swagger
 * /user/{userId}:
 *   get:
 *     summary: Get user profile by ID
 *     description: Retrieve a user's public profile by their ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Successfully retrieved profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfile'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/:userId", userController.getProfile.bind(userController));

/**
 * @swagger
 * /user/{userId}:
 *   put:
 *     summary: Update user profile
 *     description: Update user profile (name and profile image only). Users can only update their own profile.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: User's display name
 *                 example: "John Doe"
 *               profileImage:
 *                 type: string
 *                 description: URL to profile image
 *                 example: "/public/uploads/profile-123.jpg"
 *     responses:
 *       200:
 *         description: Profile successfully updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 email:
 *                   type: string
 *                 name:
 *                   type: string
 *                 profileImage:
 *                   type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.put("/:userId", authMiddleware, userController.updateProfile.bind(userController));

export default router;
