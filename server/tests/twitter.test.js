const request = require("supertest");
const app = require("../../index");
const twitterAccount = require("../models/twitter.model");
const twitterMockAccounts = require("./twitter-stub-accounts.json").accounts;
const twitterCtrl = require("../controllers/twitter.controller");
const httpStatus = require("../../config/resocie.json").httpStatus;

beforeAll(async (done) => {
	await twitterAccount.insertMany(twitterMockAccounts);
	done();
});

afterAll(async (done) => {
	await twitterAccount.deleteMany();
	done();
});

/**
 * Test case for the /twitter endpoint.
 * Tests whether it returns no error and body has an array usernames as property
 */
describe("Twitter endpoint", () => {
	let usernameTest1;
	let usernameTest2;
	let usernameTest3;

	it("GET /twitter should return a json with all the users in the db", async (done) => {
		const res = await request(app).get("/twitter").expect(httpStatus.OK);
		const importRel = "twitter.import";

		expect(res.body).toHaveProperty("error");
		expect(res.body.error).toBe(false);

		expect(res.body).toHaveProperty("import");
		expect(res.body.import).toHaveProperty("rel");
		expect(res.body.import.rel).toEqual(importRel);
		expect(res.body.import).toHaveProperty("href");
		expect(typeof res.body.import.href).toEqual("string");

		expect(res.body).toHaveProperty("accounts");
		expect(res.body.accounts).toBeInstanceOf(Array);
		expect(res.body.accounts.length).toEqual(twitterMockAccounts.length);

		usernameTest1 = res.body.accounts[0].username;
		usernameTest2 = res.body.accounts[1].username;
		usernameTest3 = res.body.accounts[2].username;
		done();
	});

	it("GET /twitter/:username should return a json with user information", async (done) => {
		expect(usernameTest1).toBeDefined();

		const res = await request(app).get(`/twitter/${usernameTest1}`).expect(httpStatus.OK);

		expect(res.body).toHaveProperty("error");
		expect(res.body.error).toBe(false);

		expect(res.body).toHaveProperty("account");
		expect(res.body.account).toBeInstanceOf(Object);
		expect(res.body.account).toHaveProperty("links");
		expect(res.body.account.links.length).toEqual(6);
		expect(res.body.account.username).toEqual("john");
		expect(res.body.account.name).toEqual("Joao");
		expect(res.body.account.type).toEqual("Presidente");
		expect(res.body.account.samples.length).toEqual(3);

		expect(res.body.account.samples[0].tweets).toEqual(123);
		expect(res.body.account.samples[0].likes).toEqual(321);
		expect(res.body.account.samples[0].followers).toEqual(555);
		expect(res.body.account.samples[0].following).toEqual(10);
		expect(res.body.account.samples[0].moments).toEqual(0);
		expect(res.body.account.samples[0].date).toEqual("2012-04-23T18:25:43.511Z");

		expect(res.body.account.samples[1].tweets).toEqual(200);
		expect(res.body.account.samples[1].likes).toEqual(400);
		expect(res.body.account.samples[1].followers).toEqual(655);
		expect(res.body.account.samples[1].following).toEqual(20);
		expect(res.body.account.samples[1].moments).toEqual(10);
		expect(res.body.account.samples[1].date).toEqual("2012-05-23T18:25:43.511Z");

		expect(res.body.account.samples[2].tweets).toEqual(323);
		expect(res.body.account.samples[2].likes).toEqual(621);
		expect(res.body.account.samples[2].followers).toEqual(855);
		expect(res.body.account.samples[2].following).toEqual(30);
		expect(res.body.account.samples[2].moments).toEqual(11);
		expect(res.body.account.samples[2].date).toEqual("2012-06-23T18:25:43.511Z");

		done();
	});

	it("GET /twitter/latest/:username should return json with latest user information", async (done) => {
		expect(usernameTest1).toBeDefined();

		const res = await request(app).get(`/twitter/latest/${usernameTest1}`).expect(httpStatus.OK);

		expect(res.body).toHaveProperty("error");
		expect(res.body.error).toBe(false);

		expect(res.body).toHaveProperty("latest");
		expect(res.body.latest).toEqual({
			tweets: 323,
			likes: 621,
			followers: 855,
			following: 30,
			moments: 11,
		});

		done();
	});

	it("GET /twitter/import shoul found this endpoint", async (done) => {
		const res = await request(app).get("/twitter/import").expect(httpStatus.FOUND);
		let msg = "https://accounts.google.com/o/oauth2/v2/auth?access_type=offline";
		msg += "&prompt=consent&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fspreadsheets.readonly";
		msg += "&response_type=code&client_id=irrelevant&redirect_uri=http%3A%2F%2F";

		expect(res).toHaveProperty("redirect");
		expect(res.redirect).toBe(true);

		expect(res).toHaveProperty("request");
		expect(res.request).toHaveProperty("host");
		const host = res.request.host.replace(/:/g, "%3A");
		msg += host;
		msg += "%2Ftwitter%2Fimport";

		expect(res).toHaveProperty("header");
		expect(res.header).toHaveProperty("location");
		expect(res.header.location).toEqual(msg);

		done();
	});

	it("GET /twitter/:username/likes should return an image (the graph)", async (done) => {
		expect(usernameTest3).toBeDefined();

		const res = await request(app).get(`/twitter/${usernameTest3}/likes`).expect(httpStatus.OK);

		expect(res.header["content-type"]).toEqual("image/png");

		done();
	});

	it("GET /twitter/:username/likes should return an image (the graph)", async (done) => {
		expect(usernameTest1).toBeDefined();

		const res = await request(app).get(`/twitter/${usernameTest1}/likes`).expect(httpStatus.OK);

		expect(res.header["content-type"]).toEqual("image/png");

		done();
	});

	it("GET /twitter/:username/tweets should return an image (the graph)", async (done) => {
		expect(usernameTest1).toBeDefined();

		const res = await request(app).get(`/twitter/${usernameTest1}/tweets`).expect(httpStatus.OK);

		expect(res.header["content-type"]).toEqual("image/png");

		done();
	});

	it("GET /twitter/:username/followers should return an image (the graph)", async (done) => {
		expect(usernameTest1).toBeDefined();

		const res = await request(app).get(`/twitter/${usernameTest1}/followers`).expect(httpStatus.OK);

		expect(res.header["content-type"]).toEqual("image/png");

		done();
	});

	it("GET /twitter/:username/following should return an image (the graph)", async (done) => {
		expect(usernameTest1).toBeDefined();

		const res = await request(app).get(`/twitter/${usernameTest1}/following`).expect(httpStatus.OK);

		expect(res.header["content-type"]).toEqual("image/png");

		done();
	});

	it("GET /twitter/:username/moments should return an image (the graph)", async (done) => {
		expect(usernameTest1).toBeDefined();

		const res = await request(app).get(`/twitter/${usernameTest1}/moments`).expect(httpStatus.OK);

		expect(res.header["content-type"]).toEqual("image/png");

		done();
	});

	it("GET /twitter/compare/likes?actors={:id} should return an image (the graph)", async (done) => {
		expect(usernameTest1).toBeDefined();
		expect(usernameTest2).toBeDefined();

		const res = await request(app).get(`/twitter/compare/likes?actors=${usernameTest1},${usernameTest2}`).expect(httpStatus.OK);

		expect(res.header["content-type"]).toEqual("image/png");

		done();
	});

	it("GET /twitter/compare/tweets?actors={:id} should return an image (the graph)", async (done) => {
		expect(usernameTest1).toBeDefined();
		expect(usernameTest2).toBeDefined();

		const res = await request(app).get(`/twitter/compare/tweets?actors=${usernameTest1},${usernameTest2}`).expect(httpStatus.OK);

		expect(res.header["content-type"]).toEqual("image/png");

		done();
	});

	it("GET /twitter/compare/followers?actors={:id} should return an image (the graph)", async (done) => {
		expect(usernameTest1).toBeDefined();
		expect(usernameTest2).toBeDefined();

		const res = await request(app).get(`/twitter/compare/followers?actors=${usernameTest1},${usernameTest2}`).expect(httpStatus.OK);

		expect(res.header["content-type"]).toEqual("image/png");

		done();
	});

	it("GET /twitter/compare/following?actors={:id} should return an image (the graph)", async (done) => {
		expect(usernameTest1).toBeDefined();
		expect(usernameTest2).toBeDefined();

		const res = await request(app).get(`/twitter/compare/following?actors=${usernameTest1},${usernameTest2}`).expect(httpStatus.OK);

		expect(res.header["content-type"]).toEqual("image/png");

		done();
	});

	it("GET /twitter/compare/moments?actors={:id} should return an image (the graph)", async (done) => {
		expect(usernameTest1).toBeDefined();
		expect(usernameTest2).toBeDefined();

		const res = await request(app).get(`/twitter/compare/moments?actors=${usernameTest1},${usernameTest2}`).expect(httpStatus.OK);

		expect(res.header["content-type"]).toEqual("image/png");

		done();
	});

	it("GET /twitter/error should return error on loadAccount", async (done) => {
		const res = await request(app).get("/twitter/error").expect(httpStatus.ERROR_LOAD_ACCOUNT);
		const msgError = "Error ao carregar usuário(s) [error] dos registros do Twitter";

		expect(res.body).toHaveProperty("error");
		expect(res.body.error).toBe(true);

		expect(res.body).toHaveProperty("description");
		expect(res.body.description).toEqual(msgError);

		done();
	});

	it("GET /twitter/compare/likes?actors=:id,error shoul return error on loadAccount", async (done) => {
		expect(usernameTest1).toBeDefined();

		const res = await request(app).get(`/twitter/compare/likes?actors=${usernameTest1},error`)
			.expect(httpStatus.ERROR_LOAD_ACCOUNT);
		const msgError = `Error ao carregar usuário(s) [${usernameTest1},error] dos registros do Twitter`;

		expect(res.body).toHaveProperty("error");
		expect(res.body.error).toBe(true);

		expect(res.body).toHaveProperty("description");
		expect(res.body.description).toEqual(msgError);
		done();
	});

	it("GET /twitter/:username/qualquer should return error on setSampleKey", async (done) => {
		expect(usernameTest1).toBeDefined();

		const res = await request(app).get(`/twitter/${usernameTest1}/qualquer`).expect(httpStatus.ERROR_QUERY_KEY);
		const msgError = "Não existe a caracteristica [qualquer] para o Twitter";

		expect(res.body).toHaveProperty("error");
		expect(res.body.error).toBe(true);

		expect(res.body).toHaveProperty("description");
		expect(res.body.description).toEqual(msgError);

		done();
	});

	it("GET /twitter/compare/likes?actors=:id;:username shoul return error on splitActors", async (done) => {
		expect(usernameTest1).toBeDefined();

		const res = await request(app).get(`/twitter/compare/likes?actors=${usernameTest1};error`)
			.expect(httpStatus.ERROR_SPLIT_ACTORS);
		const msgError = "Erro ao criar o ambiente para a comparação";

		expect(res.body).toHaveProperty("error");
		expect(res.body.error).toBe(true);

		expect(res.body).toHaveProperty("description");
		expect(res.body.description).toEqual(msgError);
		done();
	});
});

