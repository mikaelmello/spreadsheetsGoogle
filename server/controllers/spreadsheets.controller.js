const { google } = require("googleapis");
const ChartjsNode = require("chartjs-node");
const httpStatus = require("http-status");
const logger = require("../../config/logger");
const { client, authorizeUrl } = require("../../config/google-auth");
const resocieSheet = require("../../config/resocie.json").spreadsheets;

//const spreadsheetsChart = require("../../../frontend/controllers/spreadsheetsChart.controller");

const fileName = "frentePopularInstagram.png";
const pathOfFile = `${__dirname}/${fileName}`;

/**
 * Middleware function that contacts the Google API and generates a token and pass it
 * onto the req.client object to the next middleware.
 * @param {object} req - standard req object from the Express library
 * @param {object} res - standard res object from the Express library
 * @param {object} next - standard next object from the Express libary
 */
const authenticate = (req, res, next) => {
	// Gets the current URL so that Google's API redirects to the correct path
	const fullUrl = `${req.protocol}://${req.get("host")}${(req.baseUrl + req.path).replace(/\/$/, "")}`;

	const cClient = client(fullUrl); // Creates a Google Auth client with the correct redirect url
	if (req.query.code === undefined) {
		return res.redirect(authorizeUrl(cClient));
	}
	const code = req.query.code;

	return cClient.getToken(code, async (err, tokens) => {
		if (err) {
			const errorMsg = `Error getting oAuth tokens: ${err}`;
			logger.error(errorMsg);
			return res.status(httpStatus.UNAUTHORIZED).json({
				error: true,
				description: errorMsg,
			});
		}

		cClient.credentials = tokens;
		req.client = cClient;
		return next();
	});
};

/**
 * Assignment of the control variables of the acquisition of the desired spreadsheets
 * @param {object} req - standard request object from the Express library
 * @param {object} res - standard response object from the Express library
 * @param {object} next - standard next function
 */
const setResocieSheet = async (req, res, next) => {
	const pagesName = [];

	const length = resocieSheet.periods.length;
	for (let ind = 0; ind < length; ind += 1) {
		pagesName.push(`${resocieSheet.name} ${resocieSheet.periods[ind]}`);
	}

	resocieSheet.pages = pagesName;
	req.sheet = resocieSheet;

	next();
};

/**
 *  Gets all data from a certain hard-coded spreadsheet from the Google API
 *  and pass it as an array in req.collectives
 *  @param {object} req - standard req object from the Express library
 *  @param {object} res - standard res object from the Express library
 *  @param {object} next - standard next object from the Express libary
 */
const listCollectives = async (req, res, next) => {
	const auth = req.client;

	// Hard-coded strings of the spreadsheet's properties
	const id = req.sheet.id;
	const pages = req.sheet.pages;

	// Gets the collectives from all tabs and sets them all into req.collectives
	const length = pages.length;
	const allTabs = [];

	for (let ind = 0; ind < length; ind += 1) {
		allTabs.push(getCollective(auth, id, pages[ind]));
	}

	req.collectives = [];
	req.collectives = await Promise.all(allTabs);
	return next();
};

/**
 * Retrieves a spreadsheet from the Google API and return its data as an object
 * @param {object} auth - auth object to authenticate the request
 * @param {String} spreadsheetId - id of the spreadsheet
 * @param {String} range - range of data to be collected
 * @returns {Promise} collectivesPromise - promise that resolves with the object
 * containing the spreadsheet's data
 */
const getCollective = (auth, spreadsheetId, range) => {
	const collectivesPromise = new Promise((resolve, reject) => {
		const sheets = google.sheets("v4");

		// Gets the spreadsheet with the spreadsheetId id and in the range range
		sheets.spreadsheets.values.get({
			auth,
			spreadsheetId,
			range,
		}, (err, res) => {
			if (err) {
				logger.error(`The API returned an error. Description: ${err}`);
				reject(err);
			}

			const rows = res.data.values;

			if (rows.length === 0) {
				logger.error(`No data found on spreadsheet ${spreadsheetId} in range ${range}`);
				reject(rows);
			} else {
				resolve(rows);
			}
		});
	});

	return collectivesPromise;
};

/**
 * Generates a Pie chart from data collected from the Spreadsheets API and passed to
 * the req.collectives object.
 *  @param {object} req - standard req object from the Express library
 *  @param {object} res - standard res object from the Express library
 *  @returns {File} outputFile - Promise containing resized image or error
 */
const generateCharts = async (req, res) => {
	const collectives = req.collectives;
	logger.trace("Generating graph from collectives");
	const chartNode = new ChartjsNode(600, 600);
	/* In sequence: Tweets, Seguindo, Seguidores, Curtidas */
	const data = [collectives[0][2][8],
		collectives[0][2][9],
		collectives[0][2][10],
		collectives[0][2][11]];
	/* INSTAGRAM */
	const label = collectives[0][0][16];
	const labels = [
		collectives[0][1][8], // Tweets
		collectives[0][1][9], // Seguindo
		collectives[0][1][10], // Seguidores
		collectives[0][1][11], // Curtidas
	];
	const config = {
		type: "pie",
		data: {
			datasets: [{
				data: data,
				backgroundColor: ["#3e95cd", "#8e5ea2", "#3cba9f", "#e8c3b9"],
				label: label,
			}],
			labels: labels,
		},
		options: {
			responsive: true,
		},
	};
	await chartNode.drawChart(config);
	await chartNode.writeImageToFile("image/png", pathOfFile);
	return res.sendFile(pathOfFile);
};

const showLinkMap = async (req, res) => {
	res.status(httpStatus.OK).json({
		error: false,
		links: [
			{
				rel: "social-network-facebook",
				href: `${req.protocol}://${req.get("host")}/facebook/`,
			},
			{
				rel: "social-network-instagram",
				href: `${req.protocol}://${req.get("host")}/instagram/`,
			},
			{
				rel: "social-network-twitter",
				href: `${req.protocol}://${req.get("host")}/twitter/`,
			},
			{
				rel: "social-network-youtube",
				href: `${req.protocol}://${req.get("host")}/youtube/`,
			},
		],
	});
};

module.exports = {
	listCollectives,
	generateCharts,
	authenticate,
	setResocieSheet,
	showLinkMap,
};
