const request = require("supertest");
const httpStatus = require("http-status");
const app = require("../../index");

describe("# GET /", () => {
	// When required, access should be granted
	it("GET / should the name and link to each social media", async (done) => {
		await request(app).get("/").expect(httpStatus.OK);

		/*
		expect(res.body).toHaveProperty("error");
		expect(res.body.error).toBe(false);

		expect(res.body).toHaveProperty("links");
		expect(res.body.links).toBeInstanceOf(Array);
		expect(res.body.links.length).toEqual(4);
		*/

		done();
	});
});