describe("Twitter methods", () => {
	const param = "qualquer coisa";

	it("Recovery of evolution message", async (done) => {
		const result = "Evolução de qualquer coisa, no Twitter";
		const delivery = twitterCtrl.evolutionMsg(param);

		expect(delivery).toEqual(result);

		done();
	});

	it("Recovery of a string capitalized", async (done) => {
		const result = "Qualquer Coisa";
		const param1 = "qualquercoisa";
		const result1 = "Qualquercoisa";
		const delivery = twitterCtrl.capitalize(param);
		const delivery1 = twitterCtrl.capitalize(param1);

		expect(delivery).toEqual(result);
		expect(delivery1).toEqual(result1);

		done();
	});

	it("Recovery of match Twitter Username", async (done) => {
		const param1 = null;
		const result1 = null;
		const param2 = "http://www.frentebrasilpopular.org.br/";
		const result2 = null;
		const param3 = "https://www.twitter.com/agoramovimento/";
		const result3 = "agoramovimento";
		const param4 = "https://www.twitter.com/pg/agoramovimento/";
		const result4 = "agoramovimento";
		const param5 = "https://twitter.com/frentebrasilpop";
		const result5 = "frentebrasilpop";

		const delivery1 = twitterCtrl.getImportUsername(param1);
		const delivery2 = twitterCtrl.getImportUsername(param2);
		const delivery3 = twitterCtrl.getImportUsername(param3);
		const delivery4 = twitterCtrl.getImportUsername(param4);
		const delivery5 = twitterCtrl.getImportUsername(param5);

		expect(delivery1).toEqual(result1);
		expect(delivery2).toEqual(result2);
		expect(delivery3).toEqual(result3);
		expect(delivery4).toEqual(result4);
		expect(delivery5).toEqual(result5);

		done();
	});

	it("Recovery of a valide cell or invalid cell", async (done) => {
		expect(twitterCtrl.isCellValid(param)).toBe(true);
		expect(twitterCtrl.isCellValid(null)).toBe(false);
		expect(twitterCtrl.isCellValid(undefined)).toBe(false);
		expect(twitterCtrl.isCellValid("-")).toBe(false);
		expect(twitterCtrl.isCellValid("s")).toBe(false);
		expect(twitterCtrl.isCellValid("s/")).toBe(false);
		expect(twitterCtrl.isCellValid("S")).toBe(false);
		expect(twitterCtrl.isCellValid("S/")).toBe(false);

		done();
	});

	it("Recovery of a valid number", async (done) => {
		const param1 = "42";
		const result1 = 42;
		const param2 = "http://www.frentebrasilpopular.org.br/";
		const result2 = null;
		const param3 = "12.365";
		const result3 = 12365;

		const delivery1 = twitterCtrl.getImportNumber(param1);
		const delivery2 = twitterCtrl.getImportNumber(param2);
		const delivery3 = twitterCtrl.getImportNumber(param3);

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

		const delivery1 = twitterCtrl.getImportDate(param1, lastDate);
		const delivery2 = twitterCtrl.getImportDate(param2, lastDate);
		const delivery3 = twitterCtrl.getImportDate(param3, lastDate);
		const delivery4 = twitterCtrl.getImportDate(param4, lastDate);

		expect(delivery1).toEqual(lastDate);
		expect(delivery2).toEqual(lastDate);
		expect(delivery3).toEqual(result3);
		expect(delivery4).toEqual(lastDate);

		done();
	});
});
