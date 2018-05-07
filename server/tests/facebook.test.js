const request = require("supertest");
const httpStatus = require("http-status");
const mongoose = require("mongoose");
const app = require("../../index");
const facebookAccount = require("../models/facebook.model");
const facebookStub = require("./facebook.stub.json").facebook;
const facebookCtrl = require("../controllers/facebook.controller");

beforeAll(async (done) => {
	await facebookAccount.insertMany(facebookStub);
	done();
});

afterAll(async (done) => {
	await facebookAccount.deleteMany({});
	done();
});

/**
 * Test case for the /facebook, and derived pages, endpoint.
 * Tests behavior of sad path for now.
*/
describe("Facebook endpoint", () => {
	const accountIdFixed = "5aef06b6122aa025aaeef1cd";
	let accountId1;
	let accountId2;
	let accountId3;

	// When required, access should be granted
	it("GET /facebook should return a JSON with all the users in the db", async (done) => {
		const res = await request(app).get("/facebook").expect(httpStatus.OK);
		const relFixed = "facebook.import";

		expect(res.body).toHaveProperty("error");
		expect(res.body.error).toBe(false);

		expect(res.body).toHaveProperty("import");
		expect(res.body.import).toHaveProperty("rel");
		expect(res.body.import.rel).toEqual(relFixed);
		expect(res.body.import).toHaveProperty("href");
		expect(typeof res.body.import.href).toEqual("string");

		expect(res.body).toHaveProperty("accounts");
		expect(res.body.accounts).toBeInstanceOf(Array);
		expect(res.body.accounts.length).toEqual(facebookStub.length);

		accountId1 = res.body.accounts[0]._id; // eslint-disable-line
		accountId2 = res.body.accounts[1]._id; // eslint-disable-line
		accountId3 = res.body.accounts[2]._id; // eslint-disable-line

		done();
	});

	// When requires, access should be granted
	it("GET /facebook/help should return the routes' guide", async (done) => {
		const res = await request(app).get("/facebook/help").expect(httpStatus.OK);

		expect(res.body).toHaveProperty("error");
		expect(res.body.error).toBe(false);

		expect(res.body).toHaveProperty("results");
		expect(res.body.results).toBeInstanceOf(Object);

		done();
	});

	// When requires, access should be granted
	it("GET /facebook/:name should return all data from a certain user", async (done) => {
		const res = await request(app).get(`/facebook/${accountId1}`).expect(httpStatus.OK);

		expect(res.body).toHaveProperty("error");
		expect(res.body.error).toBe(false);

		expect(res.body).toHaveProperty("account");
		expect(res.body.account).toBeInstanceOf(Object);
		expect(res.body.account).toHaveProperty("links");
		expect(res.body.account.links.length).toEqual(3);
		expect(res.body.account.name).toEqual("José Maria");
		expect(res.body.account.class).toEqual("joseClass");
		expect(res.body.account.link).toEqual("joseLink/jose/");
		expect(res.body.account.history.length).toEqual(3);

		expect(res.body.account.history[0].likes).toEqual(42);
		expect(res.body.account.history[0].followers).toEqual(420);
		expect(res.body.account.history[0].date).toEqual("1994-12-24T02:00:00.000Z");

		expect(res.body.account.history[1].likes).toEqual(40);
		expect(res.body.account.history[1].followers).toEqual(840);
		expect(res.body.account.history[1].date).toEqual("1995-01-24T02:00:00.000Z");

		expect(res.body.account.history[2].likes).toEqual(45);
		expect(res.body.account.history[2].followers).toEqual(1000);
		expect(res.body.account.history[2].date).toEqual("1995-02-24T02:00:00.000Z");
		done();
	});

	it("GET /facebook/import shoul found this endpoint", async (done) => {
		await request(app).get("/facebook/import").expect(httpStatus.FOUND);

		done();
	});

	// When requires, access should be granted
	it("GET /facebook/latest/:username should return the latest data from a user", async (done) => {
		expect(accountId1).toBeDefined();

		const res = await request(app).get(`/facebook/latest/${accountId1}`).expect(httpStatus.OK);

		expect(res.body).toHaveProperty("error");
		expect(res.body.error).toBe(false);

		expect(res.body).toHaveProperty("latest");
		expect(res.body.latest).toBeInstanceOf(Object);

		expect(res.body.latest.likes).toEqual(45);
		expect(res.body.latest.followers).toEqual(1000);

		done();
	});

	// When requires, access should be granted
	it("GET /facebook/compare/likes?actors={:id} should return an image (the graph)", async (done) => {
		expect(accountId1).toBeDefined();
		expect(accountId2).toBeDefined();

		const res = await request(app).get(`/facebook/compare/likes?actors=${accountId1},${accountId2}`).expect(httpStatus.OK);

		expect(res.header["content-type"]).toEqual("image/png");

		done();
	});

	// When requires, access should be granted
	it("GET /facebook/compare/followers?actors={:id} should return an image (the graph)", async (done) => {
		expect(accountId1).toBeDefined();
		expect(accountId2).toBeDefined();

		const res = await request(app).get(`/facebook/compare/followers?actors=${accountId1},${accountId2}`).expect(httpStatus.OK);

		expect(res.header["content-type"]).toEqual("image/png");

		done();
	});

	// When requires, access should be granted
	it("GET /facebook/compare/views?actors={:id} should return an image (the graph)", async (done) => {
		expect(accountId1).toBeDefined();
		expect(accountId2).toBeDefined();

		await request(app).get(`/facebook/compare/views?actors=${accountId1},${accountId2}`).expect(httpStatus.NOT_FOUND);

		done();
	});

	// When required, access should be granted
	it("GET /facebook/:username/likes should return an image (the graph)", async (done) => {
		expect(accountId1).toBeDefined();

		const res = await request(app).get(`/facebook/${accountId1}/likes`).expect(httpStatus.OK);

		expect(res.header["content-type"]).toEqual("image/png");

		done();
	});

	it(`GET /facebook/${accountId3}/likes should return an image (the graph)`, async (done) => {
		expect(accountId3).toBeDefined();

		const res = await request(app).get(`/facebook/${accountId3}/likes`).expect(httpStatus.OK);

		expect(res.header["content-type"]).toEqual("image/png");

		done();
	});

	// When required, access should be granted
	it("GET /facebook/:username/followers should return an image (the graph)", async (done) => {
		expect(accountId1).toBeDefined();

		const res = await request(app).get(`/facebook/${accountId1}/followers`).expect(httpStatus.OK);

		expect(res.header["content-type"]).toEqual("image/png");

		done();
	});

	// When required, access should be granted
	it("GET /facebook/:username/qualquer should return an image (the graph)", async (done) => {
		expect(accountId1).toBeDefined();

		await request(app).get(`/facebook/${accountId1}/qualquer`).expect(httpStatus.NOT_FOUND);

		done();
	});

	it("GET /facebook/error should return error on loadAccount", async (done) => {
		const res = await request(app).get("/facebook/error").expect(httpStatus.INTERNAL_SERVER_ERROR);
		const msgError = "Error ao carregar usuário(s) [error] dos registros do Facebook";

		expect(res.body).toHaveProperty("error");
		expect(res.body.error).toBe(true);

		expect(res.body).toHaveProperty("description");
		expect(res.body.description).toEqual(msgError);

		done();
	});

	it(`GET /facebook/compare/likes?actors=:id,${accountIdFixed} shoul return error on loadAccount`, async (done) => {
		expect(accountId1).toBeDefined();

		const res = await request(app).get(`/facebook/compare/likes?actors=${accountId1},error`)
			.expect(httpStatus.INTERNAL_SERVER_ERROR);
		const msgError = `Error ao carregar usuário(s) [${accountId1},error] dos registros do Facebook`;

		expect(res.body).toHaveProperty("error");
		expect(res.body.error).toBe(true);

		expect(res.body).toHaveProperty("description");
		expect(res.body.description).toEqual(msgError);
		done();
	});

	it(`GET /facebook/${accountIdFixed} shoul return error on getUser`, async (done) => {
		expect(accountIdFixed).toBeDefined();

		const res = await request(app).get(`/facebook/${accountIdFixed}`).expect(httpStatus.INTERNAL_SERVER_ERROR);
		const msgError = "Erro enquanto configura-se o usuário";

		expect(res.body).toHaveProperty("error");
		expect(res.body.error).toBe(true);

		expect(res.body).toHaveProperty("description");
		expect(res.body.description).toEqual(msgError);

		done();
	});

	it(`GET /facebook/latest/${accountIdFixed} shoul return error on getLatest`, async (done) => {
		expect(accountIdFixed).toBeDefined();

		const res = await request(app).get(`/facebook/latest/${accountIdFixed}`).expect(httpStatus.INTERNAL_SERVER_ERROR);
		const msgError = "Error enquanto se recuperava os últimos dados válidos para o usuário undefined, no Facebook";

		expect(res.body).toHaveProperty("error");
		expect(res.body.error).toBe(true);

		expect(res.body).toHaveProperty("description");
		expect(res.body.description).toEqual(msgError);
		done();
	});

	it(`GET /facebook/compare/likes?actors=:id;${accountIdFixed} shoul return error on splitActors`, async (done) => {
		expect(accountId1).toBeDefined();

		const res = await request(app).get(`/facebook/compare/likes?actors=${accountId1};error`)
			.expect(httpStatus.INTERNAL_SERVER_ERROR);
		const msgError = "Erro ao criar o ambiente para a comparação";

		expect(res.body).toHaveProperty("error");
		expect(res.body.error).toBe(true);

		expect(res.body).toHaveProperty("description");
		expect(res.body.description).toEqual(msgError);
		done();
	});
});

