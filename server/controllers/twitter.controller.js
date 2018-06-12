/*	Required modules */
const httpStatus = require("http-status");
const Chart = require("chartjs-node");
const mongoose = require("mongoose");
const Color = require("./color.controller");
const twitterAccount = require("../models/twitter.model");
const logger = require("../../config/logger");
const ResocieObs = require("../../config/resocie.json").observatory;

//const twitterChart = require("../../../frontend/controllers/twitterChart.controller");

/*	Global constants */
const CHART_SIZE = 700;
const MAX_LEN_LABEL = 80;
const SOCIAL_MIDIA = ResocieObs.socialMidia.twitterMidia;

/*	Route final methods */
/**
 * Retrieves all twitterAccount documents on the db and lists its name and username properties
 * @param {object} req - standard req object from the Express library
 * @param {object} res - standard res object from the Express library
 * @returns {json} - with the properties error (false if no error occurred) and usernames (an
 * array with multiple objects containing `name` and `username` properties
 */
const listAccounts = async (req, res) => {
	try {
		const accounts = await twitterAccount.find({}, "name username");

		const importLink = await getInitialLink(req, accounts);

		res.status(httpStatus.OK).json({
			error: false,
			import: importLink,
			accounts,
		});
	} catch (error) {
		const errorMsg = `Erro ao carregar usuários do ${capitalize(SOCIAL_MIDIA)} nos registros`;

		stdErrorHand(res, errorMsg, error);
	}
};

/**
 * Parses the data of a spreadsheet to retrieve twitter accounts and add them into the database
 * @param {object} req - standard req object from the Express library
 * @param {object} res - standard res object from the Express library
 * @returns {json} - { error: false } if successful
 */
const importData = async (req, res) => {
	// <TODO>: Add error handling to avoid crashes and return 500 instead

	// Different types of actors indicated in the spreadsheet
	let cType = 1; // current type index
	let lastDate; // date of last inserted sample
	const actors = {}; // map of actor objects to avoid creating duplicates
	const tabs = req.collectives;
	const length = tabs.length;
	const tRange = req.sheet.twitterRange;

	mongoose.connection.collections.twitterAccount.drop();

	for (let i = 0; i < length; i += 1) {
		const cTab = tabs[i];

		const rowsCount = cTab.length;
		for (let j = 0; j < rowsCount; j += 1) {
			const row = cTab[j];
			const name = row[tRange.nameRow].replace(/\n/g, " ");

			// Se estivermos na row que indicao o novo tipo, atualiza
			// a string do tipo atual e continua para a próxima row
			if (name === req.sheet.categories[cType] && cType < req.sheet.categories.length) {
				cType += 1;
				continue; // eslint-disable-line no-continue
			}

			// Se estiver em uma row com nome vazio ou a primeira
			// continue
			if (j <= 1 || !(name)) {
				continue; // eslint-disable-line no-continue
			}

			// validation of username field with regex to capture only the username
			// and not the whole profile url
			const username = matchTwitterUsername(row[tRange.profileRow]);

			// if current actor hasnt been defined yet, create a new schema
			if (actors[name] === undefined) {
				const newAccount = twitterAccount({
					name: name,
					username: username,
					type: req.sheet.categories[cType - 1],
				});
				actors[name] = newAccount;
			}

			// if current actor does not have a twitter username, continue
			if (username === null) continue; // eslint-disable-line no-continue

			// Defines sample and adds it to the actor document
			const sample = {
				date: row[tRange.dateRow],
				likes: row[tRange.likesRow],
				followers: row[tRange.followersRow],
				following: row[tRange.followingRow],
				moments: row[tRange.momentsRow],
				tweets: row[tRange.tweetsRow],
				campaigns: row[tRange.campaignsRow],
			};

			// validates all keys to a sample
			Object.entries(sample).forEach(([key, value]) => { // eslint-disable-line no-loop-func
				if (key === "date") {
					// Parses the date of the sample and use the last one if something wrong happens
					let newDate = value;
					if (newDate) newDate = newDate.split("/");
					if (!(newDate) || newDate.length !== 3) newDate = lastDate;
					lastDate = newDate;
					sample[key] = new Date(`${newDate[1]}/${newDate[0]}/${newDate[2]}`);
				} else if (!(value) || value === "s/" || value === "s") {
					sample[key] = null;
				} else if (key !== "campaigns") {
					// if string is not empty, remove all dots and commas to avoid
					// real numbers
					sample[key] = value.replace(/\.|,/g, "");
				}
			});

			actors[name].samples.push(sample);
		}
	}

	// Executes save() for all actors and finishes when all of them finish
	const savePromises = [];
	Object.entries(actors).forEach(([key]) => {
		savePromises.push(actors[key].save());
	});
	await Promise.all(savePromises);
	return res.redirect("/twitter");
};

