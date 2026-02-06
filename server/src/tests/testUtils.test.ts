import request from "supertest";
import initApp from "../index";
import { Express } from "express";
import User from "../model/userModel";
import Post from "../model/postModel";
import mongoose from "mongoose";
import {
    userData,
    postsData,
    singlePostData,
    commentsDataNew,
    registerTestUser,
    loginTestUser,
    createTestPost,
    PostData,
} from "./testUtils";

let app: Express;

beforeAll(async () => {
    app = await initApp();
    await User.deleteMany({});
    await Post.deleteMany({});
});

afterAll(async () => {
    await mongoose.connection.close();
});

describe("testUtils helper functions", () => {
    describe("registerTestUser", () => {
        test("should register user with default userData", async () => {
            const result = await registerTestUser(app);

            expect(result._id).toBeDefined();
            expect(result.token).toBeDefined();
            expect(result.refreshToken).toBeDefined();
            expect(result.user.email).toBe(userData.email);
        });

        test("should register user with custom userData", async () => {
            const customUser = {
                email: "custom@test.com",
                password: "custompassword",
                name: "Custom User",
            };

            const result = await registerTestUser(app, customUser);

            expect(result._id).toBeDefined();
            expect(result.token).toBeDefined();
            expect(result.user.email).toBe(customUser.email);
        });
    });

    describe("loginTestUser", () => {
        test("should login user with default userData", async () => {
            const result = await loginTestUser(app);

            expect(result._id).toBeDefined();
            expect(result.token).toBeDefined();
            expect(result.refreshToken).toBeDefined();
        });

        test("should login user with custom userData", async () => {
            const customUser = {
                email: "custom@test.com",
                password: "custompassword",
            };

            const result = await loginTestUser(app, customUser);

            expect(result._id).toBeDefined();
            expect(result.token).toBeDefined();
        });
    });

    describe("createTestPost", () => {
        let accessToken: string;

        beforeAll(async () => {
            const user = await loginTestUser(app);
            accessToken = user.token;
        });

        test("should create post with default singlePostData", async () => {
            const result = await createTestPost(app, accessToken);

            expect(result._id).toBeDefined();
            expect(result.content).toBe(singlePostData.content);
            expect(result.image).toBe(singlePostData.image);

            await Post.findByIdAndDelete(result._id);
        });

        test("should create post with custom postData", async () => {
            const customPost: PostData = {
                content: "Custom post content",
                image: "/custom/image.jpg",
            };

            const result = await createTestPost(app, accessToken, customPost);

            expect(result._id).toBeDefined();
            expect(result.content).toBe(customPost.content);
            expect(result.image).toBe(customPost.image);

            await Post.findByIdAndDelete(result._id);
        });
    });

    describe("exported data constants", () => {
        test("postsData should have correct structure", () => {
            expect(postsData).toHaveLength(3);
            expect(postsData[0].content).toBe("First post content");
            expect(postsData[0].image).toBe("/uploads/img1.jpg");
            expect(postsData[2].image).toBeUndefined();
        });

        test("commentsDataNew should have correct structure", () => {
            expect(commentsDataNew).toHaveLength(3);
            expect(commentsDataNew[0].content).toBe("Great post!");
        });

        test("singlePostData should have correct structure", () => {
            expect(singlePostData.content).toBe("Single test post content");
            expect(singlePostData.image).toBe("/uploads/test.jpg");
        });

        test("userData should have correct structure", () => {
            expect(userData.email).toBe("test@test.com");
            expect(userData.password).toBe("testpassword");
            expect(userData.name).toBe("Test User");
        });
    });
});
