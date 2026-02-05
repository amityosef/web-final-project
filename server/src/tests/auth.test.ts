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
            name: "Test User"
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
            password: "differentpassword"
        });
        expect(response.statusCode).toBe(400);
    });

    test("test access with token permitted1", async () => {
        const response = await request(app).post("/post")
            .set("Authorization", "Bearer " + userData.token)
            .send(singlePostData);
        expect(response.statusCode).toBe(201);
        expect(response.body).toHaveProperty("_id");
    });

    test("test access with modified token restricted", async () => {
        const newToken = userData.token + "m";
        const response = await request(app).post("/post")
            .set("Authorization", "Bearer " + newToken)
            .send(singlePostData);
        expect(response.statusCode).toBe(401);
        expect(response.body).toHaveProperty("error");
    });

    test("test login", async () => {
        const response = await request(app).post("/auth/login").send({
            email: userData.email,
            password: userData.password
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
            password: "wrongpassword"
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
        const response = await request(app).post("/post")
            .set("Authorization", "Bearer " + userData.token)
            .send(singlePostData);
        expect(response.statusCode).toBe(201);
        expect(response.body).toHaveProperty("_id");
        singlePostData._id = response.body._id;
    });

    //set jest timeout to 10s
    jest.setTimeout(15000);

    test("test token expiration", async () => {
        // Assuming the token expiration is set to short duration for testing
        delete singlePostData._id;
        await new Promise(resolve => setTimeout(resolve, 6000)); // wait for 6 seconds
        const response = await request(app).post("/post")
            .set("Authorization", "Bearer " + userData.token)
            .send(singlePostData);
        expect(response.statusCode).toBe(401);
        expect(response.body).toHaveProperty("error");

        //get new token using refresh token
        const refreshResponse = await request(app).post("/auth/refresh-token").send({
            refreshToken: userData.refreshToken
        });
        expect(refreshResponse.statusCode).toBe(200);
        expect(refreshResponse.body).toHaveProperty("token");
        expect(refreshResponse.body).toHaveProperty("refreshToken");
        userData.token = refreshResponse.body.token;
        userData.refreshToken = refreshResponse.body.refreshToken;

        //access with new token
        const newAccessResponse = await request(app).post("/post")
            .set("Authorization", "Bearer " + userData.token)
            .send(singlePostData);
        expect(newAccessResponse.statusCode).toBe(201);
        expect(newAccessResponse.body).toHaveProperty("_id");
    });

    //test double use of refresh token
    test("test double use of refresh token", async () => {
        //get new token using refresh token
        const refreshResponse1 = await request(app).post("/auth/refresh-token").send({
            refreshToken: userData.refreshToken
        });
        expect(refreshResponse1.statusCode).toBe(200);
        expect(refreshResponse1.body).toHaveProperty("token");
        expect(refreshResponse1.body).toHaveProperty("refreshToken");
        const firstNewRefreshToken = refreshResponse1.body.refreshToken;
        userData.token = refreshResponse1.body.token;

        //try to use the same refresh token again
        const refreshResponse2 = await request(app).post("/auth/refresh-token").send({
            refreshToken: userData.refreshToken
        });
        expect(refreshResponse2.statusCode).toBe(401);
        expect(refreshResponse2.body).toHaveProperty("error");

        //try to use the new refresh token to see that it is blocked
        const refreshResponse3 = await request(app).post("/auth/refresh-token").send({
            refreshToken: firstNewRefreshToken
        });
        expect(refreshResponse3.statusCode).toBe(401);
        expect(refreshResponse3.body).toHaveProperty("error");
    });

    test("test logout", async () => {
        // First login to get fresh tokens
        const loginRes = await request(app).post("/auth/login").send({
            email: userData.email,
            password: userData.password
        });
        userData.token = loginRes.body.token;
        userData.refreshToken = loginRes.body.refreshToken;

        // Test logout
        const logoutRes = await request(app)
            .post("/auth/logout")
            .set("Authorization", "Bearer " + userData.token)
            .send({ refreshToken: userData.refreshToken });

        expect(logoutRes.statusCode).toBe(200);
        expect(logoutRes.body.message).toBe("Logged out successfully");

        // Verify refresh token is invalidated
        const refreshRes = await request(app).post("/auth/refresh-token").send({
            refreshToken: userData.refreshToken
        });
        expect(refreshRes.statusCode).toBe(401);
    });

    test("test register without email", async () => {
        const response = await request(app).post("/auth/register").send({
            password: "password123"
        });
        expect(response.statusCode).toBe(401);
        expect(response.body).toHaveProperty("error");
    });

    test("test register without password", async () => {
        const response = await request(app).post("/auth/register").send({
            email: "newuser@test.com"
        });
        expect(response.statusCode).toBe(401);
        expect(response.body).toHaveProperty("error");
    });

    test("test login without email", async () => {
        const response = await request(app).post("/auth/login").send({
            password: "password123"
        });
        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty("error");
    });

    test("test login without password", async () => {
        const response = await request(app).post("/auth/login").send({
            email: userData.email
        });
        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty("error");
    });

    test("test login with non-existent user", async () => {
        const response = await request(app).post("/auth/login").send({
            email: "nonexistent@test.com",
            password: "password123"
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
            refreshToken: "invalid.token.here"
        });
        expect(response.statusCode).toBe(401);
        expect(response.body).toHaveProperty("error");
    });

    test("test logout without authentication", async () => {
        const response = await request(app).post("/auth/logout").send({
            refreshToken: "sometoken"
        });
        expect(response.statusCode).toBe(401);
        expect(response.body).toHaveProperty("error");
    });

    test("test logout all devices (no refresh token provided)", async () => {
        // Login to get tokens
        const loginRes = await request(app).post("/auth/login").send({
            email: userData.email,
            password: userData.password
        });
        const token = loginRes.body.token;

        // Logout without providing refreshToken
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
        const response = await request(app).post("/auth/google-login").send({});
        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe("Google credential is required");
    });

    test("test register with default name from email", async () => {
        const newEmail = "defaultname@test.com";
        const response = await request(app).post("/auth/register").send({
            email: newEmail,
            password: "password123"
        });
        expect(response.statusCode).toBe(201);
        expect(response.body.user.name).toBe("defaultname");

        // Cleanup
        await User.deleteMany({ email: newEmail });
    });
});