/*	Required modules */
const ChartNode = require("chartjs-node");
const httpStatus = require("http-status");
const mongoose = require("mongoose");
const Color = require("./color.controller");
const instagramAccount = require("../models/instagram.model");
const logger = require("../../config/logger");
const ResocieObs = require("../../config/resocie.json").observatory;

/*	Global constants */
const CHART_SIZE = 700;
const MAX_LEN_LABEL = 80;
const SOCIAL_MIDIA = ResocieObs.socialMidia.instagramMidia;

/*	Route final methods */
/**
 * Search for all registered Facebook accounts.
 * @param {object} req - standard request object from the Express library
 * @param {object} res - standard response object from the Express library
 * @return {object} result - list with all registered accounts, displaying the link and the name
 * @return {String} description - error warning
 */
const listAccounts = async (req, res) => {
	try {
		const accounts = await instagramAccount.find({}, "name username");

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
	const iRange = req.sheet.instagramRange;

	mongoose.connection.collections.instagramAccount.drop();

	for (let i = 0; i < length; i += 1) {
		const cTab = tabs[i];

		const rowsCount = cTab.length;
		for (let j = 0; j < rowsCount; j += 1) {
			const row = cTab[j];
			const name = row[iRange.nameRow].replace(/\n/g, " ");

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
			const username = matchInstagramUsername(row[iRange.profileRow]);

			// if current actor hasnt been defined yet, create a new schema
			if (actors[name] === undefined) {
				const newAccount = instagramAccount({
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
				date: row[iRange.dateRow],
				followers: row[iRange.followersRow],
				following: row[iRange.followingRow],
				num_of_posts: row[iRange.postsRow],
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

			actors[name].history.push(sample);
		}
	}

	// Executes save() for all actors and finishes when all of them finish
	const savePromises = [];
	Object.entries(actors).forEach(([key]) => {
		savePromises.push(actors[key].save());
	});
	await Promise.all(savePromises);
	return res.redirect("/instagram");
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
 * Data recovery latest about a given user
 * @param {object} req - standard request object from the Express library
 * @param {object} res - standard response object from the Express library
 */
const getLatest = (req, res) => {
	try {
		const history = req.account[0].toObject().history;
		const length = history.length - 1;
		const latest = {};
		const limit = ResocieObs.queriesRange.instagramQueries;
		const queries = ResocieObs.queries.instagramQueries;
		let count = 0;

		for (let ind = length; ind >= 0 && count <= limit; ind -= 1) {
			for (query of queries) {						// eslint-disable-line
				if (latest[query] === undefined				// eslint-disable-line
					&& history[ind][query] !== undefined) {	// eslint-disable-line
					latest[query] = history[ind][query];	// eslint-disable-line
					count += 1;
				}
			}
		}

		req.account[0].history.latest = latest;

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
 * Generating and plotting the generated chart on the page
 * @param {object} req - standard request object from the Express library
 * @param {object} res - standard response object from the Express library
 */
const plotLineChart = async (req, res) => {
	const chart = new ChartNode(CHART_SIZE, CHART_SIZE);

	await chart.drawChart(req.chart.config);
	const buffer = await chart.getImageBuffer("image/png");
	res.writeHeader(httpStatus.OK, { "Content-type": "image/png" });
	res.write(buffer);
	res.end();
};

/*	Route middlewares */
/**
 * Look for a specific registered Instagram account, by username.
 * @param {object} req - standard request object from the Express library
 * @param {object} res - standard response object from the Express library
 * @param {object} next - standard next function
 * @returns Execution of the next feature, over the data found
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
 * Layer to query requested identification
 * @param {object} req - standard request object from the Express library
 * @param {object} res - standard response object from the Express library
 * @param {object} next - standard next function
 * @returns Execution of the next feature, over the history key generated
 */
const setHistoryKey = (req, res, next) => {
	const queriesPT = ResocieObs.queriesPT.instagramQueriesPT;
	const historyKey = req.params.query;
	const historyKeyPT = queriesPT[historyKey];
	const errorMsg = `Não existe a caracteristica [${historyKey}] para o ${capitalize(SOCIAL_MIDIA)}`;

	let chartTitle;

	if (historyKeyPT !== undefined) {
		chartTitle = evolutionMsg(historyKeyPT);
	} else {
		logger.error(`${errorMsg} - Tried to access ${req.originalUrl}`);
		return res.status(httpStatus.NOT_FOUND).json({
			error: true,
			description: errorMsg,
		});
	}

	req.chart = {
		historyKey: historyKey,
		historyKeyPT: historyKeyPT,
		chartTitle: chartTitle,
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
 * Recovery of the requested historical data set
 * @param {object} req - standard request object from the Express library
 * @param {object} res - standard response object from the Express library
 * @param {object} next - standard next function
 * @returns Execution of the next feature, over the data set generated
 */
const getDataset = (req, res, next) => {
	const historyKey = req.chart.historyKey;
	const accounts = req.account;

	if (req.chart.dataSets === undefined) {
		req.chart.dataSets = [];
	}

	if (req.chart.data === undefined) {
		req.chart.data = [];
	}

	accounts.forEach((account) => {
		const dataUser = [];
		const history = account.history;
		const length = history.length;
		// const labels = [];

		for (let ind = 0; ind < length; ind += 1) {
			if (history[ind][historyKey] !== undefined
				&& history[ind][historyKey] !== null) {
				const date = new Date(history[ind].date);

				dataUser.push({
					x: date,
					y: history[ind][historyKey],
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
	// let averageValue = 0;
	// let desvPadValue = 0;
	let value = 0;

	const historiesValid = req.chart.data;
	let length = 0;

	historiesValid.forEach((history) => {
		history.forEach((point) => {
			length += 1;
			value = point.y;

			if (value < minValue)		minValue = value;
			if (value > maxValue)		maxValue = value;

			// averageValue += value;
		});
	});

	/*
	averageValue /= length;

	historiesValid.forEach((history) => {
		history.forEach((point) => {
			value = point.y;
			desvPadValue += (value - averageValue) ** 2;
		});
	});

	desvPadValue /= length;
	desvPadValue = Math.ceil(Math.sqrt(desvPadValue));

	maxValue = Math.ceil(maxValue) + desvPadValue;
	minValue = Math.floor(minValue) - desvPadValue;
	*/

	const margin = (maxValue - minValue) * percent;
	maxValue = Math.ceil(maxValue + margin);
	minValue = Math.floor(minValue - margin);
	if (minValue <= 0) minValue = 0;

	req.chart.yMin = minValue;
	req.chart.yMax = maxValue;
	req.chart.yStep = (maxValue - minValue) / (2 * length);

	next();
};

/**
 * Standard setting for generating a line chart
 * @param {object} req - standard request object from the Express library
 * @param {object} res - standard response object from the Express library
 * @param {object} next - standard next function
 * @returns Execution of the next feature, over the chart's configuration
 */
const getConfigLineChart = (req, res, next) => {
	const labelXAxes = "Data";
	const labelYAxes = `Nº de ${req.chart.historyKeyPT}`;

	const config = {
		type: "line",
		data: { datasets: req.chart.dataSets },
		options: {
			title: {
				display: true,
				text: req.chart.chartTitle,
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
					autoSkip: false,
					time: {
						tooltipFormat: "ll HH:mm",
						unit: "week",
						displayFormats: { month: "MMM YYYY" },
					},
					ticks: {
						major: { fontStyle: "bold" },
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

	req.chart.config = config;

	next();
};

/*	Methods of abstraction upon request */
/**
 * Search for an account in the records and making it available
 * @param {object} req - standard request object from the Express library
 * @param {object} username - standard identifier of a Instagram account
 */
const findAccount = async (req, username) => {
	const account = await instagramAccount.findOne({ username });

	if (req.account === undefined) req.account = [];

	req.account.push(account);
};

/**
 * Acquiring the links to the home page
 * @param {object} req - standard request object from the Express library
 * @param {object} accounts - Accounts registered for Instagram
 */
const getInitialLink = (req, accounts) => {
	getAccountLink(req, accounts);

	return getImportLink(req, SOCIAL_MIDIA);
};

/**
 * Acquire links to all registered Instagram accounts
 * @param {object} req - standard request object from the Express library
 * @param {object} accounts - Accounts registered for Instagram
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
 * Acquiring link to import from Instagram accounts
 * @param {object} req - standard request object from the Express library
 */
const getImportLink = (req) => {
	return {
		rel: `${SOCIAL_MIDIA}.import`,
		href: `${req.protocol}://${req.get("host")}/${SOCIAL_MIDIA}/import`,
	};
};

/**
 * Acquiring the links to the possible queries for Instagram
 * @param {object} req - standard request object from the Express library
 * @param {object} id - standard identifier of a Instagram account
 */
const getQueriesLink = (req, id) => {
	const links = [];
	const midiaQueries = ResocieObs.queries.instagramQueries;

	links.push(getCommomLink(req, id));

	for (query of midiaQueries) {								// eslint-disable-line
		links.push(getQueryLink(req, id, query));	// eslint-disable-line
	}

	return links;
};

/**
 * Acquisition of the link to the common query among all social media
 * @param {object} req - standard request object from the Express library
 * @param {object} id - standard identifier of a Instagram account
 */
const getCommomLink = (req, id) => {
	const commom = ResocieObs.queries.commonQuery;

	return {
		rel: `${SOCIAL_MIDIA}.account.${commom}`,
		href: `${req.protocol}://${req.get("host")}/${SOCIAL_MIDIA}/${commom}/${id}`,
	};
};

/**
 * Acquire the link to a given query for Instagram
 * @param {object} req - standard request object from the Express library
 * @param {object} id - standard identifier of a Instagram account
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

const matchInstagramUsername = (profileUrl) => {
	try {
		if (!(profileUrl) || !(profileUrl.includes("instagram.com"))) return null;
		const igRegex = /(https?:\/\/)?(www\.)?instagram\.com\/([A-Za-z0-9_](?:(?:[A-Za-z0-9_]|(?:\.(?!\.))){0,28}(?:[A-Za-z0-9_]))?)/;
		const splitUsername = profileUrl.match(igRegex);
		return splitUsername[3];
	} catch (err) {
		return null;
	}
};

module.exports = {
	listAccounts,
	importData,
	getUser,
	getLatest,
	plotLineChart,
	loadAccount,
	setHistoryKey,
	splitActors,
	getDataset,
	getChartLimits,
	getConfigLineChart,
	evolutionMsg,
	capitalize,
	matchInstagramUsername,
};
