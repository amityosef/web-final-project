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

    test("should fail to update non-existent user", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .put(`/user/${fakeId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ name: "New Name" });

      expect(res.status).toBe(403);
    });

    test("should trim whitespace from name", async () => {
      const res = await request(app)
        .put(`/user/${userId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ name: "  Trimmed Name  " });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Trimmed Name");
    });
  });

  describe("Additional edge cases", () => {
    test("should get profile with invalid ID format", async () => {
      const res = await request(app)
        .get(`/user/invalidid123`);

      expect(res.status).toBe(500);
    });

    test("should handle get my profile when user doesn't exist", async () => {
      // This is an edge case that shouldn't happen in normal flow
      // but tests the error handling in getMyProfile

      // Register a temporary user
      const tempUser = await request(app)
        .post("/auth/register")
        .send({
          email: "tempuser@test.com",
          password: "password123"
        });

      const tempToken = tempUser.body.token;
      const tempUserId = tempUser.body.user._id;

      // Delete the user directly from DB
      await User.findByIdAndDelete(tempUserId);

      // Try to get profile with valid token but deleted user
      const res = await request(app)
        .get("/user/me")
        .set("Authorization", `Bearer ${tempToken}`);

      expect(res.status).toBe(404);
    });

    test("should update profile image only", async () => {
      const res = await request(app)
        .put(`/user/${userId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ profileImage: "/new/image.jpg" });

      expect(res.status).toBe(200);
      expect(res.body.profileImage).toBe("/new/image.jpg");
    });

    test("should update name only", async () => {
      const res = await request(app)
        .put(`/user/${userId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ name: "Name Only Update" });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Name Only Update");
    });

    test("should return user profile without sensitive fields", async () => {
      const res = await request(app)
        .get(`/user/${userId}`);

      expect(res.status).toBe(200);
      expect(res.body).not.toHaveProperty("password");
      expect(res.body).not.toHaveProperty("refreshToken");
    });

    test("should get my profile without sensitive fields", async () => {
      const res = await request(app)
        .get("/user/me")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body).not.toHaveProperty("password");
      expect(res.body).not.toHaveProperty("refreshToken");
    });
  });
});
