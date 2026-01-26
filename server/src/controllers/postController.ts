import { Response } from "express";
import Post, { IPost } from "../model/postModel";
import Comment from "../model/commentModel";
import { AuthRequest } from "../middleware/authMiddleware";
import mongoose from "mongoose";

const sendError = (res: Response, message: string, code?: number) => {
    const errCode = code || 400;
    res.status(errCode).json({ error: message });
};

interface PaginationQuery {
    page?: string;
    limit?: string;
    owner?: string;
}

/**
 * Get all posts with pagination
 */
const getPosts = async (req: AuthRequest, res: Response) => {
    try {
        const { page = "1", limit = "10", owner } = req.query as PaginationQuery;
        const pageNum = parseInt(page);
        const limitNum = Math.min(parseInt(limit), 50); // Max 50 posts per page
        const skip = (pageNum - 1) * limitNum;

        const filter: any = {};
        if (owner) {
            filter.owner = owner;
        }

        const [posts, total] = await Promise.all([
            Post.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .populate("owner", "name email profileImage")
                .lean(),
            Post.countDocuments(filter),
        ]);

        // Add isLiked field for authenticated users
        const userId = req.user?._id;
        const postsWithLikeStatus = posts.map((post: any) => ({
            ...post,
            isLiked: userId ? post.likes.some((like: mongoose.Types.ObjectId) =>
                like.toString() === userId.toString()
            ) : false,
            likes: undefined, // Don't send full likes array
        }));

        res.status(200).json({
            posts: postsWithLikeStatus,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum),
                hasMore: skip + posts.length < total,
            },
        });
    } catch (error) {
        console.error("Get posts error:", error);
        return sendError(res, "Failed to get posts", 500);
    }
};

/**
 * Get single post by ID
 */
const getPostById = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const post = await Post.findById(id)
            .populate("owner", "name email profileImage")
            .lean();

        if (!post) {
            return sendError(res, "Post not found", 404);
        }

        const userId = req.user?._id;
        const postWithLikeStatus = {
            ...post,
            isLiked: userId ? (post as any).likes.some((like: mongoose.Types.ObjectId) =>
                like.toString() === userId.toString()
            ) : false,
            likes: undefined,
        };

        res.status(200).json(postWithLikeStatus);
    } catch (error) {
        console.error("Get post error:", error);
        return sendError(res, "Failed to get post", 500);
    }
};

/**
 * Create a new post
 */
const createPost = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return sendError(res, "Unauthorized", 401);
        }

        const { content, image } = req.body;

        if (!content || content.trim().length === 0) {
            return sendError(res, "Post content is required", 400);
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

        res.status(201).json({
            ...populatedPost,
            isLiked: false,
            likes: undefined,
        });
    } catch (error) {
        console.error("Create post error:", error);
        return sendError(res, "Failed to create post", 500);
    }
};

/**
 * Update a post (only owner can update)
 */
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

        if (content !== undefined) {
            post.content = content.trim();
        }
        if (image !== undefined) {
            post.image = image;
        }

        await post.save();

        const updatedPost = await Post.findById(id)
            .populate("owner", "name email profileImage")
            .lean();

        res.status(200).json({
            ...updatedPost,
            isLiked: (updatedPost as any).likes.some((like: mongoose.Types.ObjectId) =>
                like.toString() === userId.toString()
            ),
            likes: undefined,
        });
    } catch (error) {
        console.error("Update post error:", error);
        return sendError(res, "Failed to update post", 500);
    }
};

/**
 * Delete a post (only owner can delete)
 */
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

        // Delete all comments associated with this post
        await Comment.deleteMany({ postId: id });

        // Delete the post
        await Post.findByIdAndDelete(id);

        res.status(200).json({ message: "Post deleted successfully" });
    } catch (error) {
        console.error("Delete post error:", error);
        return sendError(res, "Failed to delete post", 500);
    }
};

/**
 * Toggle like on a post
 */
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

        if (likeIndex > -1) {
            // Unlike - remove from array
            post.likes.splice(likeIndex, 1);
            post.likesCount = Math.max(0, post.likesCount - 1);
        } else {
            // Like - add to array
            post.likes.push(userObjectId);
            post.likesCount = post.likesCount + 1;
        }

        await post.save();

        res.status(200).json({
            postId: id,
            isLiked: likeIndex === -1, // If it wasn't found, now it's liked
            likesCount: post.likesCount,
        });
    } catch (error) {
        console.error("Toggle like error:", error);
        return sendError(res, "Failed to toggle like", 500);
    }
};

/**
 * Get user's posts
 */
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

        const currentUserId = req.user?._id;
        const postsWithLikeStatus = posts.map((post: any) => ({
            ...post,
            isLiked: currentUserId ? post.likes.some((like: mongoose.Types.ObjectId) =>
                like.toString() === currentUserId.toString()
            ) : false,
            likes: undefined,
        }));

        res.status(200).json({
            posts: postsWithLikeStatus,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum),
                hasMore: skip + posts.length < total,
            },
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
