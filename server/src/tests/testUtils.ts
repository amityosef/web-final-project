import { Express } from "express";
import request from "supertest";
import User from "../model/userModel";

type UserData = {
    email: string;
    password: string;
    name?: string;
    _id?: string;
    token?: string;
    refreshToken?: string;
};

export const userData: UserData = {
    email: "test@test.com",
    password: "testpassword",
    name: "Test User",
};

export type PostData = {
    content: string;
    image?: string;
    _id?: string;
    owner?: string;
};

export var postsData: PostData[] = [
    { content: "First post content", image: "/uploads/img1.jpg" },
    { content: "Second post content", image: "/uploads/img2.jpg" },
    { content: "Third post without image" },
];

export const singlePostData: PostData = {
    content: "Single test post content",
    image: "/uploads/test.jpg",
};

export type CommentData = {
    content: string;
    postId?: string;
    _id?: string;
    owner?: string;
};

export var commentsDataNew: CommentData[] = [
    { content: "Great post!" },
    { content: "Loved it!" },
    { content: "Nice content!" },
];

export const registerTestUser = async (app: Express, customUser?: UserData) => {
    const user = customUser || userData;
    await User.deleteMany({ email: user.email });

    const res = await request(app).post("/auth/register").send({
        email: user.email,
        password: user.password,
        name: user.name,
    });

    return {
        _id: res.body.user?._id || res.body._id,
        token: res.body.token,
        refreshToken: res.body.refreshToken,
        user: res.body.user,
    };
};

export const loginTestUser = async (app: Express, customUser?: UserData) => {
    const user = customUser || userData;

    const res = await request(app).post("/auth/login").send({
        email: user.email,
        password: user.password,
    });

    return {
        _id: res.body.user?._id,
        token: res.body.token,
        refreshToken: res.body.refreshToken,
        user: res.body.user,
    };
};

export const createTestPost = async (app: Express, token: string, postData?: PostData) => {
    const post = postData || singlePostData;

    const res = await request(app).post("/post").set("Authorization", `Bearer ${token}`).send(post);

    return res.body;
};
