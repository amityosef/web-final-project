import { Response } from "express";
import User, { IUser } from "../model/userModel";
import Post from "../model/postModel";
import { AuthRequest } from "../middleware/authMiddleware";

const sendError = (res: Response, message: string, code = 400) => {
    res.status(code).json({ error: message });
};

const buildProfileResponse = async (user: IUser) => {
    const postsCount = await Post.countDocuments({ owner: user._id });
    return {
        _id: user._id,
        email: user.email,
        name: user.name,
        profileImage: user.profileImage,
        postsCount,
        createdAt: user.createdAt,
    };
};

const getProfile = async (req: AuthRequest, res: Response) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId).select("-password -refreshToken");
        if (!user) {
            return sendError(res, "User not found", 404);
        }

        res.status(200).json(await buildProfileResponse(user));
    } catch (error) {
        console.error("Get profile error:", error);
        return sendError(res, "Failed to get profile", 500);
    }
};

const updateProfile = async (req: AuthRequest, res: Response) => {
    try {
        const currentUserId = req.user?._id;
        const { userId } = req.params;

        if (!currentUserId) {
            return sendError(res, "Unauthorized", 401);
        }

        if (currentUserId.toString() !== userId) {
            return sendError(res, "Forbidden - You can only edit your own profile", 403);
        }

        const { name, profileImage } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return sendError(res, "User not found", 404);
        }

        if (name !== undefined) user.name = name.trim();
        if (profileImage !== undefined) user.profileImage = profileImage;

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

        res.status(200).json(await buildProfileResponse(user));
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
