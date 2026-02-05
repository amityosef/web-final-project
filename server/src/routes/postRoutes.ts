import express, { Request, Response, NextFunction } from "express";
import postController from "../controllers/postController";
import authMiddleware from "../middleware/authMiddleware";

const router = express.Router();

const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
        return authMiddleware(req as any, res, next);
    }
    next();
};

router.get("/", optionalAuth, postController.getPosts.bind(postController));
router.get("/:id", optionalAuth, postController.getPostById.bind(postController));
router.post("/", authMiddleware, postController.createPost.bind(postController));
router.put("/:id", authMiddleware, postController.updatePost.bind(postController));
router.delete("/:id", authMiddleware, postController.deletePost.bind(postController));
router.post("/:id/like", authMiddleware, postController.toggleLike.bind(postController));
router.get("/user/:userId", optionalAuth, postController.getUserPosts.bind(postController));

export default router;