/**
 * Data recovery about a given user
 * @param {object} req - standard request object from the Express library
 * @param {object} res - standard response object from the Express library
 */
const getUser = (req, res) => {
	try {
		const account = req.account[0].toObject();

		account.links = getQueriesLink(req, account.username); // eslint-disable-line

		res.status(httpStatus.OK).json({
			error: false,
			account,
		});
	} catch (error) {
		const errorMsg = "Erro enquanto configura-se o usuário";

		stdErrorHand(res, errorMsg, error);
	}
};

/**
 * Creates a sample from the last defined samples for each property
 * since samples are only required to have a date filled
 * @param {object} req - standard req object from the Express library
 * @param {object} res - standard res object from the Express library
 * @returns {json} - with the properties error (false if no error occurred) and account with the
 * following properties: _id, name, username, lastSample (likes, tweets, followers, following,
 * moments).
 */
const userLastSample = (req, res) => {
	try {
		const samples = req.account[0].toObject().samples;
		const length = samples.length - 1;
		const latest = {};
		const limit = ResocieObs.queriesRange.twitterQueries;
		const queries = ResocieObs.queries.twitterQueries;
		let count = 0;

		for (let ind = length; ind >= 0 && count <= limit; ind -= 1) {
			for (query of queries) {						// eslint-disable-line
				if (latest[query] === undefined				// eslint-disable-line
					&& samples[ind][query] !== undefined) {	// eslint-disable-line
					latest[query] = samples[ind][query];	// eslint-disable-line
					count += 1;
				}
			}
		}

		req.account[0].samples.latest = latest;

		res.status(httpStatus.OK).json({
			error: false,
			latest,
		});
	} catch (error) {
		const errorMsg = `Error enquanto se recuperava os últimos dados válidos para o usuário ${req.account.name}, no ${capitalize(SOCIAL_MIDIA)}`;

		stdErrorHand(res, errorMsg, error);
	}
};

/**
 * Draws the chart into a buffer and send it as a response to the request.
 * @param {object} req - standard req object from the Express library
 * @param {object} res - standard res object from the Express library
 * @param {object} next - standard next object from the Express libary
 */
const drawLineChart = async (req, res) => {
	const mainLabel = req.chart.mainLabel;
	const datasets = req.chart.dataSets;
	const chartNode = new Chart(CHART_SIZE, CHART_SIZE);
	const labelXAxes = "Data";
	const labelYAxes = `Nº de ${req.chart.sampleKeyPT}`;

	const config = {
		type: "line",
		data: {
			datasets: datasets,
		},
		options: {
			title: {
				display: true,
				text: mainLabel,
			},
			legend: {
				display: true,
				position: "top",
				labels: {
					padding: 15,
				},
			},
			scales: {
				xAxes: [{
					type: "time",
					time: {
						tooltipFormat: "ll",
						unit: "month",
						displayFormats: { month: "MM/YYYY" },
					},
					scaleLabel: {
						display: true,
						labelString: labelXAxes,
					},
				}],
				yAxes: [{
					scaleLabel: {
						display: true,
						labelString: labelYAxes,
					},
					ticks: {
						min: req.chart.yMin,
						max: req.chart.yMax,
						stepSize: req.chart.yStep,
					},
				}],
			},
		},
	};

	await chartNode.drawChart(config);
	const buffer = await chartNode.getImageBuffer("image/png");
	res.writeHead(httpStatus.OK, { "Content-Type": "image/png" });
	res.write(buffer);
	res.end();
};

