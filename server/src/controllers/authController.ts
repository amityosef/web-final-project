import { Request, Response } from "express";
import User, { IUser } from "../model/userModel";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { AuthRequest } from "../middleware/authMiddleware";

const sendError = (res: Response, message: string, code?: number) => {
    const errCode = code || 400;
    res.status(errCode).json({ error: message });
}

type Tokens = {
    token: string;
    refreshToken: string;
}

type UserResponse = {
    _id: string;
    email: string;
    name: string;
    profileImage: string;
}

const generateToken = (userId: string): Tokens => {
    const secret: string = process.env.JWT_SECRET || "secretkey";
    const exp: number = parseInt(process.env.JWT_EXPIRES_IN || "3600"); // 1 hour
    const refreshexp: number = parseInt(process.env.JWT_REFRESH_EXPIRES_IN || "86400"); // 24 hours
    const token = jwt.sign(
        { userId: userId },
        secret,
        { expiresIn: exp }
    );
    const refreshToken = jwt.sign(
        { userId: userId },
        secret,
        { expiresIn: refreshexp } // 24 hours
    );
    return { token, refreshToken };
}

const formatUserResponse = (user: IUser): UserResponse => ({
    _id: user._id.toString(),
    email: user.email,
    name: user.name || "",
    profileImage: user.profileImage || "",
});

const register = async (req: Request, res: Response) => {
    const { email, password, name } = req.body;

    if (!email || !password) {
        return sendError(res, "Email and password are required", 401);
    }
    try {
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return sendError(res, "User with this email already exists", 400);
        }

        const salt = await bcrypt.genSalt(10);
        const encryptedPassword = await bcrypt.hash(password, salt);
        const user = await User.create({
            email,
            password: encryptedPassword,
            name: name || email.split('@')[0], // Default name from email
        });

        const tokens = generateToken(user._id.toString());

        user.refreshToken.push(tokens.refreshToken);
        await user.save();

        res.status(201).json({
            ...tokens,
            user: formatUserResponse(user),
        });
    } catch (error) {
        console.error("Registration error:", error);
        return sendError(res, "Registration failed", 401);
    }
};

const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return sendError(res, "Email and password are required");
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return sendError(res, "Invalid email or password");
        }

        // Check if this is an OAuth user trying to login with password
        if (user.googleId && !user.password) {
            return sendError(res, "Please use Google login for this account");
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return sendError(res, "Invalid email or password");
        }

        const tokens = generateToken(user._id.toString());

        user.refreshToken.push(tokens.refreshToken);
        await user.save();

        res.status(200).json({
            ...tokens,
            user: formatUserResponse(user),
        });
    } catch (error) {
        console.error("Login error:", error);
        return sendError(res, "Login failed");
    }
};

const googleLogin = async (req: Request, res: Response) => {
    const { credential } = req.body;

    if (!credential) {
        return sendError(res, "Google credential is required", 400);
    }

    try {
        // Decode Google JWT token (in production, verify with Google's public keys)
        const decoded = jwt.decode(credential) as {
            email: string;
            name: string;
            picture: string;
            sub: string; // Google user ID
        };

        if (!decoded || !decoded.email) {
            return sendError(res, "Invalid Google credential", 400);
        }

        // Find or create user
        let user = await User.findOne({
            $or: [
                { googleId: decoded.sub },
                { email: decoded.email }
            ]
        });

        if (user) {
            // Update Google ID if user exists but doesn't have it
            if (!user.googleId) {
                user.googleId = decoded.sub;
            }
            // Update profile image if not set
            if (!user.profileImage && decoded.picture) {
                user.profileImage = decoded.picture;
            }
            // Update name if not set
            if (!user.name && decoded.name) {
                user.name = decoded.name;
            }
        } else {
            // Create new user
            user = await User.create({
                email: decoded.email,
                name: decoded.name || decoded.email.split('@')[0],
                profileImage: decoded.picture || "",
                googleId: decoded.sub,
                password: "", // OAuth users don't have a password
            });
        }

        const tokens = generateToken(user._id.toString());

        user.refreshToken.push(tokens.refreshToken);
        await user.save();

        res.status(200).json({
            ...tokens,
            user: formatUserResponse(user),
        });
    } catch (error) {
        console.error("Google login error:", error);
        return sendError(res, "Google login failed", 500);
    }
};

const refreshToken = async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return sendError(res, "Refresh token is required", 401);
    }

    try {
        const secret: string = process.env.JWT_SECRET || "secretkey";
        const decoded: any = jwt.verify(refreshToken, secret);

        const user = await User.findById(decoded.userId);
        if (!user) {
            return sendError(res, "Invalid refresh token", 401);
        }

        if (!user.refreshToken.includes(refreshToken)) {
            // Security: Clear all refresh tokens if invalid token is used
            user.refreshToken = [];
            await user.save();
            return sendError(res, "Invalid refresh token", 401);
        }

        const tokens = generateToken(user._id.toString());
        user.refreshToken.push(tokens.refreshToken);
        // Remove old refresh token
        user.refreshToken = user.refreshToken.filter(rt => rt !== refreshToken);
        await user.save();

        res.status(200).json({
            ...tokens,
            user: formatUserResponse(user),
        });
    } catch (error) {
        return sendError(res, "Invalid refresh token", 401);
    }
};

const logout = async (req: AuthRequest, res: Response) => {
    const { refreshToken } = req.body;
    const userId = req.user?._id;

    if (!userId) {
        return sendError(res, "Unauthorized", 401);
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return sendError(res, "User not found", 404);
        }

        if (refreshToken) {
            // Remove specific refresh token
            user.refreshToken = user.refreshToken.filter(rt => rt !== refreshToken);
        } else {
            // Remove all refresh tokens (logout from all devices)
            user.refreshToken = [];
        }

        await user.save();

        res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        console.error("Logout error:", error);
        return sendError(res, "Logout failed", 500);
    }
};

const getMe = async (req: AuthRequest, res: Response) => {
    const userId = req.user?._id;

    if (!userId) {
        return sendError(res, "Unauthorized", 401);
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return sendError(res, "User not found", 404);
        }

        res.status(200).json(formatUserResponse(user));
    } catch (error) {
        console.error("Get me error:", error);
        return sendError(res, "Failed to get user", 500);
    }
};

export default {
    register,
    login,
    googleLogin,
    refreshToken,
    logout,
    getMe,
};