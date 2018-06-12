const request = require("supertest");
const app = require("../../index");
const instagramAccountModel = require("../models/instagram.model");
const instagramStub = require("./instagram-stub.json").instagram;
const instagramCtrl = require("../controllers/instagram.controller");
const httpStatus = require("../../config/resocie.json").httpStatus;

/**
 * Tests if instagram endpoint can be reached
 */
beforeAll(async (done) => {
	await instagramAccountModel.insertMany(instagramStub);
	done();
});

afterAll(async (done) => {
	await instagramAccountModel.deleteMany({});
	done();
});

describe("GET /instagram", () => {
	let usernameTest1;
	let usernameTest2;
	let usernameTest3;

	it("GET /instagram should return a JSON with all the users in the db", async (done) => {
		const res = await request(app).get("/instagram").expect(httpStatus.OK);
		const importRel = "instagram.import";

		expect(res.body).toHaveProperty("error");
		expect(res.body.error).toBe(false);

		expect(res.body).toHaveProperty("import");
		expect(res.body.import).toHaveProperty("rel");
		expect(res.body.import.rel).toEqual(importRel);
		expect(res.body.import).toHaveProperty("href");
		expect(typeof res.body.import.href).toEqual("string");

		expect(res.body).toHaveProperty("accounts");
		expect(res.body.accounts).toBeInstanceOf(Array);
		expect(res.body.accounts.length).toEqual(instagramStub.length);

		usernameTest1 = res.body.accounts[0].username;
		usernameTest2 = res.body.accounts[1].username;
		usernameTest3 = res.body.accounts[2].username;

		done();
	});

	it("GET /instagram/:name should return all data from a certain user", async (done) => {
		expect(usernameTest1).toBeDefined();

		const res = await request(app).get(`/instagram/${usernameTest1}`).expect(httpStatus.OK);

		expect(res.body).toHaveProperty("error");
		expect(res.body.error).toBe(false);

		expect(res.body).toHaveProperty("account");
		expect(res.body.account).toBeInstanceOf(Object);
		expect(res.body.account).toHaveProperty("links");
		expect(res.body.account.links.length).toEqual(4);
		expect(res.body.account.name).toEqual("Jorge da Silva");
		expect(res.body.account.username).toEqual("foo");
		expect(res.body.account.history.length).toEqual(3);

		expect(res.body.account.history[0].date).toEqual("2018-04-01T12:30:00.500Z");
		expect(res.body.account.history[0].followers).toEqual(10);
		expect(res.body.account.history[0].following).toEqual(1);
		expect(res.body.account.history[0].num_of_posts).toEqual(10);

		expect(res.body.account.history[1].date).toEqual("2018-04-05T12:30:00.505Z");
		expect(res.body.account.history[1].followers).toEqual(15);
		expect(res.body.account.history[1].following).toEqual(6);
		expect(res.body.account.history[1].num_of_posts).toEqual(15);

		expect(res.body.account.history[2].date).toEqual("2018-04-05T12:30:00.510Z");
		expect(res.body.account.history[2].followers).toEqual(12);
		expect(res.body.account.history[2].following).toEqual(8);
		expect(res.body.account.history[2].num_of_posts).toEqual(17);

		done();
	});

	it("GET /instagram/import shoul found this endpoint", async (done) => {
		const res = await request(app).get("/instagram/import").expect(httpStatus.FOUND);
		let msg = "https://accounts.google.com/o/oauth2/v2/auth?access_type=offline";
		msg += "&prompt=consent&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fspreadsheets.readonly";
		msg += "&response_type=code&client_id=irrelevant&redirect_uri=http%3A%2F%2F";

		expect(res).toHaveProperty("redirect");
		expect(res.redirect).toBe(true);

		expect(res).toHaveProperty("request");
		expect(res.request).toHaveProperty("host");
		const host = res.request.host.replace(/:/g, "%3A");
		msg += host;
		msg += "%2Finstagram%2Fimport";

		expect(res).toHaveProperty("header");
		expect(res.header).toHaveProperty("location");
		expect(res.header.location).toEqual(msg);

		done();
	});

	it("GET /instagram/latest/:username should return the latest data from a user", async (done) => {
		expect(usernameTest1).toBeDefined();

		const res = await request(app).get(`/instagram/latest/${usernameTest1}`).expect(httpStatus.OK);

		expect(res.body).toHaveProperty("error");
		expect(res.body.error).toBe(false);

		expect(res.body).toHaveProperty("latest");
		expect(res.body.latest).toBeInstanceOf(Object);
		expect(res.body.latest.followers).toEqual(12);
		expect(res.body.latest.following).toEqual(8);
		expect(res.body.latest.num_of_posts).toEqual(17);

		done();
	});

	it("GET /instagram/:username/followers should return an image (the graph)", async (done) => {
		expect(usernameTest1).toBeDefined();

		const res = await request(app).get(`/instagram/${usernameTest1}/followers`).expect(httpStatus.OK);

		expect(res.header["content-type"]).toEqual("image/png");

		done();
	});

	it("GET /instagram/:username/followers should return an image (the graph)", async (done) => {
		expect(usernameTest3).toBeDefined();

		const res = await request(app).get(`/instagram/${usernameTest3}/followers`).expect(httpStatus.OK);

		expect(res.header["content-type"]).toEqual("image/png");

		done();
	});

	it("GET /instagram/:username/following should return an image (the graph)", async (done) => {
		expect(usernameTest1).toBeDefined();

		const res = await request(app).get(`/instagram/${usernameTest1}/following`).expect(httpStatus.OK);

		expect(res.header["content-type"]).toEqual("image/png");

		done();
	});

	it("GET /instagram/:username/num_of_posts should return an image (the graph)", async (done) => {
		expect(usernameTest1).toBeDefined();

		const res = await request(app).get(`/instagram/${usernameTest1}/num_of_posts`).expect(httpStatus.OK);

		expect(res.header["content-type"]).toEqual("image/png");

		done();
	});

	it("GET /instagram/compare/followers?actors={:usermane} should return an image (the graph)", async (done) => {
		expect(usernameTest1).toBeDefined();
		expect(usernameTest2).toBeDefined();

		const res = await request(app).get(`/instagram/compare/followers?actors=${usernameTest1},${usernameTest2}`).expect(httpStatus.OK);

		expect(res.header["content-type"]).toEqual("image/png");

		done();
	});

	it("GET /instagram/compare/following?actors={:usermane} should return an image (the graph)", async (done) => {
		expect(usernameTest1).toBeDefined();
		expect(usernameTest2).toBeDefined();

		const res = await request(app).get(`/instagram/compare/following?actors=${usernameTest1},${usernameTest2}`).expect(httpStatus.OK);

		expect(res.header["content-type"]).toEqual("image/png");

		done();
	});

	it("GET /instagram/compare/num_of_posts?actors={:usermane} should return an image (the graph)", async (done) => {
		expect(usernameTest1).toBeDefined();
		expect(usernameTest2).toBeDefined();

		const res = await request(app).get(`/instagram/compare/num_of_posts?actors=${usernameTest1},${usernameTest2}`).expect(httpStatus.OK);

		expect(res.header["content-type"]).toEqual("image/png");

		done();
	});

	it("GET /instagram/error should return error on loadAccount", async (done) => {
		const res = await request(app).get("/instagram/error").expect(httpStatus.ERROR_LOAD_ACCOUNT);
		const msgError = "Error ao carregar usuário(s) [error] dos registros do Instagram";

		expect(res.body).toHaveProperty("error");
		expect(res.body.error).toBe(true);

		expect(res.body).toHaveProperty("description");
		expect(res.body.description).toEqual(msgError);

		done();
	});

	it("GET /instagram/compare/followers?actors=:id,error shoul return error on loadAccount", async (done) => {
		expect(usernameTest1).toBeDefined();

		const res = await request(app).get(`/instagram/compare/followers?actors=${usernameTest1},error`)
			.expect(httpStatus.ERROR_LOAD_ACCOUNT);
		const msgError = `Error ao carregar usuário(s) [${usernameTest1},error] dos registros do Instagram`;

		expect(res.body).toHaveProperty("error");
		expect(res.body.error).toBe(true);

		expect(res.body).toHaveProperty("description");
		expect(res.body.description).toEqual(msgError);
		done();
	});

	it("GET /instagram/:username/qualquer should return error on setHistoryKey", async (done) => {
		expect(usernameTest1).toBeDefined();

		const res = await request(app).get(`/instagram/${usernameTest1}/qualquer`).expect(httpStatus.ERROR_QUERY_KEY);
		const msgError = "Não existe a caracteristica [qualquer] para o Instagram";

		expect(res.body).toHaveProperty("error");
		expect(res.body.error).toBe(true);

		expect(res.body).toHaveProperty("description");
		expect(res.body.description).toEqual(msgError);

		done();
	});

	it("GET /instagram/compare/likes?actors={:usermane} should return error on setHistoryKey", async (done) => {
		expect(usernameTest1).toBeDefined();
		expect(usernameTest2).toBeDefined();

		const res = await request(app).get(`/instagram/compare/likes?actors=${usernameTest1},${usernameTest2}`).expect(httpStatus.ERROR_QUERY_KEY);
		const msgError = "Não existe a caracteristica [likes] para o Instagram";

		expect(res.body).toHaveProperty("error");
		expect(res.body.error).toBe(true);

		expect(res.body).toHaveProperty("description");
		expect(res.body.description).toEqual(msgError);

		done();
	});

	it("GET /instagram/compare/followers?actors=:id;:username shoul return error on splitActors", async (done) => {
		expect(usernameTest1).toBeDefined();

		const res = await request(app).get(`/instagram/compare/followers?actors=${usernameTest1};error`)
			.expect(httpStatus.ERROR_SPLIT_ACTORS);
		const msgError = "Erro ao criar o ambiente para a comparação";

		expect(res.body).toHaveProperty("error");
		expect(res.body.error).toBe(true);

		expect(res.body).toHaveProperty("description");
		expect(res.body.description).toEqual(msgError);
		done();
	});
});