/*	Route middlewares */
/**
 * Loads a twitter Account and pass it into the req.account object
 * @param {object} req - standard req object from the Express library
 * @param {object} res - standard res object from the Express library
 * @param {object} next - standard next object from the Express library
 */
const loadAccount = async (req, res, next) => {
	try {
		if (req.actors !== undefined) {
			for (const cActor of req.actors) {	// eslint-disable-line
				await findAccount(req, cActor);	// eslint-disable-line
			} 									// eslint-disable-line
		} else {
			const username = req.params.username;
			await findAccount(req, username);
		}

		return next();
	} catch (error) {
		let username;
		if (req.actors !== undefined) {
			username = req.actors;
		} else {
			username = req.params.username;
		}
		const errorMsg = `Error ao carregar usuário(s) [${username}] dos registros do ${capitalize(SOCIAL_MIDIA)}`;

		return stdErrorHand(res, errorMsg, error);
	}
};

/**
 * Middleware function that selects the correct property to retrieve data of the account
 *  based on the path of the url
 * @param {object} req - standard req object from the Express library
 * @param {object} res - standard res object from the Express library
 * @param {object} next - standard next object from the Express libary
 */
const setSampleKey = (req, res, next) => {
	// Pega o último elemento da URL para ver qual o parâmetro
	// da conta a ser analisado. Ex: /twitter/john/likes -> likes
	const queriesPT = ResocieObs.queriesPT.twitterQueriesPT;
	const sampleKey = req.params.query;
	const sampleKeyPT = queriesPT[sampleKey];
	const errorMsg = `Não existe a caracteristica [${sampleKey}] para o ${capitalize(SOCIAL_MIDIA)}`;

	// Título do gráfico gerado
	let mainLabel;

	// Analisa o caminho da rota que chegou nesta função para
	// ter um título com o parâmetro correto.
	if (sampleKeyPT !== undefined) {
		mainLabel = evolutionMsg(sampleKeyPT);
	} else {
		logger.error(`${errorMsg} - Tried to access ${req.originalUrl}`);
		return res.status(httpStatus.NOT_FOUND).json({
			error: true,
			description: errorMsg,
		});
	}

	req.chart = {
		sampleKey: sampleKey,
		sampleKeyPT: sampleKeyPT,
		mainLabel: mainLabel,
	};
	return next();
};

/**
 * Split of actors to be compared
 * @param {object} req - standard request object from the Express library
 * @param {object} res - standard response object from the Express library
 * @param {object} next - standard next function
 */
const splitActors = (req, res, next) => {
	try {
		const actors = req.query.actors.split(",");

		req.actors = actors;

		next();
	} catch (error) {
		const errorMsg = "Erro ao criar o ambiente para a comparação";

		stdErrorHand(res, errorMsg, error);
	}
};

/**
 * Creates a dataset to be used on the creation of a Chart object later on, this
 * dataset is based in the req.chart.sampleKey string
 * @param {object} req - standard req object from the Express library
 * @param {object} res - standard res object from the Express library
 * @param {object} next - standard next object from the Express libary
 */
