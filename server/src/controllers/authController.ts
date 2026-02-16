import { Request, Response } from "express";
import User, { IUser } from "../model/userModel";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { AuthRequest } from "../middleware/authMiddleware";

type Tokens = {
    token: string;
    refreshToken: string;
};

type UserResponse = {
    _id: string;
    email: string;
    name: string;
    profileImage: string;
};

const sendError = (res: Response, message: string, code = 400) => {
    res.status(code).json({ error: message });
};

const generateToken = (userId: string): Tokens => {
    const secret = process.env.JWT_SECRET || "secretkey";
    const exp = parseInt(process.env.JWT_EXPIRES_IN || "3600");
    const refreshExp = parseInt(process.env.JWT_REFRESH_EXPIRES_IN || "86400");

    return {
        token: jwt.sign({ userId }, secret, { expiresIn: exp }),
        refreshToken: jwt.sign({ userId }, secret, { expiresIn: refreshExp }),
    };
};

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
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return sendError(res, "User with this email already exists");
        }

        const salt = await bcrypt.genSalt(10);
        const encryptedPassword = await bcrypt.hash(password, salt);
        const user = await User.create({
            email,
            password: encryptedPassword,
            name: name || email.split("@")[0],
        });

        const tokens = generateToken(user._id.toString());
        user.refreshToken.push(tokens.refreshToken);
        await user.save();

        res.status(201).json({ ...tokens, user: formatUserResponse(user) });
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

        res.status(200).json({ ...tokens, user: formatUserResponse(user) });
    } catch (error) {
        console.error("Login error:", error);
        return sendError(res, "Login failed");
    }
};

const googleLogin = async (req: Request, res: Response) => {
    const { credential } = req.body;

    if (!credential) {
        return sendError(res, "Google credential is required");
    }

    try {
        const decoded = jwt.decode(credential) as {
            email: string;
            name: string;
            picture: string;
            sub: string;
        };

        if (!decoded || !decoded.email) {
            return sendError(res, "Invalid Google credential");
        }

        let user = await User.findOne({
            $or: [{ googleId: decoded.sub }, { email: decoded.email }],
        });

        if (user) {
            if (!user.googleId) user.googleId = decoded.sub;
            if (!user.profileImage && decoded.picture) user.profileImage = decoded.picture;
            if (!user.name && decoded.name) user.name = decoded.name;
        } else {
            user = await User.create({
                email: decoded.email,
                name: decoded.name || decoded.email.split("@")[0],
                profileImage: decoded.picture || "",
                googleId: decoded.sub,
                password: "",
            });
        }

        const tokens = generateToken(user._id.toString());
        user.refreshToken.push(tokens.refreshToken);
        await user.save();

        res.status(200).json({ ...tokens, user: formatUserResponse(user) });
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
        const secret = process.env.JWT_SECRET || "";
        const decoded: any = jwt.verify(refreshToken, secret);

        const user = await User.findById(decoded.userId);
        if (!user) {
            return sendError(res, "Invalid refresh token", 401);
        }

        if (!user.refreshToken.includes(refreshToken)) {
            user.refreshToken = [];
            await user.save();
            return sendError(res, "Invalid refresh token", 401);
        }

        const tokens = generateToken(user._id.toString());
        user.refreshToken.push(tokens.refreshToken);
        user.refreshToken = user.refreshToken.filter((rt) => rt !== refreshToken);
        await user.save();

        res.status(200).json({ ...tokens, user: formatUserResponse(user) });
    } catch {
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

        user.refreshToken = refreshToken
            ? user.refreshToken.filter((rt) => rt !== refreshToken)
            : [];

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
