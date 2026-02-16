import { Response } from "express";
import Comment from "../model/commentModel";
import Post from "../model/postModel";
import { AuthRequest } from "../middleware/authMiddleware";

const sendError = (res: Response, message: string, code = 400) => {
    res.status(code).json({ error: message });
};

interface PaginationQuery {
    page?: string;
    limit?: string;
}

const getCommentsByPost = async (req: AuthRequest, res: Response) => {
    try {
        const { postId } = req.params;
        const { page = "1", limit = "20" } = req.query as PaginationQuery;
        const pageNum = parseInt(page);
        const limitNum = Math.min(parseInt(limit), 50);
        const skip = (pageNum - 1) * limitNum;

        const post = await Post.findById(postId);
        if (!post) {
            return sendError(res, "Post not found", 404);
        }

        const [comments, total] = await Promise.all([
            Comment.find({ postId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .populate("owner", "name email profileImage")
                .lean(),
            Comment.countDocuments({ postId }),
        ]);

        res.status(200).json({
            comments,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum),
                hasMore: skip + comments.length < total,
            },
        });
    } catch (error) {
        console.error("Get comments error:", error);
        return sendError(res, "Failed to get comments", 500);
    }
};

const createComment = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return sendError(res, "Unauthorized", 401);
        }

        const { postId } = req.params;
        const { content } = req.body;

        if (!content || content.trim().length === 0) {
            return sendError(res, "Comment content is required");
        }

        const post = await Post.findById(postId);
        if (!post) {
            return sendError(res, "Post not found", 404);
        }

        const comment = await Comment.create({
            content: content.trim(),
            postId,
            owner: userId,
        });

        post.commentsCount = (post.commentsCount || 0) + 1;
        await post.save();

        const populatedComment = await Comment.findById(comment._id)
            .populate("owner", "name email profileImage")
            .lean();

        res.status(201).json(populatedComment);
    } catch (error) {
        console.error("Create comment error:", error);
        return sendError(res, "Failed to create comment", 500);
    }
};

const updateComment = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?._id;
        const { id } = req.params;
        const { content } = req.body;

        if (!userId) {
            return sendError(res, "Unauthorized", 401);
        }

        const comment = await Comment.findById(id);
        if (!comment) {
            return sendError(res, "Comment not found", 404);
        }

        if (comment.owner.toString() !== userId.toString()) {
            return sendError(res, "Forbidden - You can only edit your own comments", 403);
        }

        if (content !== undefined) {
            comment.content = content.trim();
        }

        await comment.save();

        const updatedComment = await Comment.findById(id)
            .populate("owner", "name email profileImage")
            .lean();

        res.status(200).json(updatedComment);
    } catch (error) {
        console.error("Update comment error:", error);
        return sendError(res, "Failed to update comment", 500);
    }
};

const deleteComment = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?._id;
        const { id } = req.params;

        if (!userId) {
            return sendError(res, "Unauthorized", 401);
        }

        const comment = await Comment.findById(id);
        if (!comment) {
            return sendError(res, "Comment not found", 404);
        }

        if (comment.owner.toString() !== userId.toString()) {
            return sendError(res, "Forbidden - You can only delete your own comments", 403);
        }

        await Post.findByIdAndUpdate(comment.postId, {
            $inc: { commentsCount: -1 },
        });

        await Comment.findByIdAndDelete(id);

        res.status(200).json({ message: "Comment deleted successfully" });
    } catch (error) {
        console.error("Delete comment error:", error);
        return sendError(res, "Failed to delete comment", 500);
    }
};

const getCommentById = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const comment = await Comment.findById(id)
            .populate("owner", "name email profileImage")
            .lean();

        if (!comment) {
            return sendError(res, "Comment not found", 404);
        }

        res.status(200).json(comment);
    } catch (error) {
        console.error("Get comment error:", error);
        return sendError(res, "Failed to get comment", 500);
    }
};

export default {
    getCommentsByPost,
    createComment,
    updateComment,
    deleteComment,
    getCommentById,
};
