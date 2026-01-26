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

  // Register user
  const registerRes = await request(app)
    .post("/auth/register")
    .send(testUser);

  accessToken = registerRes.body.token;
  userId = registerRes.body.user._id;

  // Create a post for comments
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
      const res = await request(app)
        .post(`/comment/post/${postId}`)
        .send(testComment);

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
      const res = await request(app)
        .get(`/comment/post/${fakePostId}`);

      expect(res.status).toBe(404);
    });
  });

  describe("GET /comment/:id", () => {
    test("should get a single comment by ID", async () => {
      const res = await request(app)
        .get(`/comment/${commentId}`);

      expect(res.status).toBe(200);
      expect(res.body._id).toBe(commentId);
      expect(res.body.content).toBe(testComment.content);
    });

    test("should return 404 for non-existent comment", async () => {
      const fakeCommentId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .get(`/comment/${fakeCommentId}`);

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
      // First check post comment count
      const postBefore = await request(app).get(`/post/${postId}`);
      const countBefore = postBefore.body.commentsCount;

      const res = await request(app)
        .delete(`/comment/${commentId}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Comment deleted successfully");

      // Verify comment count decreased
      const postAfter = await request(app).get(`/post/${postId}`);
      expect(postAfter.body.commentsCount).toBe(countBefore - 1);
    });

    test("should fail to delete non-existent comment", async () => {
      const res = await request(app)
        .delete(`/comment/${commentId}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(404);
    });
  });
});
