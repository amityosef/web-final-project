import express from "express";
import commentController from "../controllers/commentController";
import authMiddleware from "../middleware/authMiddleware";

const router = express.Router();

router.get("/post/:postId", commentController.getCommentsByPost.bind(commentController));
router.get("/:id", commentController.getCommentById.bind(commentController));
router.post("/post/:postId", authMiddleware, commentController.createComment.bind(commentController));
router.put("/:id", authMiddleware, commentController.updateComment.bind(commentController));
router.delete("/:id", authMiddleware, commentController.deleteComment.bind(commentController));

export default router;
