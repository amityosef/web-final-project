import request from "supertest";
import intApp from "../index";
import Movies from "../model/movieModel";
import { Express } from "express";
import User from "../model/userModel";
import { registerTestUser, userData, moviesData } from "./testUtils";

let app: Express;

beforeAll(async () => {
  app = await intApp();
  await Movies.deleteMany({});
  const authData = await registerTestUser(app);
  userData.token = authData.token;
  userData.refreshToken = authData.refreshToken;
  userData._id = authData._id;
});

afterAll((done) => {
  done();
});

describe("Movies API", () => {
  test("test get all empty db", async () => {
    console.log("Test is running");
    const response = await request(app).get("/movie");
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual([]);
  });

  test("test post movie", async () => {
    //add all movies from testData
    for (const movie of moviesData) {
      const response = await request(app).post("/movie")
        .set("Authorization", "Bearer " + userData.token)
        .send(movie);
      expect(response.statusCode).toBe(201);
      expect(response.body).toMatchObject(movie);
    }
  });

  test("test get movies after post", async () => {
    const response = await request(app).get("/movie");
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(moviesData.length);
  });

  test("test get movies with filter", async () => {
    const movie = moviesData[0];
    const response = await request(app).get(
      "/movie?releaseYear=" + movie.releaseYear
    );
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(1);
    expect(response.body[0].releaseYear).toBe(movie.releaseYear);
    moviesData[0]._id = response.body[0]._id;
  });

  test("test get movie by id", async () => {
    const response = await request(app).get("/movie/" + moviesData[0]._id);
    expect(response.statusCode).toBe(200);
    expect(response.body._id).toBe(moviesData[0]._id);
  });

  test("test put movie by id", async () => {
    moviesData[0].releaseYear = 2010;
    const response = await request(app)
      .put("/movie/" + moviesData[0]._id)
      .set("Authorization", "Bearer " + userData.token)
      .send(moviesData[0]);
    expect(response.statusCode).toBe(200);
    expect(response.body.title).toBe(moviesData[0].title);
    expect(response.body.releaseYear).toBe(moviesData[0].releaseYear);
  });

  test("test delete movie by id", async () => {
    const response = await request(app).delete("/movie/" + moviesData[0]._id)
      .set("Authorization", "Bearer " + userData.token);
    expect(response.statusCode).toBe(200);

    const getResponse = await request(app).get("/movie/" + moviesData[0]._id);
    expect(getResponse.statusCode).toBe(404);
  });
});
