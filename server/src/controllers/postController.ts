import { Response } from "express";
import Post from "../model/postModel";
import Comment from "../model/commentModel";
import { AuthRequest } from "../middleware/authMiddleware";
import mongoose from "mongoose";
import aiService from "../services/aiService";

const sendError = (res: Response, message: string, code = 400) => {
    res.status(code).json({ error: message });
};

interface PaginationQuery {
    page?: string;
    limit?: string;
    owner?: string;
}

const stripLikes = (post: any, userId?: string) => ({
    ...post,
    isLiked: userId
        ? post.likes.some((like: mongoose.Types.ObjectId) => like.toString() === userId)
        : false,
    likes: undefined,
});

const buildPagination = (
    page: number,
    limit: number,
    total: number,
    fetchedCount: number,
    skip: number
) => ({
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
    hasMore: skip + fetchedCount < total,
});

const getPosts = async (req: AuthRequest, res: Response) => {
    try {
        const { page = "1", limit = "10", owner } = req.query as PaginationQuery;
        const pageNum = parseInt(page);
        const limitNum = Math.min(parseInt(limit), 50);
        const skip = (pageNum - 1) * limitNum;

        const filter: any = {};
        if (owner) filter.owner = owner;

        const [posts, total] = await Promise.all([
            Post.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .populate("owner", "name email profileImage")
                .lean(),
            Post.countDocuments(filter),
        ]);

        const userId = req.user?._id?.toString();

        res.status(200).json({
            posts: posts.map((post: any) => stripLikes(post, userId)),
            pagination: buildPagination(pageNum, limitNum, total, posts.length, skip),
        });
    } catch (error) {
        console.error("Get posts error:", error);
        return sendError(res, "Failed to get posts", 500);
    }
};

const getPostById = async (req: AuthRequest, res: Response) => {
    try {
        const post = await Post.findById(req.params.id)
            .populate("owner", "name email profileImage")
            .lean();

        if (!post) {
            return sendError(res, "Post not found", 404);
        }

        res.status(200).json(stripLikes(post, req.user?._id?.toString()));
    } catch (error) {
        console.error("Get post error:", error);
        return sendError(res, "Failed to get post", 500);
    }
};

const createPost = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return sendError(res, "Unauthorized", 401);
        }

        const { content, image } = req.body;

        if (!content || content.trim().length === 0) {
            return sendError(res, "Post content is required");
        }

        const post = await Post.create({
            content: content.trim(),
            image: image || "",
            owner: userId,
            likes: [],
            likesCount: 0,
            commentsCount: 0,
        });

        const populatedPost = await Post.findById(post._id)
            .populate("owner", "name email profileImage")
            .lean();

        aiService.indexPost(post._id.toString(), content.trim()).catch((err) => {
            console.error("Failed to index post:", err);
        });

        res.status(201).json({ ...populatedPost, isLiked: false, likes: undefined });
    } catch (error) {
        console.error("Create post error:", error);
        return sendError(res, "Failed to create post", 500);
    }
};

const updatePost = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?._id;
        const { id } = req.params;
        const { content, image } = req.body;

        if (!userId) {
            return sendError(res, "Unauthorized", 401);
        }

        const post = await Post.findById(id);
        if (!post) {
            return sendError(res, "Post not found", 404);
        }

        if (post.owner.toString() !== userId.toString()) {
            return sendError(res, "Forbidden - You can only edit your own posts", 403);
        }

        if (content !== undefined) post.content = content.trim();
        if (image !== undefined) post.image = image;

        await post.save();

        const updatedPost = await Post.findById(id)
            .populate("owner", "name email profileImage")
            .lean();

        if (content !== undefined) {
            aiService.indexPost(id, post.content).catch(() => {});
        }

        res.status(200).json(stripLikes(updatedPost, userId.toString()));
    } catch (error) {
        console.error("Update post error:", error);
        return sendError(res, "Failed to update post", 500);
    }
};

const deletePost = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?._id;
        const { id } = req.params;

        if (!userId) {
            return sendError(res, "Unauthorized", 401);
        }

        const post = await Post.findById(id);
        if (!post) {
            return sendError(res, "Post not found", 404);
        }

        if (post.owner.toString() !== userId.toString()) {
            return sendError(res, "Forbidden - You can only delete your own posts", 403);
        }

        await Comment.deleteMany({ postId: id });
        await Post.findByIdAndDelete(id);

        aiService.removePostIndex(id).catch(() => {});

        res.status(200).json({ message: "Post deleted successfully" });
    } catch (error) {
        console.error("Delete post error:", error);
        return sendError(res, "Failed to delete post", 500);
    }
};

const toggleLike = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?._id;
        const { id } = req.params;

        if (!userId) {
            return sendError(res, "Unauthorized", 401);
        }

        const post = await Post.findById(id);
        if (!post) {
            return sendError(res, "Post not found", 404);
        }

        const userObjectId = new mongoose.Types.ObjectId(userId);
        const likeIndex = post.likes.findIndex((like) => like.equals(userObjectId));
        const isLiking = likeIndex === -1;

        if (isLiking) {
            post.likes.push(userObjectId);
            post.likesCount += 1;
        } else {
            post.likes.splice(likeIndex, 1);
            post.likesCount = Math.max(0, post.likesCount - 1);
        }

        await post.save();

        res.status(200).json({
            postId: id,
            isLiked: isLiking,
            likesCount: post.likesCount,
        });
    } catch (error) {
        console.error("Toggle like error:", error);
        return sendError(res, "Failed to toggle like", 500);
    }
};

const getUserPosts = async (req: AuthRequest, res: Response) => {
    try {
        const { userId } = req.params;
        const { page = "1", limit = "10" } = req.query as PaginationQuery;
        const pageNum = parseInt(page);
        const limitNum = Math.min(parseInt(limit), 50);
        const skip = (pageNum - 1) * limitNum;

        const [posts, total] = await Promise.all([
            Post.find({ owner: userId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .populate("owner", "name email profileImage")
                .lean(),
            Post.countDocuments({ owner: userId }),
        ]);

        const currentUserId = req.user?._id?.toString();

        res.status(200).json({
            posts: posts.map((post: any) => stripLikes(post, currentUserId)),
            pagination: buildPagination(pageNum, limitNum, total, posts.length, skip),
        });
    } catch (error) {
        console.error("Get user posts error:", error);
        return sendError(res, "Failed to get user posts", 500);
    }
};

export default {
    getPosts,
    getPostById,
    createPost,
    updatePost,
    deletePost,
    toggleLike,
    getUserPosts,
};
