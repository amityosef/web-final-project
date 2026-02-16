import request from "supertest";
import initApp from "../index";
import Comments from "../model/commentModel";
import Post from "../model/postModel";
import { Express } from "express";
import User from "../model/userModel";
import mongoose from "mongoose";

let app: Express;
let accessToken: string;
let userId: string;
let postId: string;
let commentId: string;

const testUser = {
    email: "commenttest@example.com",
    password: "password123",
    name: "Comment Tester",
};

const testPost = {
    content: "This is a test post for comments",
};

const testComment = {
    content: "This is a test comment",
};

beforeAll(async () => {
    app = await initApp();
    await Comments.deleteMany({});
    await Post.deleteMany({});
    await User.deleteMany({ email: testUser.email });

    const registerRes = await request(app).post("/auth/register").send(testUser);

    accessToken = registerRes.body.token;
    userId = registerRes.body.user._id;

    const postRes = await request(app)
        .post("/post")
        .set("Authorization", `Bearer ${accessToken}`)
        .send(testPost);

    postId = postRes.body._id;
});

afterAll(async () => {
    await Comments.deleteMany({});
    await Post.deleteMany({});
    await User.deleteMany({ email: testUser.email });
    await mongoose.connection.close();
});

describe("Comments API", () => {
    describe("POST /comment/post/:postId", () => {
        test("should create a new comment", async () => {
            const res = await request(app)
                .post(`/comment/post/${postId}`)
                .set("Authorization", `Bearer ${accessToken}`)
                .send(testComment);

            expect(res.status).toBe(201);
            expect(res.body.content).toBe(testComment.content);
            expect(res.body.postId).toBe(postId);
            expect(res.body.owner._id).toBe(userId);

            commentId = res.body._id;
        });

        test("should increment post comment count", async () => {
            const postRes = await request(app).get(`/post/${postId}`);
            expect(postRes.body.commentsCount).toBe(1);
        });

        test("should fail without authentication", async () => {
            const res = await request(app).post(`/comment/post/${postId}`).send(testComment);

            expect(res.status).toBe(401);
        });

        test("should fail without content", async () => {
            const res = await request(app)
                .post(`/comment/post/${postId}`)
                .set("Authorization", `Bearer ${accessToken}`)
                .send({});

            expect(res.status).toBe(400);
        });

        test("should fail for non-existent post", async () => {
            const fakePostId = new mongoose.Types.ObjectId().toString();
            const res = await request(app)
                .post(`/comment/post/${fakePostId}`)
                .set("Authorization", `Bearer ${accessToken}`)
                .send(testComment);

            expect(res.status).toBe(404);
        });
    });

    describe("GET /comment/post/:postId", () => {
        test("should get comments for a post with pagination", async () => {
            const res = await request(app)
                .get(`/comment/post/${postId}`)
                .query({ page: 1, limit: 10 });

            expect(res.status).toBe(200);
            expect(res.body.comments).toBeDefined();
            expect(res.body.pagination).toBeDefined();
            expect(Array.isArray(res.body.comments)).toBe(true);
            expect(res.body.comments.length).toBeGreaterThan(0);
        });

        test("should return 404 for non-existent post", async () => {
            const fakePostId = new mongoose.Types.ObjectId().toString();
            const res = await request(app).get(`/comment/post/${fakePostId}`);

            expect(res.status).toBe(404);
        });
    });

    describe("GET /comment/:id", () => {
        test("should get a single comment by ID", async () => {
            const res = await request(app).get(`/comment/${commentId}`);

            expect(res.status).toBe(200);
            expect(res.body._id).toBe(commentId);
            expect(res.body.content).toBe(testComment.content);
        });

        test("should return 404 for non-existent comment", async () => {
            const fakeCommentId = new mongoose.Types.ObjectId().toString();
            const res = await request(app).get(`/comment/${fakeCommentId}`);

            expect(res.status).toBe(404);
        });
    });

    describe("PUT /comment/:id", () => {
        test("should update own comment", async () => {
            const updatedContent = "Updated comment content";
            const res = await request(app)
                .put(`/comment/${commentId}`)
                .set("Authorization", `Bearer ${accessToken}`)
                .send({ content: updatedContent });

            expect(res.status).toBe(200);
            expect(res.body.content).toBe(updatedContent);
        });

        test("should fail without authentication", async () => {
            const res = await request(app)
                .put(`/comment/${commentId}`)
                .send({ content: "New content" });

            expect(res.status).toBe(401);
        });
    });

    describe("DELETE /comment/:id", () => {
        test("should delete own comment", async () => {
            const postBefore = await request(app).get(`/post/${postId}`);
            const countBefore = postBefore.body.commentsCount;

            const res = await request(app)
                .delete(`/comment/${commentId}`)
                .set("Authorization", `Bearer ${accessToken}`);

            expect(res.status).toBe(200);
            expect(res.body.message).toBe("Comment deleted successfully");

            const postAfter = await request(app).get(`/post/${postId}`);
            expect(postAfter.body.commentsCount).toBe(countBefore - 1);
        });

        test("should fail to delete non-existent comment", async () => {
            const res = await request(app)
                .delete(`/comment/${commentId}`)
                .set("Authorization", `Bearer ${accessToken}`);

            expect(res.status).toBe(404);
        });

        test("should fail to delete without authentication", async () => {
            const createRes = await request(app)
                .post(`/comment/post/${postId}`)
                .set("Authorization", `Bearer ${accessToken}`)
                .send({ content: "Comment to delete without auth" });

            const res = await request(app).delete(`/comment/${createRes.body._id}`);

            expect(res.status).toBe(401);

            await Comments.findByIdAndDelete(createRes.body._id);
        });

        test("should fail to delete another user's comment", async () => {
            const otherUser = {
                email: "othercommentuser@example.com",
                password: "password123",
                name: "Other User",
            };
            const otherRegisterRes = await request(app).post("/auth/register").send(otherUser);
            const otherToken = otherRegisterRes.body.token;

            const createRes = await request(app)
                .post(`/comment/post/${postId}`)
                .set("Authorization", `Bearer ${accessToken}`)
                .send({ content: "First user's comment" });

            const res = await request(app)
                .delete(`/comment/${createRes.body._id}`)
                .set("Authorization", `Bearer ${otherToken}`);

            expect(res.status).toBe(403);
            expect(res.body.error).toContain("Forbidden");

            await Comments.findByIdAndDelete(createRes.body._id);
            await User.deleteMany({ email: otherUser.email });
        });
    });

    describe("Additional edge cases", () => {
        test("should fail to create comment with empty content", async () => {
            const res = await request(app)
                .post(`/comment/post/${postId}`)
                .set("Authorization", `Bearer ${accessToken}`)
                .send({ content: "   " });

            expect(res.status).toBe(400);
        });

        test("should fail to update non-existent comment", async () => {
            const fakeId = new mongoose.Types.ObjectId().toString();
            const res = await request(app)
                .put(`/comment/${fakeId}`)
                .set("Authorization", `Bearer ${accessToken}`)
                .send({ content: "Updated content" });

            expect(res.status).toBe(404);
        });

        test("should fail to update another user's comment", async () => {
            const otherUser = {
                email: "anotherusercomment@example.com",
                password: "password123",
                name: "Another User",
            };
            const otherRegisterRes = await request(app).post("/auth/register").send(otherUser);
            const otherToken = otherRegisterRes.body.token;

            const createRes = await request(app)
                .post(`/comment/post/${postId}`)
                .set("Authorization", `Bearer ${accessToken}`)
                .send({ content: "Original comment" });

            const res = await request(app)
                .put(`/comment/${createRes.body._id}`)
                .set("Authorization", `Bearer ${otherToken}`)
                .send({ content: "Hacked content" });

            expect(res.status).toBe(403);
            expect(res.body.error).toContain("Forbidden");

            await Comments.findByIdAndDelete(createRes.body._id);
            await User.deleteMany({ email: otherUser.email });
        });

        test("should get comments with pagination limit enforced", async () => {
            for (let i = 0; i < 5; i++) {
                await request(app)
                    .post(`/comment/post/${postId}`)
                    .set("Authorization", `Bearer ${accessToken}`)
                    .send({ content: `Comment ${i}` });
            }

            const res = await request(app)
                .get(`/comment/post/${postId}`)
                .query({ page: 1, limit: 3 });

            expect(res.status).toBe(200);
            expect(res.body.comments.length).toBeLessThanOrEqual(3);
            expect(res.body.pagination.limit).toBe(3);
        });

        test("should respect max limit of 50 for pagination", async () => {
            const res = await request(app)
                .get(`/comment/post/${postId}`)
                .query({ page: 1, limit: 100 });

            expect(res.status).toBe(200);
            expect(res.body.pagination.limit).toBe(50);
        });

        test("should get comment by invalid ID format", async () => {
            const res = await request(app).get(`/comment/invalidid123`);

            expect(res.status).toBe(500);
        });

        test("should handle database error in getCommentsByPost", async () => {
            jest.spyOn(Post, "findById").mockRejectedValueOnce(new Error("Database error"));

            const res = await request(app).get(`/comment/post/${postId}`);
            expect(res.status).toBe(500);
            expect(res.body.error).toBe("Failed to get comments");

            (Post.findById as jest.Mock).mockRestore();
        });

        test("should handle database error in createComment", async () => {
            jest.spyOn(Comments, "create").mockRejectedValueOnce(new Error("Database error"));

            const res = await request(app)
                .post(`/comment/post/${postId}`)
                .set("Authorization", `Bearer ${accessToken}`)
                .send({ content: "Test comment" });

            expect(res.status).toBe(500);
            expect(res.body.error).toBe("Failed to create comment");

            (Comments.create as jest.Mock).mockRestore();
        });

        test("should handle database error in updateComment", async () => {
            jest.spyOn(Comments, "findById").mockRejectedValueOnce(new Error("Database error"));

            const res = await request(app)
                .put(`/comment/507f1f77bcf86cd799439011`)
                .set("Authorization", `Bearer ${accessToken}`)
                .send({ content: "Updated content" });

            expect(res.status).toBe(500);
            expect(res.body.error).toBe("Failed to update comment");

            (Comments.findById as jest.Mock).mockRestore();
        });

        test("should handle database error in deleteComment", async () => {
            jest.spyOn(Comments, "findById").mockRejectedValueOnce(new Error("Database error"));

            const res = await request(app)
                .delete(`/comment/507f1f77bcf86cd799439011`)
                .set("Authorization", `Bearer ${accessToken}`);

            expect(res.status).toBe(500);
            expect(res.body.error).toBe("Failed to delete comment");

            (Comments.findById as jest.Mock).mockRestore();
        });
    });
});

describe("Comment Controller Direct Tests", () => {
    const commentController = require("../controllers/commentController").default;

    const mockResponse = () => {
        const res: any = {};
        res.status = jest.fn().mockReturnValue(res);
        res.json = jest.fn().mockReturnValue(res);
        return res;
    };

    test("createComment without userId returns 401", async () => {
        const req = { body: { content: "test" }, params: { postId: "123" }, user: undefined };
        const res = mockResponse();

        await commentController.createComment(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
    });

    test("updateComment without userId returns 401", async () => {
        const req: any = { body: { content: "test" }, params: { id: "123" }, user: undefined };
        const res = mockResponse();

        await commentController.updateComment(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
    });

    test("deleteComment without userId returns 401", async () => {
        const req: any = { params: { id: "123" }, user: undefined };
        const res = mockResponse();

        await commentController.deleteComment(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
    });
});