const createDataset = (req, res, next) => {
	// Carrega as samples da conta do usuário
	const sampleKey = req.chart.sampleKey;
	const accounts = req.account;

	if (req.chart.dataSets === undefined) {
		req.chart.dataSets = [];
	}

	if (req.chart.data === undefined) {
		req.chart.data = [];
	}

	accounts.forEach((account) => {
		const dataUser = [];
		const samples = account.samples;
		const length = samples.length;
		// const labels = [];

		for (let ind = 0; ind < length; ind += 1) {
			if (samples[ind][sampleKey] !== undefined
				&& samples[ind][sampleKey] !== null) {
				const date = new Date(samples[ind].date);

				dataUser.push({
					x: date,
					y: samples[ind][sampleKey],
				});
				// labels.push(date);
			}
		}

		let label;
		if ((account.name.length + account.username.length) > MAX_LEN_LABEL) {
			label = `${account.name}\n(${account.username})`;
		} else {
			label = `${account.name} (${account.username})`;
		}

		const color = Color.getColor();
		const dataSet = {
			data: dataUser,
			backgroundColor: color,
			borderColor: color,
			fill: false,
			label: label,
		};

		req.chart.dataSets.push(dataSet);
		req.chart.data.push(dataUser);
	});

	next();
};

/**
 * Definition of the mathematical configurations for the Y-axis of the chart
 * @param {object} req - standard request object from the Express library
 * @param {object} res - standard response object from the Express library
 * @param {object} next - standard next function
 * @returns Execution of the next feature, over the Y-axis limits of the chart
 */
const getChartLimits = (req, res, next) => {
	let minValue = Number.MAX_VALUE;
	let maxValue = Number.MIN_VALUE;
	const percent = 0.05;
	let roundStep = 10;
	let averageValue = 0;
	let desvPadValue = 0;
	let value = 0;
	let stpValue;

	const historiesValid = req.chart.data;
	let length = 0;

	historiesValid.forEach((history) => {
		history.forEach((point) => {
			length += 1;
			value = point.y;

			if (value < minValue)		minValue = value;
			if (value > maxValue)		maxValue = value;

			averageValue += value;
		});
	});

	averageValue /= length;

	historiesValid.forEach((history) => {
		history.forEach((point) => {
			value = point.y;
			desvPadValue += (value - averageValue) ** 2;
		});
	});

	desvPadValue /= length;
	desvPadValue = Math.ceil(Math.sqrt(desvPadValue));

	const margin = (maxValue - minValue) * percent;
	const maxRaw = maxValue;
	const minRaw = minValue;

	maxValue += margin;
	minValue -= margin;

	stpValue = Math.round((maxValue - minValue) / ((length / historiesValid.length) * 2));

	roundStep **= (Math.round(Math.log10(desvPadValue - stpValue)) - 1);

	maxValue += roundStep - (maxValue % roundStep);
	minValue -= (minValue % roundStep);
	stpValue += roundStep - (stpValue % roundStep);

	if (Math.abs(maxRaw - maxValue) > stpValue) maxValue = maxRaw;
	if (Math.abs(minRaw - minRaw) < stpValue) minValue = minRaw - (minRaw % roundStep);
	if (minValue <= 0) minValue = 0;

	req.chart.yMin = Math.floor(minValue);
	req.chart.yMax = Math.ceil(maxValue);
	req.chart.yStep = stpValue;

	next();
};

/*	Methods of abstraction upon request */
/**
 * Search for an account in the records and making it available
 * @param {object} req - standard request object from the Express library
 * @param {object} username - standard identifier of a Twitter account
 */
const findAccount = async (req, username) => {
	const account = await twitterAccount.findOne({ username });

	if (req.account === undefined) req.account = [];

	req.account.push(account);
};

/**
 * Acquiring the links to the home page
 * @param {object} req - standard request object from the Express library
 * @param {object} accounts - Accounts registered for Twitter
 */
const getInitialLink = (req, accounts) => {
	getAccountLink(req, accounts);
	return getImportLink(req, SOCIAL_MIDIA);
};

/**
 * Acquire links to all registered Twitter accounts
 * @param {object} req - standard request object from the Express library
 * @param {object} accounts - Accounts registered for Twitter
 */
