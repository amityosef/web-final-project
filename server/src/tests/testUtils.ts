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
    email: "test@testMovies.com",
    password: "testpasswordMovies",
    name: "Test User",
};

export type MoviesData = {
    title: string;
    releaseYear: number;
    _id?: string;
};

export var moviesData: MoviesData[] = [
    { title: "Movie A", releaseYear: 2000 },
    { title: "Movie B", releaseYear: 2001 },
    { title: "Movie C", releaseYear: 2002 },
];

export const singleMovieData: MoviesData =
    { title: "Movie A", releaseYear: 2000 };

// New Post types for social network
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

// Comments for posts
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

// Legacy comment type
export type CommentsData = {
    message: string;
    movieId: string;
    writerId?: string;
    _id?: string;
};

export var commentsData: CommentsData[] = [
    { message: "Great movie!", movieId: "movie1" },
    { message: "Loved it!", movieId: "movie1" },
    { message: "Not bad.", movieId: "movie2" },
    { message: "Worst movie ever.", movieId: "movie2" },
    { message: "Could be better.", movieId: "movie3" },
];

export const registerTestUser = async (app: Express, customUser?: UserData) => {
    const user = customUser || userData;
    await User.deleteMany({ "email": user.email });

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

    const res = await request(app)
        .post("/post")
        .set("Authorization", `Bearer ${token}`)
        .send(post);

    return res.body;
};