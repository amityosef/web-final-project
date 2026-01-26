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

  // Register user
  const res = await request(app)
    .post("/auth/register")
    .send(testUser);

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
      const res = await request(app)
        .post("/post")
        .send(testPost);

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
      const res = await request(app)
        .get("/post")
        .query({ page: 1, limit: 10 });

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
      const res = await request(app)
        .get(`/post/${postId}`);

      expect(res.status).toBe(200);
      expect(res.body._id).toBe(postId);
      expect(res.body.content).toBe(testPost.content);
    });

    test("should return 404 for non-existent post", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .get(`/post/${fakeId}`);

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
      const res = await request(app)
        .put(`/post/${postId}`)
        .send({ content: "New content" });

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
      const res = await request(app)
        .post(`/post/${postId}/like`);

      expect(res.status).toBe(401);
    });
  });

  describe("GET /post/user/:userId", () => {
    test("should get posts by user", async () => {
      const res = await request(app)
        .get(`/post/user/${userId}`);

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
  });
});
