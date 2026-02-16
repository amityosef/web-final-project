import request from "supertest";
import mongoose from "mongoose";
import initApp from "../index";
import User from "../model/userModel";
import Post from "../model/postModel";
import { Express } from "express";

let app: Express;
let accessToken: string;
let refreshToken: string;
let userId: string;
let postId: string;

const testUser = {
    email: "posttest@example.com",
    password: "password123",
    name: "Post Tester",
};

const testPost = {
    content: "This is a test post content",
    image: "/public/uploads/test.jpg",
};

beforeAll(async () => {
    app = await initApp();
    await User.deleteMany({ email: testUser.email });
    await Post.deleteMany({});

    const res = await request(app).post("/auth/register").send(testUser);

    accessToken = res.body.token;
    refreshToken = res.body.refreshToken;
    userId = res.body.user._id;
});

afterAll(async () => {
    await User.deleteMany({ email: testUser.email });
    await Post.deleteMany({});
    await mongoose.connection.close();
});

describe("Posts API", () => {
    describe("POST /post", () => {
        test("should create a new post", async () => {
            const res = await request(app)
                .post("/post")
                .set("Authorization", `Bearer ${accessToken}`)
                .send(testPost);

            expect(res.status).toBe(201);
            expect(res.body.content).toBe(testPost.content);
            expect(res.body.image).toBe(testPost.image);
            expect(res.body.owner._id).toBe(userId);
            expect(res.body.likesCount).toBe(0);
            expect(res.body.commentsCount).toBe(0);

            postId = res.body._id;
        });

        test("should fail without authentication", async () => {
            const res = await request(app).post("/post").send(testPost);

            expect(res.status).toBe(401);
        });

        test("should fail without content", async () => {
            const res = await request(app)
                .post("/post")
                .set("Authorization", `Bearer ${accessToken}`)
                .send({ image: "/test.jpg" });

            expect(res.status).toBe(400);
        });
    });

    describe("GET /post", () => {
        test("should get all posts with pagination", async () => {
            const res = await request(app).get("/post").query({ page: 1, limit: 10 });

            expect(res.status).toBe(200);
            expect(res.body.posts).toBeDefined();
            expect(res.body.pagination).toBeDefined();
            expect(res.body.pagination.page).toBe(1);
            expect(res.body.pagination.limit).toBe(10);
            expect(Array.isArray(res.body.posts)).toBe(true);
        });

        test("should get posts with like status when authenticated", async () => {
            const res = await request(app)
                .get("/post")
                .set("Authorization", `Bearer ${accessToken}`);

            expect(res.status).toBe(200);
            expect(res.body.posts[0]).toHaveProperty("isLiked");
        });
    });

    describe("GET /post/:id", () => {
        test("should get a single post by ID", async () => {
            const res = await request(app).get(`/post/${postId}`);

            expect(res.status).toBe(200);
            expect(res.body._id).toBe(postId);
            expect(res.body.content).toBe(testPost.content);
        });

        test("should return 404 for non-existent post", async () => {
            const fakeId = new mongoose.Types.ObjectId().toString();
            const res = await request(app).get(`/post/${fakeId}`);

            expect(res.status).toBe(404);
        });
    });

    describe("PUT /post/:id", () => {
        test("should update own post", async () => {
            const updatedContent = "Updated post content";
            const res = await request(app)
                .put(`/post/${postId}`)
                .set("Authorization", `Bearer ${accessToken}`)
                .send({ content: updatedContent });

            expect(res.status).toBe(200);
            expect(res.body.content).toBe(updatedContent);
        });

        test("should fail to update without authentication", async () => {
            const res = await request(app).put(`/post/${postId}`).send({ content: "New content" });

            expect(res.status).toBe(401);
        });
    });

    describe("POST /post/:id/like", () => {
        test("should like a post", async () => {
            const res = await request(app)
                .post(`/post/${postId}/like`)
                .set("Authorization", `Bearer ${accessToken}`);

            expect(res.status).toBe(200);
            expect(res.body.isLiked).toBe(true);
            expect(res.body.likesCount).toBe(1);
        });

        test("should unlike a post when liked again", async () => {
            const res = await request(app)
                .post(`/post/${postId}/like`)
                .set("Authorization", `Bearer ${accessToken}`);

            expect(res.status).toBe(200);
            expect(res.body.isLiked).toBe(false);
            expect(res.body.likesCount).toBe(0);
        });

        test("should fail without authentication", async () => {
            const res = await request(app).post(`/post/${postId}/like`);

            expect(res.status).toBe(401);
        });
    });

    describe("GET /post/user/:userId", () => {
        test("should get posts by user", async () => {
            const res = await request(app).get(`/post/user/${userId}`);

            expect(res.status).toBe(200);
            expect(res.body.posts).toBeDefined();
            expect(res.body.posts.length).toBeGreaterThan(0);
            expect(res.body.posts[0].owner._id).toBe(userId);
        });
    });

    describe("DELETE /post/:id", () => {
        test("should delete own post", async () => {
            const res = await request(app)
                .delete(`/post/${postId}`)
                .set("Authorization", `Bearer ${accessToken}`);

            expect(res.status).toBe(200);
            expect(res.body.message).toBe("Post deleted successfully");
        });

        test("should fail to delete non-existent post", async () => {
            const res = await request(app)
                .delete(`/post/${postId}`)
                .set("Authorization", `Bearer ${accessToken}`);

            expect(res.status).toBe(404);
        });

        test("should fail to delete without authentication", async () => {
            const createRes = await request(app)
                .post("/post")
                .set("Authorization", `Bearer ${accessToken}`)
                .send({ content: "Post to delete without auth" });

            const res = await request(app).delete(`/post/${createRes.body._id}`);

            expect(res.status).toBe(401);

            await Post.findByIdAndDelete(createRes.body._id);
        });

        test("should fail to delete another user's post", async () => {
            const otherUser = {
                email: "otherpostuser@example.com",
                password: "password123",
                name: "Other User",
            };
            const otherRegisterRes = await request(app).post("/auth/register").send(otherUser);
            const otherToken = otherRegisterRes.body.token;

            const createRes = await request(app)
                .post("/post")
                .set("Authorization", `Bearer ${accessToken}`)
                .send({ content: "First user's post" });

            const res = await request(app)
                .delete(`/post/${createRes.body._id}`)
                .set("Authorization", `Bearer ${otherToken}`);

            expect(res.status).toBe(403);
            expect(res.body.error).toContain("Forbidden");

            await Post.findByIdAndDelete(createRes.body._id);
            await User.deleteMany({ email: otherUser.email });
        });
    });

    describe("Additional edge cases", () => {
        test("should get posts filtered by owner", async () => {
            const res = await request(app).get("/post").query({ owner: userId });

            expect(res.status).toBe(200);
            expect(res.body.posts).toBeDefined();
            if (res.body.posts.length > 0) {
                expect(res.body.posts[0].owner._id).toBe(userId);
            }
        });

        test("should fail to create post with empty content", async () => {
            const res = await request(app)
                .post("/post")
                .set("Authorization", `Bearer ${accessToken}`)
                .send({ content: "   " });

            expect(res.status).toBe(400);
        });

        test("should fail to update non-existent post", async () => {
            const fakeId = new mongoose.Types.ObjectId().toString();
            const res = await request(app)
                .put(`/post/${fakeId}`)
                .set("Authorization", `Bearer ${accessToken}`)
                .send({ content: "Updated content" });

            expect(res.status).toBe(404);
        });

        test("should fail to update another user's post", async () => {
            const otherUser = {
                email: "anotheruserpost@example.com",
                password: "password123",
                name: "Another User",
            };
            const otherRegisterRes = await request(app).post("/auth/register").send(otherUser);
            const otherToken = otherRegisterRes.body.token;

            const createRes = await request(app)
                .post("/post")
                .set("Authorization", `Bearer ${accessToken}`)
                .send({ content: "Original post" });

            const res = await request(app)
                .put(`/post/${createRes.body._id}`)
                .set("Authorization", `Bearer ${otherToken}`)
                .send({ content: "Hacked content" });

            expect(res.status).toBe(403);
            expect(res.body.error).toContain("Forbidden");

            await Post.findByIdAndDelete(createRes.body._id);
            await User.deleteMany({ email: otherUser.email });
        });

        test("should respect max limit of 50 for pagination", async () => {
            const res = await request(app).get("/post").query({ page: 1, limit: 100 });

            expect(res.status).toBe(200);
            expect(res.body.pagination.limit).toBe(50);
        });

        test("should fail to like non-existent post", async () => {
            const fakeId = new mongoose.Types.ObjectId().toString();
            const res = await request(app)
                .post(`/post/${fakeId}/like`)
                .set("Authorization", `Bearer ${accessToken}`);

            expect(res.status).toBe(404);
        });

        test("should get post by invalid ID format", async () => {
            const res = await request(app).get(`/post/invalidid123`);

            expect(res.status).toBe(500);
        });

        test("should get user posts with pagination", async () => {
            const res = await request(app).get(`/post/user/${userId}`).query({ page: 1, limit: 5 });

            expect(res.status).toBe(200);
            expect(res.body.posts).toBeDefined();
            expect(res.body.pagination).toBeDefined();
            expect(res.body.pagination.page).toBe(1);
            expect(res.body.pagination.limit).toBe(5);
        });

        test("should include like status in posts when authenticated", async () => {
            const createRes = await request(app)
                .post("/post")
                .set("Authorization", `Bearer ${accessToken}`)
                .send({ content: "Post to test like status" });

            await request(app)
                .post(`/post/${createRes.body._id}/like`)
                .set("Authorization", `Bearer ${accessToken}`);

            const res = await request(app)
                .get(`/post/${createRes.body._id}`)
                .set("Authorization", `Bearer ${accessToken}`);

            expect(res.status).toBe(200);
            expect(res.body.isLiked).toBe(true);

            await Post.findByIdAndDelete(createRes.body._id);
        });

        test("should handle multiple page requests correctly", async () => {
            const page1 = await request(app).get("/post").query({ page: 1, limit: 2 });

            const page2 = await request(app).get("/post").query({ page: 2, limit: 2 });

            expect(page1.status).toBe(200);
            expect(page2.status).toBe(200);
            expect(page1.body.pagination.page).toBe(1);
            expect(page2.body.pagination.page).toBe(2);
        });

        test("should update post image only", async () => {
            const createRes = await request(app)
                .post("/post")
                .set("Authorization", `Bearer ${accessToken}`)
                .send({ content: "Post for image update" });

            const res = await request(app)
                .put(`/post/${createRes.body._id}`)
                .set("Authorization", `Bearer ${accessToken}`)
                .send({ image: "/new/image.jpg" });

            expect(res.status).toBe(200);
            expect(res.body.image).toBe("/new/image.jpg");
            expect(res.body.content).toBe("Post for image update");

            await Post.findByIdAndDelete(createRes.body._id);
        });

        test("should test isLikedBy method directly", async () => {
            const mongoose = require("mongoose");

            const post = await Post.create({
                content: "Test isLikedBy method",
                owner: new mongoose.Types.ObjectId(userId),
                likes: [],
                likesCount: 0,
                commentsCount: 0,
            });

            const testUserId = new mongoose.Types.ObjectId();
            expect((post as any).isLikedBy(testUserId)).toBe(false);

            post.likes.push(testUserId);
            expect((post as any).isLikedBy(testUserId)).toBe(true);

            await Post.findByIdAndDelete(post._id);
        });

        test("should handle database error in getPosts", async () => {
            jest.spyOn(Post, "find").mockImplementationOnce(() => {
                throw new Error("Database error");
            });

            const res = await request(app).get("/post");
            expect(res.status).toBe(500);
            expect(res.body.error).toBe("Failed to get posts");

            (Post.find as jest.Mock).mockRestore();
        });

        test("should handle database error in createPost", async () => {
            jest.spyOn(Post, "create").mockRejectedValueOnce(new Error("Database error"));

            const res = await request(app)
                .post("/post")
                .set("Authorization", `Bearer ${accessToken}`)
                .send({ content: "Test content" });

            expect(res.status).toBe(500);
            expect(res.body.error).toBe("Failed to create post");

            (Post.create as jest.Mock).mockRestore();
        });

        test("should handle database error in updatePost", async () => {
            jest.spyOn(Post, "findById").mockRejectedValueOnce(new Error("Database error"));

            const res = await request(app)
                .put(`/post/507f1f77bcf86cd799439011`)
                .set("Authorization", `Bearer ${accessToken}`)
                .send({ content: "Updated content" });

            expect(res.status).toBe(500);
            expect(res.body.error).toBe("Failed to update post");

            (Post.findById as jest.Mock).mockRestore();
        });

        test("should handle database error in deletePost", async () => {
            jest.spyOn(Post, "findById").mockRejectedValueOnce(new Error("Database error"));

            const res = await request(app)
                .delete(`/post/507f1f77bcf86cd799439011`)
                .set("Authorization", `Bearer ${accessToken}`);

            expect(res.status).toBe(500);
            expect(res.body.error).toBe("Failed to delete post");

            (Post.findById as jest.Mock).mockRestore();
        });

        test("should handle database error in toggleLike", async () => {
            jest.spyOn(Post, "findById").mockRejectedValueOnce(new Error("Database error"));

            const res = await request(app)
                .post(`/post/507f1f77bcf86cd799439011/like`)
                .set("Authorization", `Bearer ${accessToken}`);

            expect(res.status).toBe(500);
            expect(res.body.error).toBe("Failed to toggle like");

            (Post.findById as jest.Mock).mockRestore();
        });

        test("should handle database error in getUserPosts", async () => {
            jest.spyOn(Post, "find").mockImplementationOnce(() => {
                throw new Error("Database error");
            });

            const res = await request(app).get(`/post/user/${userId}`);
            expect(res.status).toBe(500);
            expect(res.body.error).toBe("Failed to get user posts");

            (Post.find as jest.Mock).mockRestore();
        });
    });
});

describe("Post Controller Direct Tests", () => {
    const postController = require("../controllers/postController").default;

    const mockResponse = () => {
        const res: any = {};
        res.status = jest.fn().mockReturnValue(res);
        res.json = jest.fn().mockReturnValue(res);
        return res;
    };

    test("createPost without userId returns 401", async () => {
        const req: any = { body: { content: "test" }, user: undefined };
        const res = mockResponse();

        await postController.createPost(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
    });

    test("updatePost without userId returns 401", async () => {
        const req: any = { body: {}, params: { id: "123" }, user: undefined };
        const res = mockResponse();

        await postController.updatePost(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
    });

    test("deletePost without userId returns 401", async () => {
        const req: any = { params: { id: "123" }, user: undefined };
        const res = mockResponse();

        await postController.deletePost(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
    });

    test("toggleLike without userId returns 401", async () => {
        const req: any = { params: { id: "123" }, user: undefined };
        const res = mockResponse();

        await postController.toggleLike(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
    });
});