const getAccountLink = (req, accounts) => {
	const length = accounts.length;

	for (let i = 0; i < length; i += 1) {
		accounts[i] = accounts[i].toObject();
		accounts[i].links = [];

		if (accounts[i].username) {
			const link = {
				rel: `${SOCIAL_MIDIA}.account`,
				href: `${req.protocol}://${req.get("host")}/${SOCIAL_MIDIA}/${accounts[i].username}`,
			};
			accounts[i].links.push(link);
		}
	}
};

/**
 * Acquiring link to import from Twitter accounts
 * @param {object} req - standard request object from the Express library
 */
const getImportLink = (req) => {
	return {
		rel: `${SOCIAL_MIDIA}.import`,
		href: `${req.protocol}://${req.get("host")}/${SOCIAL_MIDIA}/import`,
	};
};

/**
 * Acquiring the links to the possible queries for Twitter
 * @param {object} req - standard request object from the Express library
 * @param {object} id - standard identifier of a Twitter account
 */
const getQueriesLink = (req, id) => {
	const links = [];
	const midiaQueries = ResocieObs.queries.twitterQueries;

	links.push(getCommomLink(req, id));

	for (query of midiaQueries) {								// eslint-disable-line
		links.push(getQueryLink(req, id, query));	// eslint-disable-line
	}

	return links;
};

/**
 * Acquisition of the link to the common query among all social media
 * @param {object} req - standard request object from the Express library
 * @param {object} id - standard identifier of a Twitter account
 */
const getCommomLink = (req, id) => {
	const commom = ResocieObs.queries.commonQuery;

	return {
		rel: `${SOCIAL_MIDIA}.account.${commom}`,
		href: `${req.protocol}://${req.get("host")}/${SOCIAL_MIDIA}/${commom}/${id}`,
	};
};

/**
 * Acquire the link to a given query for Twitter
 * @param {object} req - standard request object from the Express library
 * @param {object} id - standard identifier of a Twitter account
 * @param {object} query - query requested
 */
const getQueryLink = (req, id, query) => {
	return {
		rel: `${SOCIAL_MIDIA}.account.${query}`,
		href: `${req.protocol}://${req.get("host")}/${SOCIAL_MIDIA}/${id}/${query}`,
	};
};

/*	Methods of abstraction upon response */
/**
 * Standard Error Handling
 * @param {object} res - standard response object from the Express library
 * @param {String} errorMsg - error message for the situation
 * @param {object} error - error that actually happened
 */
const stdErrorHand = (res, errorMsg, error) => {
	logger.error(`${errorMsg} - Detalhes: ${error}`);

	res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
		error: true,
		description: errorMsg,
	});
};

/*	Methods of abstraction */
/**
 * Standard message for the analysis of the evolution of a characteristic
 * of a given account
 * @param {String} param - characteristic under analysis
 * @returns standard message generated
 */
const evolutionMsg = (param) => {
	return `Evolução de ${param}, no ${capitalize(SOCIAL_MIDIA)}`;
};

/**
 * Capitalization of a given string
 * @param {string} str - string for modification
 */
const capitalize = (str) => {
	return str.replace(/\b\w/g, l => l.toUpperCase()); // eslint-disable-line
};

const matchTwitterUsername = (username) => {
	try {
		if (!(username) || !(username.includes("twitter.com"))) return null;
		const twitterRegex = /((https?:\/\/)?(www\.)?twitter\.com\/)?(@|#!\/)?([A-Za-z0-9_]{1,15})(\/([-a-z]{1,20}))?/;
		const splitUsername = username.match(twitterRegex);
		return splitUsername[5];
	} catch (err) {
		return null;
	}
};

module.exports = {
	listAccounts,
	importData,
	getUser,
	userLastSample,
	drawLineChart,
	loadAccount,
	setSampleKey,
	splitActors,
	createDataset,
	getChartLimits,
	evolutionMsg,
	capitalize,
	matchTwitterUsername,
};
