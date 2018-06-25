const request = require("supertest");
const app = require("../../index");
const YoutubeDB = require("../models/youtube.model");
const youtubeStub = require("./youtube.stub.json").accounts;
const httpStatus = require("../../config/resocie.json").httpStatus;

beforeAll(async (done) => {
	await YoutubeDB.insertMany(youtubeStub);
	done();
});

afterAll(async (done) => {
	await YoutubeDB.deleteMany();
	done();
});

/**
 * Test case for the /youtube, and derived pages, endpoint.
 * Tests behavior of sad path for now.
*/
describe("Youtube endpoint", () => {
	let accountId1;
	let accountId2;
	let accountId3;

	describe("Get /youtube", () => {
		it("should return a JSON", async (done) => {
			const res = await request(app).get("/youtube")
				.expect(httpStatus.OK);

			expect(res).toHaveProperty("text");

			done();
		});

		it("should return a import link", async (done) => {
			const res = await request(app).get("/youtube");
			const importRel = "youtube.import";
			const jsonReturn = JSON.parse(res.text);

			expect(jsonReturn).toHaveProperty("import");
			expect(jsonReturn.import).toHaveProperty("rel");
			expect(jsonReturn.import.rel).toEqual(importRel);
			expect(jsonReturn.import).toHaveProperty("href");
			expect(typeof jsonReturn.import.href).toEqual("string");

			done();
		});

		it("should return all the registered users", async (done) => {
			const res = await request(app).get("/youtube");
			const jsonReturn = JSON.parse(res.text);

			expect(jsonReturn).toHaveProperty("accounts");
			expect(jsonReturn.accounts).toBeInstanceOf(Array);
			expect(jsonReturn.accounts.length).toEqual(youtubeStub.length);

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

	describe("Get /youtube/:id", () => {
		it("should return a JSON", async (done) => {
			const res = await request(app).get(`/youtube/${accountId1}`)
				.expect(httpStatus.OK);

			expect(res).toHaveProperty("text");

			done();
		});

		it("should return a valid user", async (done) => {
			const res = await request(app).get(`/youtube/${accountId1}`);
			const jsonReturn = JSON.parse(res.text);

			expect(jsonReturn).toHaveProperty("name");
			expect(jsonReturn).toHaveProperty("ID");
			expect(jsonReturn).toHaveProperty("category");
			expect(jsonReturn).toHaveProperty("link");
			expect(jsonReturn).toHaveProperty("history");

			done();
		});

		it("should return all correct data", async (done) => {
			const res = await request(app).get(`/youtube/${accountId1}`);
			const jsonReturn = JSON.parse(res.text);

			expect(jsonReturn.name).toEqual("Mariana");
			expect(jsonReturn.ID).toEqual("marianachannel");
			expect(jsonReturn.category).toEqual("marianacategory");
			expect(jsonReturn.link).toEqual("youtube.com/user/marianachannel");

			expect(jsonReturn.history).toBeInstanceOf(Array);

			done();
		});

		it("should return the correct history", async (done) => {
			const res = await request(app).get(`/youtube/${accountId1}`);
			const jsonReturn = JSON.parse(res.text);

			expect(jsonReturn.history.length).toEqual(3);

			expect(jsonReturn.history[0].subscribers).toEqual(542);
			expect(jsonReturn.history[0].videos).toEqual(420);
			expect(jsonReturn.history[0].views).toEqual(24);

			done();
		});
	});

	describe("Get /youtube/import", () => {
		it("should redirect to Google authentication", async (done) => {
			const res = await request(app).get("/youtube/import")
				.expect(httpStatus.FOUND);

			expect(res).toHaveProperty("redirect");
			expect(res.redirect).toBe(true);

			done();
		});

		it("should identify the request", async (done) => {
			const res = await request(app).get("/youtube/import");

			expect(res).toHaveProperty("request");
			expect(res.request).toHaveProperty("host");

			done();
		});

		it("should generate the correct location", async (done) => {
			const res = await request(app).get("/youtube/import");
			const host = res.request.host.replace(/:/g, "%3A");

			let msg = "https://accounts.google.com/o/oauth2/v2/auth?access_type=offline";
			msg += "&prompt=consent&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fspreadsheets.readonly";
			msg += "&response_type=code&client_id=irrelevant&redirect_uri=http%3A%2F%2F";
			msg += host;
			msg += "%2Fyoutube%2Fimport";

			expect(res).toHaveProperty("header");
			expect(res.header).toHaveProperty("location");
			expect(res.header.location).toEqual(msg);

			done();
		});
	});

	describe("Get /youtube/latest/:id", () => {
		it("should return a JSON", async (done) => {
			const res = await request(app).get(`/youtube/latest/${accountId1}`)
				.expect(httpStatus.OK);

			expect(res).toHaveProperty("text");

			done();
		});

		it("should return a valid queries' set", async (done) => {
			const res = await request(app).get(`/youtube/latest/${accountId1}`);
			const jsonReturn = JSON.parse(res.text);

			expect(jsonReturn).toHaveProperty("subscribers");
			expect(jsonReturn).toHaveProperty("videos");
			expect(jsonReturn).toHaveProperty("views");

			done();
		});

		it("should return all correct data", async (done) => {
			const res = await request(app).get(`/youtube/latest/${accountId1}`);
			const jsonReturn = JSON.parse(res.text);

			expect(jsonReturn).toEqual({
				subscribers: 532,
				videos: 1000,
				views: 420,
			});

			done();
		});
	});
});

/**
 * Test case for the /youtube endpoint.
 *
describe("Youtube endpoint", () => {
	let accountId1;
	let accountId2;
	let accountId3;

	it("GET /youtube should return a JSON with all the users in the db", async (done) => {
		const res = await request(app).get("/youtube").expect(httpStatus.OK);
		const importRel = "youtube.import";

		expect(res.body).toHaveProperty("error");
		expect(res.body.error).toBe(false);

		expect(res.body).toHaveProperty("import");
		expect(res.body.import).toHaveProperty("rel");
		expect(res.body.import.rel).toEqual(importRel);
		expect(res.body.import).toHaveProperty("href");
		expect(typeof res.body.import.href).toEqual("string");

		expect(res.body).toHaveProperty("accounts");
		expect(res.body.accounts).toBeInstanceOf(Array);
		expect(res.body.accounts.length).toEqual(youtubeStub.length);

		accountId1 = res.body.accounts[0].channel;
		accountId2 = res.body.accounts[1].channel;
		accountId3 = res.body.accounts[2].channel;

		done();
	});

	it("GET /youtube/:name should return all data from a certain user", async (done) => {
		expect(accountId1).toBeDefined();

		const res = await request(app).get(`/youtube/${accountId1}`).expect(httpStatus.OK);

		expect(res.body).toHaveProperty("error");
		expect(res.body.error).toBe(false);

		expect(res.body).toHaveProperty("account");
		expect(res.body.account).toBeInstanceOf(Object);
		expect(res.body.account).toHaveProperty("links");
		expect(res.body.account.links.length).toEqual(4);
		expect(res.body.account.name).toEqual("Mariana");
		expect(res.body.account.category).toEqual("marianacategory");
		expect(res.body.account.channelUrl).toEqual("youtube.com/user/marianachannel");
		expect(res.body.account.history.length).toEqual(3);

		expect(res.body.account.history[0].subscribers).toEqual(542);
		expect(res.body.account.history[0].videos).toEqual(420);
		expect(res.body.account.history[0].views).toEqual(24);
		expect(res.body.account.history[0].date).toEqual("1994-12-24T02:00:00.000Z");

		expect(res.body.account.history[1].subscribers).toEqual(500);
		expect(res.body.account.history[1].videos).toEqual(840);
		expect(res.body.account.history[1].views).toEqual(84);
		expect(res.body.account.history[1].date).toEqual("1995-01-24T02:00:00.000Z");

		expect(res.body.account.history[2].subscribers).toEqual(532);
		expect(res.body.account.history[2].videos).toEqual(1000);
		expect(res.body.account.history[2].views).toEqual(420);
		expect(res.body.account.history[2].date).toEqual("1995-02-24T02:00:00.000Z");

		done();
	});

	it("GET /youtube/import shoul import all data from the spreadsheets to localBD", async (done) => {
		const res = await request(app).get("/youtube/import").expect(httpStatus.FOUND);
		let msg = "https://accounts.google.com/o/oauth2/v2/auth?access_type=offline";
		msg += "&prompt=consent&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fspreadsheets.readonly";
		msg += "&response_type=code&client_id=irrelevant&redirect_uri=http%3A%2F%2F";

		expect(res).toHaveProperty("redirect");
		expect(res.redirect).toBe(true);

		expect(res).toHaveProperty("request");
		expect(res.request).toHaveProperty("host");
		const host = res.request.host.replace(/:/g, "%3A");
		msg += host;
		msg += "%2Fyoutube%2Fimport";

		expect(res).toHaveProperty("header");
		expect(res.header).toHaveProperty("location");
		expect(res.header.location).toEqual(msg);

		done();
	});

	it("GET /youtube/latest/:username should return the latest data from a user", async (done) => {
		expect(accountId1).toBeDefined();

		const res = await request(app).get(`/youtube/latest/${accountId1}`).expect(httpStatus.OK);

		expect(res.body).toHaveProperty("error");
		expect(res.body.error).toBe(false);

		expect(res.body).toHaveProperty("latest");
		expect(res.body.latest).toBeInstanceOf(Object);

		expect(res.body.latest.subscribers).toEqual(532);
		expect(res.body.latest.videos).toEqual(1000);
		expect(res.body.latest.views).toEqual(420);

		done();
	});

	it("GET /youtube/:name/subscribers should return an image (the graph)", async (done) => {
		expect(accountId3).toBeDefined();

		const res = await request(app).get(`/youtube/${accountId3}/subscribers`).expect(httpStatus.OK);

		expect(res.header["content-type"]).toEqual("image/png");

		done();
	});

	it("GET /youtube/:name/subscribers should return an image (the graph)", async (done) => {
		expect(accountId1).toBeDefined();

		const res = await request(app).get(`/youtube/${accountId1}/subscribers`).expect(httpStatus.OK);

		expect(res.header["content-type"]).toEqual("image/png");

		done();
	});

	it("GET /youtube/:name/videos should return an image (the graph)", async (done) => {
		expect(accountId1).toBeDefined();

		const res = await request(app).get(`/youtube/${accountId1}/videos`).expect(httpStatus.OK);

		expect(res.header["content-type"]).toEqual("image/png");

		done();
	});

	it("GET /youtube/:name/views should return an image (the graph)", async (done) => {
		expect(accountId1).toBeDefined();

		const res = await request(app).get(`/youtube/${accountId1}/views`).expect(httpStatus.OK);

		expect(res.header["content-type"]).toEqual("image/png");

		done();
	});

	it("GET /youtube/compare/subscribers?actors={:id} should return an image
	 (the graph)", async (done) => {
		expect(accountId1).toBeDefined();
		expect(accountId2).toBeDefined();

		await request(app).get(`/youtube/compare/subscribers?actors=${accountId1},
		${accountId2}`).expect(httpStatus.OK);

		done();
	});

	it("GET /youtube/compare/videos?actors={:id} should return an image
	 (the graph)", async (done) => {
		expect(accountId1).toBeDefined();
		expect(accountId2).toBeDefined();

		await request(app).get(`/youtube/compare/videos?actors=${accountId1},
		${accountId2}`).expect(httpStatus.OK);

		done();
	});

	it("GET /youtube/compare/views?actors={:id} should return an image (the graph)", async (done) => {
		expect(accountId1).toBeDefined();
		expect(accountId2).toBeDefined();

		await request(app).get(`/youtube/compare/views?actors=${accountId1},
		${accountId2}`).expect(httpStatus.OK);

		done();
	});

	it("GET /youtube/error should return error on loadAccount", async (done) => {
		const res = await request(app).get("/youtube/error").expect(httpStatus.ERROR_LOAD_ACCOUNT);
		const msgError = "Error ao carregar usuário(s) [error] dos registros do Youtube";

		expect(res.body).toHaveProperty("error");
		expect(res.body.error).toBe(true);

		expect(res.body).toHaveProperty("description");
		expect(res.body.description).toEqual(msgError);

		done();
	});

	it("GET /youtube/compare/subscribers?actors=:id,error shoul return error
	on loadAccount", async (done) => {
		expect(accountId1).toBeDefined();

		const res = await request(app).get(`/youtube/compare/subscribers?actors=${accountId1},error`)
			.expect(httpStatus.ERROR_LOAD_ACCOUNT);
		const msgError = `Error ao carregar usuário(s) [${accountId1},error] dos registros do Youtube`;

		expect(res.body).toHaveProperty("error");
		expect(res.body.error).toBe(true);

		expect(res.body).toHaveProperty("description");
		expect(res.body.description).toEqual(msgError);
		done();
	});

	it("GET /youtube/:username/qualquer should return error on setHistoryKey", async (done) => {
		expect(accountId1).toBeDefined();

		const res = await request(app).get(`/youtube/${accountId1}/qualquer`)
		.expect(httpStatus.ERROR_QUERY_KEY);
		const msgError = "Não existe a caracteristica [qualquer] para o Youtube";

		expect(res.body).toHaveProperty("error");
		expect(res.body.error).toBe(true);

		expect(res.body).toHaveProperty("description");
		expect(res.body.description).toEqual(msgError);

		done();
	});

	it("GET /youtube/compare/subscribers?actors=:id;:username shoul return
	 error on splitActors", async (done) => {
		expect(accountId1).toBeDefined();

		const res = await request(app).get(`/youtube/compare/subscribers?actors=${accountId1};error`)
			.expect(httpStatus.ERROR_SPLIT_ACTORS);
		const msgError = "Erro ao criar o ambiente para a comparação";

		expect(res.body).toHaveProperty("error");
		expect(res.body.error).toBe(true);

		expect(res.body).toHaveProperty("description");
		expect(res.body.description).toEqual(msgError);
		done();
	});
});

describe("Youtbe methods", () => {
	const param = "qualquer coisa";

	it("Recovery of evolution message", async (done) => {
		const result = "Evolução de qualquer coisa, no Youtube";
		const delivery = youtubeCtrl.evolutionMsg(param);

		expect(delivery).toEqual(result);

		done();
	});

	it("Recovery of a string capitalized", async (done) => {
		const result = "Qualquer Coisa";
		const param1 = "qualquercoisa";
		const result1 = "Qualquercoisa";
		const delivery = youtubeCtrl.capitalize(param);
		const delivery1 = youtubeCtrl.capitalize(param1);

		expect(delivery).toEqual(result);
		expect(delivery1).toEqual(result1);

		done();
	});

	it("Recovery of a cell valid or invalid", async (done) => {
		expect(youtubeCtrl.isCellValid(param)).toBe(true);
		expect(youtubeCtrl.isCellValid(null)).toBe(false);
		expect(youtubeCtrl.isCellValid(undefined)).toBe(false);
		expect(youtubeCtrl.isCellValid("-")).toBe(false);
		expect(youtubeCtrl.isCellValid("s")).toBe(false);
		expect(youtubeCtrl.isCellValid("s/")).toBe(false);
		expect(youtubeCtrl.isCellValid("S")).toBe(false);
		expect(youtubeCtrl.isCellValid("S/")).toBe(false);

		done();
	});

	it("Recovery of a valid channel URL", async (done) => {
		const param1 = null;
		const result1 = null;
		const param2 = "s/";
		const result2 = null;
		const param3 = "https://www.youtube.com/channel/UC3OzrZMhnmEgVtxpJoDRkeg/about";
		const result3 = "https://www.youtube.com/channel/UC3OzrZMhnmEgVtxpJoDRkeg/about";

		const delivery1 = youtubeCtrl.getImportChannelURL(param1);
		const delivery2 = youtubeCtrl.getImportChannelURL(param2);
		const delivery3 = youtubeCtrl.getImportChannelURL(param3);

		expect(delivery1).toEqual(result1);
		expect(delivery2).toEqual(result2);
		expect(delivery3).toEqual(result3);

		done();
	});

	it("Recovery of a Youtube Username", async (done) => {
		const param1 = null;
		const result1 = null;
		const param2 = "http://www.frentebrasilpopular.org.br/";
		const result2 = null;
		const param3 = "https://www.youtube.com/channel/UCX2Aanu4fGewmhP4rf5GQ3Q/about";
		const result3 = "UCX2Aanu4fGewmhP4rf5GQ3Q";
		const param4 = "https://www.youtube.com/cutbrasil";
		const result4 = "cutbrasil";
		const param5 = "https://www.youtube.com/user/jornaljuntos";
		const result5 = "jornaljuntos";

		const delivery1 = youtubeCtrl.getImportUsername(param1);
		const delivery2 = youtubeCtrl.getImportUsername(param2);
		const delivery3 = youtubeCtrl.getImportUsername(param3);
		const delivery4 = youtubeCtrl.getImportUsername(param4);
		const delivery5 = youtubeCtrl.getImportUsername(param5);

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

		const delivery1 = youtubeCtrl.getImportNumber(param1);
		const delivery2 = youtubeCtrl.getImportNumber(param2);
		const delivery3 = youtubeCtrl.getImportNumber(param3);

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

		const delivery1 = youtubeCtrl.getImportDate(param1, lastDate);
		const delivery2 = youtubeCtrl.getImportDate(param2, lastDate);
		const delivery3 = youtubeCtrl.getImportDate(param3, lastDate);
		const delivery4 = youtubeCtrl.getImportDate(param4, lastDate);

		expect(delivery1).toEqual(lastDate);
		expect(delivery2).toEqual(lastDate);
		expect(delivery3).toEqual(result3);
		expect(delivery4).toEqual(lastDate);

		done();
	});
});
// */
