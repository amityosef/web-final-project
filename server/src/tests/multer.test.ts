import request from "supertest";
import intApp from "../index";
import { Express } from "express";

let app: Express;

beforeAll(async () => {
    app = await intApp();
});

afterAll((done) => {
    done();
});

describe("File Tests", () => {
    test("upload file", async () => {
        const filePath = `${__dirname}/avatar.png`;

        try {
            const response = await request(app)
                .post("/upload?file=123.png").attach('file', filePath)
            expect(response.statusCode).toEqual(200);
            let url = response.body.url;
            url = url.replace(/^.*\/\/[^/]+/, '')
            const res = await request(app).get(url)
            expect(res.statusCode).toEqual(200);
        } catch (err) {
            console.log(err);
            expect(1).toEqual(2);
        }
    })
})
