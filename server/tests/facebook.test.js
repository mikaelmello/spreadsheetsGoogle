const request = require("supertest");
const app = require("../../index");
const facebookAccount = require("../models/facebook.model");
const facebookStub = require("./facebook.stub.json").facebook;
const facebookCtrl = require("../controllers/facebook.controller");
const httpStatus = require("../../config/resocie.json").httpStatus;

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
	let accountId1;
	let accountId2;
	let accountId3;

	it("GET /facebook should return a JSON with all the users in the db", async (done) => {
		const res = await request(app).get("/facebook").expect(httpStatus.OK);
		const importRel = "facebook.import";

		expect(res.body).toHaveProperty("error");
		expect(res.body.error).toBe(false);

		expect(res.body).toHaveProperty("import");
		expect(res.body.import).toHaveProperty("rel");
		expect(res.body.import.rel).toEqual(importRel);
		expect(res.body.import).toHaveProperty("href");
		expect(typeof res.body.import.href).toEqual("string");

		expect(res.body).toHaveProperty("accounts");
		expect(res.body.accounts).toBeInstanceOf(Array);
		expect(res.body.accounts.length).toEqual(facebookStub.length);

		accountId1 = res.body.accounts[0].username;
		accountId2 = res.body.accounts[1].username;
		accountId3 = res.body.accounts[2].username;

		done();
	});

	it("GET /facebook/help should return the routes' guide", async (done) => {
		const res = await request(app).get("/facebook/help").expect(httpStatus.OK);

		expect(res.body).toHaveProperty("error");
		expect(res.body.error).toBe(false);

		expect(res.body).toHaveProperty("results");
		expect(res.body.results).toBeInstanceOf(Object);

		done();
	});

	it("GET /facebook/:name should return all data from a certain user", async (done) => {
		expect(accountId1).toBeDefined();

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
		const res = await request(app).get("/facebook/import").expect(httpStatus.FOUND);
		let msg = "https://accounts.google.com/o/oauth2/v2/auth?access_type=offline";
		msg += "&prompt=consent&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fspreadsheets.readonly";
		msg += "&response_type=code&client_id=irrelevant&redirect_uri=http%3A%2F%2F";

		expect(res).toHaveProperty("redirect");
		expect(res.redirect).toBe(true);

		expect(res).toHaveProperty("request");
		expect(res.request).toHaveProperty("host");
		const host = res.request.host.replace(/:/g, "%3A");
		msg += host;
		msg += "%2Ffacebook%2Fimport";

		expect(res).toHaveProperty("header");
		expect(res.header).toHaveProperty("location");
		expect(res.header.location).toEqual(msg);

		done();
	});

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

	it("GET /facebook/compare/likes?actors={:id} should return an image (the graph)", async (done) => {
		expect(accountId1).toBeDefined();
		expect(accountId2).toBeDefined();

		const res = await request(app).get(`/facebook/compare/likes?actors=${accountId1},${accountId2}`).expect(httpStatus.OK);

		expect(res.header["content-type"]).toEqual("image/png");

		done();
	});

	it("GET /facebook/compare/followers?actors={:id} should return an image (the graph)", async (done) => {
		expect(accountId1).toBeDefined();
		expect(accountId2).toBeDefined();

		const res = await request(app).get(`/facebook/compare/followers?actors=${accountId1},${accountId2}`).expect(httpStatus.OK);

		expect(res.header["content-type"]).toEqual("image/png");

		done();
	});

	it("GET /facebook/:username/likes should return an image (the graph)", async (done) => {
		expect(accountId1).toBeDefined();

		const res = await request(app).get(`/facebook/${accountId1}/likes`).expect(httpStatus.OK);

		expect(res.header["content-type"]).toEqual("image/png");

		done();
	});

	it("GET /facebook/:username/likes should return an image (the graph)", async (done) => {
		expect(accountId3).toBeDefined();

		const res = await request(app).get(`/facebook/${accountId3}/likes`).expect(httpStatus.OK);

		expect(res.header["content-type"]).toEqual("image/png");

		done();
	});

	it("GET /facebook/:username/followers should return an image (the graph)", async (done) => {
		expect(accountId1).toBeDefined();

		const res = await request(app).get(`/facebook/${accountId1}/followers`).expect(httpStatus.OK);

		expect(res.header["content-type"]).toEqual("image/png");

		done();
	});

	it("GET /facebook/error should return error on loadAccount", async (done) => {
		const res = await request(app).get("/facebook/error").expect(httpStatus.ERROR_LOAD_ACCOUNT);
		const msgError = "Error ao carregar usuário(s) [error] dos registros do Facebook";

		expect(res.body).toHaveProperty("error");
		expect(res.body.error).toBe(true);

		expect(res.body).toHaveProperty("description");
		expect(res.body.description).toEqual(msgError);

		done();
	});

	it("GET /facebook/compare/likes?actors=:id,error shoul return error on loadAccount", async (done) => {
		expect(accountId1).toBeDefined();

		const res = await request(app).get(`/facebook/compare/likes?actors=${accountId1},error`)
			.expect(httpStatus.ERROR_LOAD_ACCOUNT);
		const msgError = `Error ao carregar usuário(s) [${accountId1},error] dos registros do Facebook`;

		expect(res.body).toHaveProperty("error");
		expect(res.body.error).toBe(true);

		expect(res.body).toHaveProperty("description");
		expect(res.body.description).toEqual(msgError);
		done();
	});

	it("GET /facebook/:username/qualquer should return error on setHistoryKey", async (done) => {
		expect(accountId1).toBeDefined();

		const res = await request(app).get(`/facebook/${accountId1}/qualquer`).expect(httpStatus.ERROR_QUERY_KEY);
		const msgError = "Não existe a caracteristica [qualquer] para o Facebook";

		expect(res.body).toHaveProperty("error");
		expect(res.body.error).toBe(true);

		expect(res.body).toHaveProperty("description");
		expect(res.body.description).toEqual(msgError);

		done();
	});

	it("GET /facebook/compare/likes?actors=:id;:username shoul return error on splitActors", async (done) => {
		expect(accountId1).toBeDefined();

		const res = await request(app).get(`/facebook/compare/likes?actors=${accountId1};error`)
			.expect(httpStatus.ERROR_SPLIT_ACTORS);
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
		const delivery = facebookChartCtrl.evolutionMsg(param);

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

	it("Recovery of a valide cell or invalid cell", async (done) => {
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

	it("Recovery of a valid Account Link", async (done) => {
		const param1 = null;
		const result1 = null;
		const param2 = "s/";
		const result2 = null;
		const param3 = "https://www.facebook.com/agoramovimento/";
		const result3 = "https://www.facebook.com/agoramovimento/";

		const delivery1 = facebookCtrl.getImportAccountLink(param1);
		const delivery2 = facebookCtrl.getImportAccountLink(param2);
		const delivery3 = facebookCtrl.getImportAccountLink(param3);

		expect(delivery1).toEqual(result1);
		expect(delivery2).toEqual(result2);
		expect(delivery3).toEqual(result3);

		done();
	});

	it("Recovery of a Facebook Username", async (done) => {
		const param1 = null;
		const result1 = null;
		const param2 = "http://www.frentebrasilpopular.org.br/";
		const result2 = null;
		const param3 = "https://www.facebook.com/agoramovimento/";
		const result3 = "agoramovimento";
		const param4 = "https://www.facebook.com/escolasempartidooficial?ref=hl";
		const result4 = "escolasempartidooficial";
		const param5 = "https://www.facebook.com/pg/escolasempartidooficial?ref=hl";
		const result5 = "escolasempartidooficial";

		const delivery1 = facebookCtrl.getImportUsername(param1);
		const delivery2 = facebookCtrl.getImportUsername(param2);
		const delivery3 = facebookCtrl.getImportUsername(param3);
		const delivery4 = facebookCtrl.getImportUsername(param4);
		const delivery5 = facebookCtrl.getImportUsername(param5);

		expect(delivery1).toEqual(result1);
		expect(delivery2).toEqual(result2);
		expect(delivery3).toEqual(result3);
		expect(delivery4).toEqual(result4);
		expect(delivery5).toEqual(result5);

		done();
	});

	it("Recovery of a valid number", async (done) => {
		const param1 = "42";
		const result1 = 42;
		const param2 = "http://www.frentebrasilpopular.org.br/";
		const result2 = null;
		const param3 = "12.365";
		const result3 = 12365;

		const delivery1 = facebookCtrl.getImportNumber(param1);
		const delivery2 = facebookCtrl.getImportNumber(param2);
		const delivery3 = facebookCtrl.getImportNumber(param3);

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

		const delivery1 = facebookCtrl.getImportDate(param1, lastDate);
		const delivery2 = facebookCtrl.getImportDate(param2, lastDate);
		const delivery3 = facebookCtrl.getImportDate(param3, lastDate);
		const delivery4 = facebookCtrl.getImportDate(param4, lastDate);

		expect(delivery1).toEqual(lastDate);
		expect(delivery2).toEqual(lastDate);
		expect(delivery3).toEqual(result3);
		expect(delivery4).toEqual(lastDate);

		done();
	});
});
