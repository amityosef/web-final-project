import { Response } from "express";
import User from "../model/userModel";
import Post from "../model/postModel";
import { AuthRequest } from "../middleware/authMiddleware";

const sendError = (res: Response, message: string, code?: number) => {
    const errCode = code || 400;
    res.status(errCode).json({ error: message });
};

/**
 * Get user profile by ID
 */
const getProfile = async (req: AuthRequest, res: Response) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId).select("-password -refreshToken");
        if (!user) {
            return sendError(res, "User not found", 404);
        }

        // Get posts count
        const postsCount = await Post.countDocuments({ owner: userId });

        res.status(200).json({
            _id: user._id,
            email: user.email,
            name: user.name,
            profileImage: user.profileImage,
            postsCount,
            createdAt: user.createdAt,
        });
    } catch (error) {
        console.error("Get profile error:", error);
        return sendError(res, "Failed to get profile", 500);
    }
};

/**
 * Update user profile (name and profile image only)
 */
const updateProfile = async (req: AuthRequest, res: Response) => {
    try {
        const currentUserId = req.user?._id;
        const { userId } = req.params;

        if (!currentUserId) {
            return sendError(res, "Unauthorized", 401);
        }

        // Users can only update their own profile
        if (currentUserId.toString() !== userId) {
            return sendError(res, "Forbidden - You can only edit your own profile", 403);
        }

        const { name, profileImage } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return sendError(res, "User not found", 404);
        }

        // Only allow updating name and profileImage
        if (name !== undefined) {
            user.name = name.trim();
        }
        if (profileImage !== undefined) {
            user.profileImage = profileImage;
        }

        await user.save();

        res.status(200).json({
            _id: user._id,
            email: user.email,
            name: user.name,
            profileImage: user.profileImage,
        });
    } catch (error) {
        console.error("Update profile error:", error);
        return sendError(res, "Failed to update profile", 500);
    }
};

/**
 * Get current user's profile
 */
const getMyProfile = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?._id;

        if (!userId) {
            return sendError(res, "Unauthorized", 401);
        }

        const user = await User.findById(userId).select("-password -refreshToken");
        if (!user) {
            return sendError(res, "User not found", 404);
        }

        const postsCount = await Post.countDocuments({ owner: userId });

        res.status(200).json({
            _id: user._id,
            email: user.email,
            name: user.name,
            profileImage: user.profileImage,
            postsCount,
            createdAt: user.createdAt,
        });
    } catch (error) {
        console.error("Get my profile error:", error);
        return sendError(res, "Failed to get profile", 500);
    }
};

export default {
    getProfile,
    updateProfile,
    getMyProfile,
};
