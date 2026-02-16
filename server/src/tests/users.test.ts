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

    const res = await request(app).post("/auth/register").send(testUser);

    accessToken = res.body.token;
    userId = res.body.user._id;

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
            const res = await request(app).get("/user/me");

            expect(res.status).toBe(401);
        });
    });

    describe("GET /user/:userId", () => {
        test("should get user profile by ID", async () => {
            const res = await request(app).get(`/user/${userId}`);

            expect(res.status).toBe(200);
            expect(res.body._id).toBe(userId);
            expect(res.body.email).toBe(testUser.email);
            expect(res.body.postsCount).toBe(3);
        });

        test("should return 404 for non-existent user", async () => {
            const fakeId = new mongoose.Types.ObjectId().toString();
            const res = await request(app).get(`/user/${fakeId}`);

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
                    profileImage: updatedImage,
                });

            expect(res.status).toBe(200);
            expect(res.body.name).toBe(updatedName);
            expect(res.body.profileImage).toBe(updatedImage);
        });

        test("should fail without authentication", async () => {
            const res = await request(app).put(`/user/${userId}`).send({ name: "New Name" });

            expect(res.status).toBe(401);
        });

        test("should fail to update another user's profile", async () => {
            const otherUser = await request(app).post("/auth/register").send({
                email: "other@example.com",
                password: "password123",
            });

            const otherToken = otherUser.body.token;

            const res = await request(app)
                .put(`/user/${userId}`)
                .set("Authorization", `Bearer ${otherToken}`)
                .send({ name: "Hacked Name" });

            expect(res.status).toBe(403);

            await User.deleteMany({ email: "other@example.com" });
        });

        test("should only update name and profileImage", async () => {
            const res = await request(app)
                .put(`/user/${userId}`)
                .set("Authorization", `Bearer ${accessToken}`)
                .send({
                    name: "Final Name",
                    email: "hacked@email.com",
                    password: "newpassword",
                });

            expect(res.status).toBe(200);
            expect(res.body.name).toBe("Final Name");
            expect(res.body.email).toBe(testUser.email);
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
            const res = await request(app).get(`/user/invalidid123`);

            expect(res.status).toBe(500);
        });

        test("should handle get my profile when user doesn't exist", async () => {
            const tempUser = await request(app).post("/auth/register").send({
                email: "tempuser@test.com",
                password: "password123",
            });

            const tempToken = tempUser.body.token;
            const tempUserId = tempUser.body.user._id;

            await User.findByIdAndDelete(tempUserId);

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

        test("should handle update profile when user was deleted", async () => {
            const tempUser = await request(app).post("/auth/register").send({
                email: "deleteduser@test.com",
                password: "password123",
            });

            const tempToken = tempUser.body.token;
            const tempUserId = tempUser.body.user._id;

            await User.findByIdAndDelete(tempUserId);

            const res = await request(app)
                .put(`/user/${tempUserId}`)
                .set("Authorization", `Bearer ${tempToken}`)
                .send({ name: "New Name" });

            expect(res.status).toBe(404);
        });

        test("should return user profile without sensitive fields", async () => {
            const res = await request(app).get(`/user/${userId}`);

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

        test("should handle database error in getProfile", async () => {
            jest.spyOn(User, "findById").mockImplementationOnce(() => {
                throw new Error("Database error");
            });

            const res = await request(app).get(`/user/${userId}`);
            expect(res.status).toBe(500);
            expect(res.body.error).toBe("Failed to get profile");

            (User.findById as jest.Mock).mockRestore();
        });

        test("should handle database error in updateProfile", async () => {
            jest.spyOn(User, "findById").mockRejectedValueOnce(new Error("Database error"));

            const res = await request(app)
                .put(`/user/${userId}`)
                .set("Authorization", `Bearer ${accessToken}`)
                .send({ name: "Test" });

            expect(res.status).toBe(500);
            expect(res.body.error).toBe("Failed to update profile");

            (User.findById as jest.Mock).mockRestore();
        });

        test("should handle database error in getMyProfile", async () => {
            jest.spyOn(User, "findById").mockImplementationOnce(() => {
                throw new Error("Database error");
            });

            const res = await request(app)
                .get("/user/me")
                .set("Authorization", `Bearer ${accessToken}`);

            expect(res.status).toBe(500);
            expect(res.body.error).toBe("Failed to get profile");

            (User.findById as jest.Mock).mockRestore();
        });
    });
});

describe("User Controller Direct Tests", () => {
    const userController = require("../controllers/userController").default;

    const mockResponse = () => {
        const res: any = {};
        res.status = jest.fn().mockReturnValue(res);
        res.json = jest.fn().mockReturnValue(res);
        return res;
    };

    test("updateProfile without userId returns 401", async () => {
        const req: any = { body: { name: "test" }, params: { userId: "123" }, user: undefined };
        const res = mockResponse();

        await userController.updateProfile(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
    });

    test("getMyProfile without userId returns 401", async () => {
        const req: any = { user: undefined };
        const res = mockResponse();

        await userController.getMyProfile(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
    });
});