describe("Facebook methods", () => {
	const param = "qualquer coisa";

	it("Recovery of evolution message", async (done) => {
		const result = "Evolução de qualquer coisa, no Facebook";
		const delivery = facebookCtrl.evolutionMsg(param);

		expect(delivery).toEqual(result);

		done();
	});

	it("Recovery of a string capitalized", async (done) => {
		const result = "Qualquer Coisa";
		const param1 = "qualquercoisa";
		const result1 = "Qualquercoisa";
		const delivery = facebookCtrl.capitalize(param);
		const delivery1 = facebookCtrl.capitalize(param1);

		expect(delivery).toEqual(result);
		expect(delivery1).toEqual(result1);

		done();
	});

	it("Recovery of a cell valid or invalid", async (done) => {
		expect(facebookCtrl.isCellValid(param)).toBe(true);
		expect(facebookCtrl.isCellValid(null)).toBe(false);
		expect(facebookCtrl.isCellValid(undefined)).toBe(false);
		expect(facebookCtrl.isCellValid("-")).toBe(false);
		expect(facebookCtrl.isCellValid("s")).toBe(false);
		expect(facebookCtrl.isCellValid("s/")).toBe(false);
		expect(facebookCtrl.isCellValid("S")).toBe(false);
		expect(facebookCtrl.isCellValid("S/")).toBe(false);

		done();
	});
});
