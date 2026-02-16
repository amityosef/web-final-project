import request from "supertest";
import initApp from "../index";
import { Express } from "express";
import User from "../model/userModel";
import Post from "../model/postModel";
import mongoose from "mongoose";
import { userData, singlePostData } from "./testUtils";

let app: Express;
beforeAll(async () => {
    app = await initApp();
    await User.deleteMany({});
    await Post.deleteMany({});
});

afterAll(async () => {
    await mongoose.connection.close();
});

describe("Auth API", () => {
    test("access restricted url denied", async () => {
        const response = await request(app).post("/post").send(singlePostData);
        expect(response.statusCode).toBe(401);
    });

    test("test register", async () => {
        const response = await request(app).post("/auth/register").send({
            email: userData.email,
            password: userData.password,
            name: "Test User",
        });
        expect(response.statusCode).toBe(201);
        expect(response.body).toHaveProperty("token");
        expect(response.body).toHaveProperty("refreshToken");
        expect(response.body).toHaveProperty("user");
        expect(response.body.user).toHaveProperty("_id");
        expect(response.body.user.email).toBe(userData.email);
        userData._id = response.body.user._id;
        userData.token = response.body.token;
        userData.refreshToken = response.body.refreshToken;
    });

    test("test register with existing email fails", async () => {
        const response = await request(app).post("/auth/register").send({
            email: userData.email,
            password: "differentpassword",
        });
        expect(response.statusCode).toBe(400);
    });

    test("test access with token permitted1", async () => {
        const response = await request(app)
            .post("/post")
            .set("Authorization", "Bearer " + userData.token)
            .send(singlePostData);
        expect(response.statusCode).toBe(201);
        expect(response.body).toHaveProperty("_id");
    });

    test("test access with modified token restricted", async () => {
        const newToken = userData.token + "m";
        const response = await request(app)
            .post("/post")
            .set("Authorization", "Bearer " + newToken)
            .send(singlePostData);
        expect(response.statusCode).toBe(401);
        expect(response.body).toHaveProperty("error");
    });

    test("test login", async () => {
        const response = await request(app).post("/auth/login").send({
            email: userData.email,
            password: userData.password,
        });
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty("token");
        expect(response.body).toHaveProperty("refreshToken");
        expect(response.body).toHaveProperty("user");
        userData.token = response.body.token;
        userData.refreshToken = response.body.refreshToken;
    });

    test("test login with wrong password fails", async () => {
        const response = await request(app).post("/auth/login").send({
            email: userData.email,
            password: "wrongpassword",
        });
        expect(response.statusCode).toBe(400);
    });

    test("test get me endpoint", async () => {
        const response = await request(app)
            .get("/auth/me")
            .set("Authorization", "Bearer " + userData.token);
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty("_id");
        expect(response.body.email).toBe(userData.email);
    });

    test("test access with token permitted2", async () => {
        const response = await request(app)
            .post("/post")
            .set("Authorization", "Bearer " + userData.token)
            .send(singlePostData);
        expect(response.statusCode).toBe(201);
        expect(response.body).toHaveProperty("_id");
        singlePostData._id = response.body._id;
    });

    jest.setTimeout(15000);

    test("test token expiration", async () => {
        delete singlePostData._id;
        await new Promise((resolve) => setTimeout(resolve, 6000));
        const response = await request(app)
            .post("/post")
            .set("Authorization", "Bearer " + userData.token)
            .send(singlePostData);
        expect(response.statusCode).toBe(401);
        expect(response.body).toHaveProperty("error");

        const refreshResponse = await request(app).post("/auth/refresh-token").send({
            refreshToken: userData.refreshToken,
        });
        expect(refreshResponse.statusCode).toBe(200);
        expect(refreshResponse.body).toHaveProperty("token");
        expect(refreshResponse.body).toHaveProperty("refreshToken");
        userData.token = refreshResponse.body.token;
        userData.refreshToken = refreshResponse.body.refreshToken;

        const newAccessResponse = await request(app)
            .post("/post")
            .set("Authorization", "Bearer " + userData.token)
            .send(singlePostData);
        expect(newAccessResponse.statusCode).toBe(201);
        expect(newAccessResponse.body).toHaveProperty("_id");
    });

    test("test double use of refresh token", async () => {
        const refreshResponse1 = await request(app).post("/auth/refresh-token").send({
            refreshToken: userData.refreshToken,
        });
        expect(refreshResponse1.statusCode).toBe(200);
        expect(refreshResponse1.body).toHaveProperty("token");
        expect(refreshResponse1.body).toHaveProperty("refreshToken");
        const firstNewRefreshToken = refreshResponse1.body.refreshToken;
        userData.token = refreshResponse1.body.token;

        const refreshResponse2 = await request(app).post("/auth/refresh-token").send({
            refreshToken: userData.refreshToken,
        });
        expect(refreshResponse2.statusCode).toBe(401);
        expect(refreshResponse2.body).toHaveProperty("error");

        const refreshResponse3 = await request(app).post("/auth/refresh-token").send({
            refreshToken: firstNewRefreshToken,
        });
        expect(refreshResponse3.statusCode).toBe(401);
        expect(refreshResponse3.body).toHaveProperty("error");
    });

    test("test logout", async () => {
        const loginRes = await request(app).post("/auth/login").send({
            email: userData.email,
            password: userData.password,
        });
        userData.token = loginRes.body.token;
        userData.refreshToken = loginRes.body.refreshToken;

        const logoutRes = await request(app)
            .post("/auth/logout")
            .set("Authorization", "Bearer " + userData.token)
            .send({ refreshToken: userData.refreshToken });

        expect(logoutRes.statusCode).toBe(200);
        expect(logoutRes.body.message).toBe("Logged out successfully");

        const refreshRes = await request(app).post("/auth/refresh-token").send({
            refreshToken: userData.refreshToken,
        });
        expect(refreshRes.statusCode).toBe(401);
    });

    test("test register without email", async () => {
        const response = await request(app).post("/auth/register").send({
            password: "password123",
        });
        expect(response.statusCode).toBe(401);
        expect(response.body).toHaveProperty("error");
    });

    test("test register without password", async () => {
        const response = await request(app).post("/auth/register").send({
            email: "newuser@test.com",
        });
        expect(response.statusCode).toBe(401);
        expect(response.body).toHaveProperty("error");
    });

    test("test login without email", async () => {
        const response = await request(app).post("/auth/login").send({
            password: "password123",
        });
        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty("error");
    });

    test("test login without password", async () => {
        const response = await request(app).post("/auth/login").send({
            email: userData.email,
        });
        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty("error");
    });

    test("test login with non-existent user", async () => {
        const response = await request(app).post("/auth/login").send({
            email: "nonexistent@test.com",
            password: "password123",
        });
        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe("Invalid email or password");
    });

    test("test refresh token without token", async () => {
        const response = await request(app).post("/auth/refresh-token").send({});
        expect(response.statusCode).toBe(401);
        expect(response.body).toHaveProperty("error");
    });

    test("test refresh token with invalid token", async () => {
        const response = await request(app).post("/auth/refresh-token").send({
            refreshToken: "invalid.token.here",
        });
        expect(response.statusCode).toBe(401);
        expect(response.body).toHaveProperty("error");
    });

    test("test logout without authentication", async () => {
        const response = await request(app).post("/auth/logout").send({
            refreshToken: "sometoken",
        });
        expect(response.statusCode).toBe(401);
        expect(response.body).toHaveProperty("error");
    });

    test("test logout all devices (no refresh token provided)", async () => {
        const loginRes = await request(app).post("/auth/login").send({
            email: userData.email,
            password: userData.password,
        });
        const token = loginRes.body.token;

        const logoutRes = await request(app)
            .post("/auth/logout")
            .set("Authorization", "Bearer " + token)
            .send({});

        expect(logoutRes.statusCode).toBe(200);
        expect(logoutRes.body.message).toBe("Logged out successfully");
    });

    test("test get me without authentication", async () => {
        const response = await request(app).get("/auth/me");
        expect(response.statusCode).toBe(401);
        expect(response.body).toHaveProperty("error");
    });

    test("test google login without credential", async () => {
        const response = await request(app).post("/auth/google").send({});
        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe("Google credential is required");
    });

    test("test google login with valid credential - new user", async () => {
        const jwt = require("jsonwebtoken");
        const googleEmail = "newgoogleuser@gmail.com";
        const credential = jwt.sign(
            {
                email: googleEmail,
                name: "Google User",
                picture: "https://example.com/photo.jpg",
                sub: "google_id_123456",
            },
            "any_secret"
        );

        await User.deleteMany({ email: googleEmail });

        const response = await request(app).post("/auth/google").send({ credential });
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty("token");
        expect(response.body).toHaveProperty("refreshToken");
        expect(response.body.user.email).toBe(googleEmail);
        expect(response.body.user.name).toBe("Google User");

        await User.deleteMany({ email: googleEmail });
    });

    test("test google login with valid credential - existing user by email", async () => {
        const jwt = require("jsonwebtoken");
        const existingEmail = "existinggoogle@gmail.com";

        await User.create({
            email: existingEmail,
            password: "hashedpassword",
            name: "Existing User",
        });

        const credential = jwt.sign(
            {
                email: existingEmail,
                name: "Google Name",
                picture: "https://example.com/newphoto.jpg",
                sub: "google_id_789",
            },
            "any_secret"
        );

        const response = await request(app).post("/auth/google").send({ credential });
        expect(response.statusCode).toBe(200);
        expect(response.body.user.email).toBe(existingEmail);

        const updatedUser = await User.findOne({ email: existingEmail });
        expect(updatedUser?.googleId).toBe("google_id_789");

        await User.deleteMany({ email: existingEmail });
    });

    test("test google login with invalid credential - no email", async () => {
        const jwt = require("jsonwebtoken");
        const credential = jwt.sign(
            {
                name: "No Email User",
                sub: "google_id_no_email",
            },
            "any_secret"
        );

        const response = await request(app).post("/auth/google").send({ credential });
        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe("Invalid Google credential");
    });

    test("test google login with existing user who has profile data", async () => {
        const jwt = require("jsonwebtoken");
        const existingEmail = "existingfull@gmail.com";

        await User.deleteMany({ email: existingEmail });
        await User.create({
            email: existingEmail,
            password: "hashedpassword",
            name: "Existing Full Name",
            profileImage: "https://existing.com/photo.jpg",
            googleId: "existing_google_id",
        });

        const credential = jwt.sign(
            {
                email: existingEmail,
                name: "New Google Name",
                picture: "https://example.com/newphoto.jpg",
                sub: "existing_google_id",
            },
            "any_secret"
        );

        const response = await request(app).post("/auth/google").send({ credential });
        expect(response.statusCode).toBe(200);

        const user = await User.findOne({ email: existingEmail });
        expect(user?.name).toBe("Existing Full Name");
        expect(user?.profileImage).toBe("https://existing.com/photo.jpg");

        await User.deleteMany({ email: existingEmail });
    });

    test("test login with google-only user fails", async () => {
        const googleOnlyEmail = "googleonly@gmail.com";

        await User.deleteMany({ email: googleOnlyEmail });
        await User.create({
            email: googleOnlyEmail,
            googleId: "google_only_id_123",
            name: "Google Only User",
            password: "",
        });

        const response = await request(app).post("/auth/login").send({
            email: googleOnlyEmail,
            password: "anypassword",
        });
        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe("Please use Google login for this account");

        await User.deleteMany({ email: googleOnlyEmail });
    });

    test("test register with default name from email", async () => {
        const newEmail = "defaultname@test.com";
        const response = await request(app).post("/auth/register").send({
            email: newEmail,
            password: "password123",
        });
        expect(response.statusCode).toBe(201);
        expect(response.body.user.name).toBe("defaultname");

        await User.deleteMany({ email: newEmail });
    });

    test("test authorization header without Bearer prefix", async () => {
        const response = await request(app)
            .post("/post")
            .set("Authorization", "Basic sometoken")
            .send({ content: "Test post" });
        expect(response.statusCode).toBe(401);
        expect(response.body).toHaveProperty("error");
    });

    test("test register database error", async () => {
        const originalCreate = User.create;
        jest.spyOn(User, "create").mockRejectedValueOnce(new Error("Database error"));

        const response = await request(app).post("/auth/register").send({
            email: "dberror@test.com",
            password: "password123",
        });
        expect(response.statusCode).toBe(401);
        expect(response.body.error).toBe("Registration failed");

        (User.create as jest.Mock).mockRestore();
    });

    test("test login database error", async () => {
        jest.spyOn(User, "findOne").mockRejectedValueOnce(new Error("Database error"));

        const response = await request(app).post("/auth/login").send({
            email: userData.email,
            password: userData.password,
        });
        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe("Login failed");

        (User.findOne as jest.Mock).mockRestore();
    });

    test("test google login database error", async () => {
        const jwt = require("jsonwebtoken");
        const credential = jwt.sign(
            {
                email: "googledberror@gmail.com",
                name: "DB Error User",
                picture: "https://example.com/photo.jpg",
                sub: "google_db_error_123",
            },
            "any_secret"
        );

        jest.spyOn(User, "findOne").mockRejectedValueOnce(new Error("Database error"));

        const response = await request(app).post("/auth/google").send({ credential });
        expect(response.statusCode).toBe(500);
        expect(response.body.error).toBe("Google login failed");

        (User.findOne as jest.Mock).mockRestore();
    });

    test("test refresh token user not found after decode", async () => {
        const jwt = require("jsonwebtoken");
        const fakeUserId = "507f1f77bcf86cd799439011";
        const secret = process.env.JWT_SECRET || "test_jwt_secret_key_12345";
        const fakeRefreshToken = jwt.sign({ userId: fakeUserId }, secret, { expiresIn: 3600 });

        const response = await request(app).post("/auth/refresh-token").send({
            refreshToken: fakeRefreshToken,
        });
        expect(response.statusCode).toBe(401);
        expect(response.body.error).toBe("Invalid refresh token");
    });

    test("test logout database error", async () => {
        const loginRes = await request(app).post("/auth/login").send({
            email: userData.email,
            password: userData.password,
        });
        const token = loginRes.body.token;

        jest.spyOn(User, "findById").mockRejectedValueOnce(new Error("Database error"));

        const response = await request(app)
            .post("/auth/logout")
            .set("Authorization", "Bearer " + token)
            .send({});
        expect(response.statusCode).toBe(500);
        expect(response.body.error).toBe("Logout failed");

        (User.findById as jest.Mock).mockRestore();
    });

    test("test logout user not found", async () => {
        const jwt = require("jsonwebtoken");
        const fakeUserId = "507f1f77bcf86cd799439011";
        const secret = process.env.JWT_SECRET || "test_jwt_secret_key_12345";
        const fakeToken = jwt.sign({ userId: fakeUserId }, secret, { expiresIn: 3600 });

        const response = await request(app)
            .post("/auth/logout")
            .set("Authorization", "Bearer " + fakeToken)
            .send({});
        expect(response.statusCode).toBe(404);
        expect(response.body.error).toBe("User not found");
    });

    test("test get me database error", async () => {
        const loginRes = await request(app).post("/auth/login").send({
            email: userData.email,
            password: userData.password,
        });
        const token = loginRes.body.token;

        jest.spyOn(User, "findById").mockRejectedValueOnce(new Error("Database error"));

        const response = await request(app)
            .get("/auth/me")
            .set("Authorization", "Bearer " + token);
        expect(response.statusCode).toBe(500);
        expect(response.body.error).toBe("Failed to get user");

        (User.findById as jest.Mock).mockRestore();
    });

    test("test get me user not found", async () => {
        const jwt = require("jsonwebtoken");
        const fakeUserId = "507f1f77bcf86cd799439011";
        const secret = process.env.JWT_SECRET || "test_jwt_secret_key_12345";
        const fakeToken = jwt.sign({ userId: fakeUserId }, secret, { expiresIn: 3600 });

        const response = await request(app)
            .get("/auth/me")
            .set("Authorization", "Bearer " + fakeToken);
        expect(response.statusCode).toBe(404);
        expect(response.body.error).toBe("User not found");
    });
});

describe("Auth Controller Direct Tests", () => {
    const authController = require("../controllers/authController").default;

    const mockResponse = () => {
        const res: any = {};
        res.status = jest.fn().mockReturnValue(res);
        res.json = jest.fn().mockReturnValue(res);
        return res;
    };

    test("logout without userId returns 401", async () => {
        const req: any = { body: {}, user: undefined };
        const res = mockResponse();

        await authController.logout(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
    });

    test("getMe without userId returns 401", async () => {
        const req: any = { user: undefined };
        const res = mockResponse();

        await authController.getMe(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
    });
});