describe("Instagram methods", () => {
	const param = "qualquer coisa";

	it("Recovery of evolution message", async (done) => {
		const result = "Evolução de qualquer coisa, no Instagram";
		const delivery = instagramCtrl.evolutionMsg(param);

		expect(delivery).toEqual(result);

		done();
	});

	it("Recovery of a string capitalized", async (done) => {
		const result = "Qualquer Coisa";
		const param1 = "qualquercoisa";
		const result1 = "Qualquercoisa";
		const delivery = instagramCtrl.capitalize(param);
		const delivery1 = instagramCtrl.capitalize(param1);

		expect(delivery).toEqual(result);
		expect(delivery1).toEqual(result1);

		done();
	});

	it("Recovery of match Instagram Username", async (done) => {
		const param1 = null;
		const result1 = null;
		const param2 = "http://www.frentebrasilpopular.org.br/";
		const result2 = null;
		const param3 = "https://www.instagram.com/agoramovimento/";
		const result3 = "agoramovimento";
		const param4 = "https://www.instagram.com/pg/agoramovimento/";
		const result4 = "agoramovimento";

		const delivery1 = instagramCtrl.getImportUsername(param1);
		const delivery2 = instagramCtrl.getImportUsername(param2);
		const delivery3 = instagramCtrl.getImportUsername(param3);
		const delivery4 = instagramCtrl.getImportUsername(param4);

		expect(delivery1).toEqual(result1);
		expect(delivery2).toEqual(result2);
		expect(delivery3).toEqual(result3);
		expect(delivery4).toEqual(result4);

		done();
	});

	it("Recovery of a valide cell or invalid cell", async (done) => {
		expect(instagramCtrl.isCellValid(param)).toBe(true);
		expect(instagramCtrl.isCellValid(null)).toBe(false);
		expect(instagramCtrl.isCellValid(undefined)).toBe(false);
		expect(instagramCtrl.isCellValid("-")).toBe(false);
		expect(instagramCtrl.isCellValid("s")).toBe(false);
		expect(instagramCtrl.isCellValid("s/")).toBe(false);
		expect(instagramCtrl.isCellValid("S")).toBe(false);
		expect(instagramCtrl.isCellValid("S/")).toBe(false);

		done();
	});

	it("Recovery of a valid number", async (done) => {
		const param1 = "42";
		const result1 = 42;
		const param2 = "http://www.frentebrasilpopular.org.br/";
		const result2 = null;
		const param3 = "12.365";
		const result3 = 12365;

		const delivery1 = instagramCtrl.getImportNumber(param1);
		const delivery2 = instagramCtrl.getImportNumber(param2);
		const delivery3 = instagramCtrl.getImportNumber(param3);

		expect(delivery1).toEqual(result1);
		expect(delivery2).toEqual(result2);
		expect(delivery3).toEqual(result3);

		done();
	});

	it("Recovey of a valid date", async (done) => {
		const lastDate = ["24", "12", "1942"];
		const param1 = "42";
		const param2 = "12/1942";
		const param3 = "24/12/1999";
		const result3 = ["24", "12", "1999"];
		const param4 = null;

		const delivery1 = instagramCtrl.getImportDate(param1, lastDate);
		const delivery2 = instagramCtrl.getImportDate(param2, lastDate);
		const delivery3 = instagramCtrl.getImportDate(param3, lastDate);
		const delivery4 = instagramCtrl.getImportDate(param4, lastDate);

		expect(delivery1).toEqual(lastDate);
		expect(delivery2).toEqual(lastDate);
		expect(delivery3).toEqual(result3);
		expect(delivery4).toEqual(lastDate);

		done();
	});
});
