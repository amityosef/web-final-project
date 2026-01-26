import request from "supertest";
import mongoose from "mongoose";
import initApp from "../index";
import User from "../model/userModel";
import Post from "../model/postModel";
import { Express } from "express";

let app: Express;
let accessToken: string;
let userId: string;

const testUser = {
  email: "usertest@example.com",
  password: "password123",
  name: "User Tester",
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
  userId = res.body.user._id;

  // Create some posts for the user
  for (let i = 0; i < 3; i++) {
    await request(app)
      .post("/post")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ content: `Test post ${i + 1}` });
  }
});

afterAll(async () => {
  await User.deleteMany({ email: testUser.email });
  await Post.deleteMany({});
  await mongoose.connection.close();
});

describe("User Profile API", () => {
  describe("GET /user/me", () => {
    test("should get current user profile", async () => {
      const res = await request(app)
        .get("/user/me")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body._id).toBe(userId);
      expect(res.body.email).toBe(testUser.email);
      expect(res.body.name).toBe(testUser.name);
      expect(res.body.postsCount).toBe(3);
      expect(res.body).not.toHaveProperty("password");
      expect(res.body).not.toHaveProperty("refreshToken");
    });

    test("should fail without authentication", async () => {
      const res = await request(app)
        .get("/user/me");

      expect(res.status).toBe(401);
    });
  });

  describe("GET /user/:userId", () => {
    test("should get user profile by ID", async () => {
      const res = await request(app)
        .get(`/user/${userId}`);

      expect(res.status).toBe(200);
      expect(res.body._id).toBe(userId);
      expect(res.body.email).toBe(testUser.email);
      expect(res.body.postsCount).toBe(3);
    });

    test("should return 404 for non-existent user", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .get(`/user/${fakeId}`);

      expect(res.status).toBe(404);
    });
  });

  describe("PUT /user/:userId", () => {
    test("should update own profile", async () => {
      const updatedName = "Updated Name";
      const updatedImage = "/public/uploads/profile.jpg";

      const res = await request(app)
        .put(`/user/${userId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          name: updatedName,
          profileImage: updatedImage
        });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe(updatedName);
      expect(res.body.profileImage).toBe(updatedImage);
    });

    test("should fail without authentication", async () => {
      const res = await request(app)
        .put(`/user/${userId}`)
        .send({ name: "New Name" });

      expect(res.status).toBe(401);
    });

    test("should fail to update another user's profile", async () => {
      // Register another user
      const otherUser = await request(app)
        .post("/auth/register")
        .send({
          email: "other@example.com",
          password: "password123"
        });

      const otherToken = otherUser.body.token;

      // Try to update original user's profile with other user's token
      const res = await request(app)
        .put(`/user/${userId}`)
        .set("Authorization", `Bearer ${otherToken}`)
        .send({ name: "Hacked Name" });

      expect(res.status).toBe(403);

      // Cleanup
      await User.deleteMany({ email: "other@example.com" });
    });

    test("should only update name and profileImage", async () => {
      const res = await request(app)
        .put(`/user/${userId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          name: "Final Name",
          email: "hacked@email.com", // Should be ignored
          password: "newpassword" // Should be ignored
        });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Final Name");
      expect(res.body.email).toBe(testUser.email); // Should remain unchanged
    });
  });
});
