const request = require("supertest");
const app = require("../../index");
const FacebookDB = require("../models/facebook.model");
const facebookStub = require("./facebook.stub.json").facebook;
const httpStatus = require("../../config/resocie.json").httpStatus;
const ErrorMsgs = require("../../config/resocie.json").errorMessages;

beforeAll(async (done) => {
	await FacebookDB.insertMany(facebookStub);
	done();
});

afterAll(async (done) => {
	await FacebookDB.deleteMany({});
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

	describe("Get /facebook", () => {
		it("should return a JSON", async (done) => {
			const res = await request(app).get("/facebook")
				.expect(httpStatus.OK);

			expect(res).toHaveProperty("text");

			done();
		});

		it("should return a import link", async (done) => {
			const res = await request(app).get("/facebook");
			const importRel = "facebook.import";
			const jsonReturn = JSON.parse(res.text);

			expect(jsonReturn).toHaveProperty("import");
			expect(jsonReturn.import).toHaveProperty("rel");
			expect(jsonReturn.import.rel).toEqual(importRel);
			expect(jsonReturn.import).toHaveProperty("href");
			expect(typeof jsonReturn.import.href).toEqual("string");

			done();
		});

		it("should return all the registered users", async (done) => {
			const res = await request(app).get("/facebook");
			const jsonReturn = JSON.parse(res.text);

			expect(jsonReturn).toHaveProperty("accounts");
			expect(jsonReturn.accounts).toBeInstanceOf(Array);
			expect(jsonReturn.accounts.length).toEqual(facebookStub.length);

			accountId1 = jsonReturn.accounts[0].ID;
			accountId2 = jsonReturn.accounts[1].ID;
			accountId3 = jsonReturn.accounts[2].ID;

			done();
		});

		it("should save 3 user id", async (done) => {
			expect(accountId1).toBeDefined();
			expect(accountId2).toBeDefined();
			expect(accountId3).toBeDefined();

			done();
		});
	});

	describe("Get /facebook/queries", () => {
		it("should return a JSON", async (done) => {
			const res = await request(app).get("/facebook")
				.expect(httpStatus.OK);

			expect(res).toHaveProperty("text");

			done();
		});

		it("should return the right amount of queries", async (done) => {
			const res = await request(app).get("/facebook/queries");
			const jsonReturn = JSON.parse(res.text);

			expect(jsonReturn).toHaveLength(2);

			done();
		});

		it("should return valid properties for the queries", async (done) => {
			const res = await request(app).get("/facebook/queries")
				.expect(httpStatus.OK);
			const jsonReturn = JSON.parse(res.text);

			expect(jsonReturn[0]).toHaveProperty("val");
			expect(jsonReturn[0]).toHaveProperty("name");

			expect(jsonReturn[1]).toHaveProperty("val");
			expect(jsonReturn[1]).toHaveProperty("name");

			done();
		});

		it("should have the right values for the properties", async (done) => {
			const res = await request(app).get("/facebook/queries")
				.expect(httpStatus.OK);
			const jsonReturn = JSON.parse(res.text);

			expect(jsonReturn[0].val).toBe("likes");
			expect(jsonReturn[0].name).toBe("Curtidas");

			expect(jsonReturn[1].val).toBe("followers");
			expect(jsonReturn[1].name).toBe("Seguidores");

			done();
		});
	});

	describe("Get /facebook/:id", () => {
		it("should return a JSON", async (done) => {
			const res = await request(app).get(`/facebook/${accountId1}`)
				.expect(httpStatus.OK);

			expect(res).toHaveProperty("text");

			done();
		});

		it("should return a valid user", async (done) => {
			const res = await request(app).get(`/facebook/${accountId1}`);
			const jsonReturn = JSON.parse(res.text);

			expect(jsonReturn).toHaveProperty("name");
			expect(jsonReturn).toHaveProperty("ID");
			expect(jsonReturn).toHaveProperty("category");
			expect(jsonReturn).toHaveProperty("link");
			expect(jsonReturn).toHaveProperty("history");

			done();
		});

		it("should return all correct data", async (done) => {
			const res = await request(app).get(`/facebook/${accountId1}`);
			const jsonReturn = JSON.parse(res.text);

			expect(jsonReturn.name).toEqual("José Maria");
			expect(jsonReturn.ID).toEqual("jose");
			expect(jsonReturn.category).toEqual("joseClass");
			expect(jsonReturn.link).toEqual("joseLink/jose/");

			expect(jsonReturn.history).toBeInstanceOf(Array);

			done();
		});

		it("should return the correct history", async (done) => {
			const res = await request(app).get(`/facebook/${accountId1}`);
			const jsonReturn = JSON.parse(res.text);

			expect(jsonReturn.history.length).toEqual(3);

			expect(jsonReturn.history[0].likes).toEqual(42);
			expect(jsonReturn.history[0].followers).toEqual(420);
			expect(jsonReturn.history[0].date).toEqual("1994-12-24T02:00:00.000Z");

			expect(jsonReturn.history[1].likes).toEqual(40);
			expect(jsonReturn.history[1].followers).toEqual(840);
			expect(jsonReturn.history[1].date).toEqual("1995-01-24T02:00:00.000Z");

			expect(jsonReturn.history[2].likes).toEqual(45);
			expect(jsonReturn.history[2].followers).toEqual(1000);
			expect(jsonReturn.history[2].date).toEqual("1995-02-24T02:00:00.000Z");

			done();
		});
	});

	describe("Get /facebook/import", () => {
		it("should redirect to Google authentication", async (done) => {
			const res = await request(app).get("/facebook/import")
				.expect(httpStatus.FOUND);

			expect(res).toHaveProperty("redirect");
			expect(res.redirect).toBe(true);

			done();
		});

		it("should identify the request", async (done) => {
			const res = await request(app).get("/facebook/import");

			expect(res).toHaveProperty("request");
			expect(res.request).toHaveProperty("host");

			done();
		});

		it("should generate the correct location", async (done) => {
			const res = await request(app).get("/facebook/import");
			const host = res.request.host.replace(/:/g, "%3A");

			let msg = "https://accounts.google.com/o/oauth2/v2/auth?access_type=offline";
			msg += "&prompt=consent&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fspreadsheets.readonly";
			msg += "&response_type=code&client_id=irrelevant&redirect_uri=http%3A%2F%2F";
			msg += host;
			msg += "%2Ffacebook%2Fimport";

			expect(res).toHaveProperty("header");
			expect(res.header).toHaveProperty("location");
			expect(res.header.location).toEqual(msg);

			done();
		});
	});

	describe("Get /facebook/latest/:id", () => {
		it("should return a JSON", async (done) => {
			const res = await request(app).get(`/facebook/latest/${accountId1}`)
				.expect(httpStatus.OK);

			expect(res).toHaveProperty("text");

			done();
		});

		it("should return a valid queries' set", async (done) => {
			const res = await request(app).get(`/facebook/latest/${accountId1}`);
			const jsonReturn = JSON.parse(res.text);

			expect(jsonReturn).toHaveProperty("likes");
			expect(jsonReturn).toHaveProperty("followers");

			done();
		});

		it("should return all correct data", async (done) => {
			const res = await request(app).get(`/facebook/latest/${accountId1}`);
			const jsonReturn = JSON.parse(res.text);

			expect(jsonReturn.likes).toEqual(45);
			expect(jsonReturn.followers).toEqual(1000);

			done();
		});
	});

	describe("Get /facebook/:id/:query", () => {
		it("should return a JSON", async (done) => {
			const res = await request(app).get(`/facebook/${accountId3}/likes`)
				.expect(httpStatus.OK);

			expect(res).toHaveProperty("text");

			done();
		});

		it("should return a valid chart's set", async (done) => {
			const res = await request(app).get(`/facebook/${accountId3}/likes`);
			const jsonReturn = JSON.parse(res.text);

			expect(jsonReturn).toBeInstanceOf(Object);
			expect(jsonReturn).toHaveProperty("type");
			expect(jsonReturn).toHaveProperty("data");
			expect(jsonReturn).toHaveProperty("options");

			done();
		});

		it("should return all correct data", async (done) => {
			const res = await request(app).get(`/facebook/${accountId3}/likes`);
			const jsonReturn = JSON.parse(res.text);


			expect(jsonReturn.type).toEqual("line");
			expect(jsonReturn.data).toBeInstanceOf(Object);
			expect(jsonReturn.options).toBeInstanceOf(Object);

			done();
		});
	});

	describe("Get /facebook/compare/likes?actors={:id}", () => {
		it("should return a JSON", async (done) => {
			const res = await request(app).get(`/facebook/compare/likes?actors=${accountId1},${accountId2}`)
				.expect(httpStatus.OK);

			expect(res).toHaveProperty("text");

			done();
		});

		it("should return a valid chart's set", async (done) => {
			const res = await request(app).get(`/facebook/compare/likes?actors=${accountId1},${accountId2}`);
			const jsonReturn = JSON.parse(res.text);

			expect(jsonReturn).toBeInstanceOf(Object);
			expect(jsonReturn).toHaveProperty("type");
			expect(jsonReturn).toHaveProperty("data");
			expect(jsonReturn).toHaveProperty("options");

			done();
		});

		it("should return all correct data", async (done) => {
			const res = await request(app).get(`/facebook/compare/likes?actors=${accountId1},${accountId2}`);
			const jsonReturn = JSON.parse(res.text);

			expect(jsonReturn.type).toEqual("line");
			expect(jsonReturn.data).toBeInstanceOf(Object);
			expect(jsonReturn.options).toBeInstanceOf(Object);

			done();
		});
	});

	describe("Get /facebook/error", () => {
		it("should return a JSON", async (done) => {
			const res = await request(app).get("/facebook/error")
				.expect(httpStatus.OK);

			expect(res).toHaveProperty("text");

			done();
		});

		it("should return a valid error indicator", async (done) => {
			const res = await request(app).get("/facebook/error");
			const jsonReturn = JSON.parse(res.text);

			expect(jsonReturn).toHaveProperty("errorCode");
			expect(jsonReturn).toHaveProperty("description");

			done();
		});

		it("should return error on loadAccount", async (done) => {
			const res = await request(app).get("/facebook/error");
			const jsonReturn = JSON.parse(res.text);
			const errorMsg = `${ErrorMsgs.ERROR_LOAD_ACCOUNT}error`;

			expect(jsonReturn.errorCode).toEqual(httpStatus.ERROR_LOAD_ACCOUNT);
			expect(jsonReturn.description).toEqual(errorMsg);

			done();
		});
	});

	describe("Get /facebook/:id/qualquer", () => {
		it("should return a JSON", async (done) => {
			const res = await request(app).get(`/facebook/${accountId1}/qualquer`)
				.expect(httpStatus.OK);

			expect(res).toHaveProperty("text");

			done();
		});

		it("should return a valid error indicator", async (done) => {
			const res = await request(app).get(`/facebook/${accountId1}/qualquer`);
			const jsonReturn = JSON.parse(res.text);

			expect(jsonReturn).toHaveProperty("errorCode");
			expect(jsonReturn).toHaveProperty("description");

			done();
		});

		it("should return error on setHistoryKey", async (done) => {
			const res = await request(app).get(`/facebook/${accountId1}/qualquer`);
			const jsonReturn = JSON.parse(res.text);
			const errorMsg = `${ErrorMsgs.ERROR_QUERY_KEY}qualquer`;

			expect(jsonReturn.errorCode).toEqual(httpStatus.ERROR_QUERY_KEY);
			expect(jsonReturn.description).toEqual(errorMsg);

			done();
		});
	});

	describe("Get /facebook/compare/likes?actors=:id;error", () => {
		it("should return a JSON", async (done) => {
			const res = await request(app).get(`/facebook/compare/likes?actors=${accountId1};error`)
				.expect(httpStatus.OK);

			expect(res).toHaveProperty("text");

			done();
		});

		it("should return a valid error indicator", async (done) => {
			const res = await request(app).get(`/facebook/compare/likes?actors=${accountId1};error`);
			const jsonReturn = JSON.parse(res.text);

			expect(jsonReturn).toHaveProperty("errorCode");
			expect(jsonReturn).toHaveProperty("description");

			done();
		});

		it("should return error on splitActors", async (done) => {
			const res = await request(app).get(`/facebook/compare/likes?actors=${accountId1};error`);
			const jsonReturn = JSON.parse(res.text);
			const errorMsg = ErrorMsgs.ERROR_SPLIT_ACTORS;

			expect(jsonReturn.errorCode).toEqual(httpStatus.ERROR_SPLIT_ACTORS);
			expect(jsonReturn.description).toEqual(errorMsg);

			done();
		});
	});

	describe("Get /facebook/compare/likes?actors=:id,error", () => {
		it("should return a JSON", async (done) => {
			const res = await request(app).get(`/facebook/compare/likes?actors=${accountId1},error`)
				.expect(httpStatus.OK);

			expect(res).toHaveProperty("text");

			done();
		});

		it("should return a valid error indicator", async (done) => {
			const res = await request(app).get(`/facebook/compare/likes?actors=${accountId1},error`);
			const jsonReturn = JSON.parse(res.text);

			expect(jsonReturn).toHaveProperty("errorCode");
			expect(jsonReturn).toHaveProperty("description");

			done();
		});

		it("should return error on splitActors", async (done) => {
			const res = await request(app).get(`/facebook/compare/likes?actors=${accountId1},error`);
			const jsonReturn = JSON.parse(res.text);
			const errorMsg = `${ErrorMsgs.ERROR_LOAD_ACCOUNT}${accountId1},error`;

			expect(jsonReturn.errorCode).toEqual(httpStatus.ERROR_LOAD_ACCOUNT);
			expect(jsonReturn.description).toEqual(errorMsg);

			done();
		});
	});

	/*

	it("GET /facebook/compare/likes?actors=:id,error shoul return error on
	loadAccount", async (done) => {
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
	// */
});

/*
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
// */
