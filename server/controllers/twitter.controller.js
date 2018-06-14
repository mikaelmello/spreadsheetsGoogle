/*	Required modules */
const mongoose = require("mongoose");
const twitterAccount = require("../models/twitter.model");
const logger = require("../../config/logger");
const ResocieObs = require("../../config/resocie.json").observatory;
const httpStatus = require("../../config/resocie.json").httpStatus;

const viewCtrl = require("./view.controller");
const geralCtrl = require("./geral.controller");

/*	Global constants */
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
		const errorMsg = `Erro ao carregar usuários do ${geralCtrl.capitalize(SOCIAL_MIDIA)} nos registros`;

		stdErrorHand(res, httpStatus.ERROR_LIST_ACCOUNTS, errorMsg, error);
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
	let cType; // current type index
	let lastDate; // date of last inserted sample
	const actors = {}; // map of actor objects to avoid creating duplicates
	const tabs = req.collectives;
	const length = tabs.length;
	const tRange = req.sheet.twitterRange;

	mongoose.connection.collections.twitterAccount.deleteMany();

	for (let i = 0; i < length; i += 1) {
		const cTab = tabs[i];
		cType = 0;

		const rowsCount = cTab.length;
		for (let j = 0; j < rowsCount; j += 1) {
			const row = cTab[j];
			const name = row[tRange.nameRow].replace(/\n/g, " ");

			// Se estivermos na row que indicao o novo tipo, atualiza
			// a string do tipo atual e continua para a próxima row
			if (name === req.sheet.categories[cType + 1]) {
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
			const username = getImportUsername(row[tRange.profileRow]);

			// if current actor hasnt been defined yet, create a new schema
			if (actors[name] === undefined) {
				const newAccount = twitterAccount({
					name: name,
					username: username,
					type: req.sheet.categories[cType],
				});
				actors[name] = newAccount;
			} else if (!actors[name].username) {
				actors[name].username = username;
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
					const newDate = getImportDate(value, lastDate);
					lastDate = newDate;
					sample[key] = new Date(`${newDate[1]}/${newDate[0]}/${newDate[2]}`);
				} else if (!isCellValid(value)) {
					sample[key] = null;
				} else if (key !== "campaigns") {
					// if string is not empty, remove all dots and commas to avoid
					// real numbers
					sample[key] = getImportNumber(value);
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

		stdErrorHand(res, httpStatus.ERROR_GET_USER, errorMsg, error);
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
		const errorMsg = `Error enquanto se recuperava os últimos dados válidos para o usuário [${req.account.name}], no ${geralCtrl.capitalize(SOCIAL_MIDIA)}`;

		stdErrorHand(res, httpStatus.ERROR_LATEST, errorMsg, error);
	}
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
		const errorMsg = `Error ao carregar usuário(s) [${username}] dos registros do ${geralCtrl.capitalize(SOCIAL_MIDIA)}`;

		return stdErrorHand(res, httpStatus.ERROR_LOAD_ACCOUNT, errorMsg, error);
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
	const errorMsg = `Não existe a caracteristica [${sampleKey}] para o ${geralCtrl.capitalize(SOCIAL_MIDIA)}`;

	// Título do gráfico gerado
	let mainLabel;

	// Analisa o caminho da rota que chegou nesta função para
	// ter um título com o parâmetro correto.
	if (sampleKeyPT !== undefined) {
		mainLabel = viewCtrl.evolutionMsg(sampleKeyPT, SOCIAL_MIDIA);
	} else {
		logger.error(`${errorMsg} - Tried to access ${req.originalUrl}`);
		return res.status(httpStatus.ERROR_QUERY_KEY).json({
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

/*	Methods of abstraction upon request */
/**
 * Search for an account in the records and making it available
 * @param {object} req - standard request object from the Express library
 * @param {object} username - standard identifier of a Twitter account
 */
const findAccount = async (req, id) => {
	const account = await twitterAccount.findOne({ username: id }, "-_id -__v");

	if (!account) throw TypeError(`There is no user [${id}]`);

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
const stdErrorHand = (res, errorCode, errorMsg, error) => {
	logger.error(`${errorMsg} - Detalhes: ${error}`);

	res.status(errorCode).json({
		error: true,
		description: errorMsg,
	});
};

/**
 * Acquire the account username from the import base
 * @param {string} usernameRaw - supposed account username
 */
const getImportUsername = (usernameRaw) => {
	if (!(usernameRaw) || !(usernameRaw.includes(`${SOCIAL_MIDIA}.com`))) return null;

	let username = usernameRaw.replace(`https://www.${SOCIAL_MIDIA}.com/`, "");
	username = username.replace(`https://${SOCIAL_MIDIA}.com/`, "");
	username = username.split("/");

	if (username[0] !== "pg")	username = username[0];
	else username = username[1];

	username = username.split("?");

	return username[0];
};

/**
 * Data validation by recurrent criteria
 * @param {String} value - data to be validated
 * @returns true if it is not valid, false if it is valid
 */
const isCellValid = (value) => {
	if (!value) return false;

	value = value.toUpperCase();

	if (value === "-"
		|| value === "S"
		|| value === "S/") {
		return false;
	}

	return true;
};

/**
 * Acquire a date from the import base
 * @param {string} date - supposed valid date
 * @param {array} lastDate - last valid date
 */
const getImportDate = (date, lastDate) => {
	if (!date) return lastDate;

	date = date.split("/");

	if (!(date) || date.length !== 3) date = lastDate;

	return date;
};

/**
 * Acquire a number from the import base
 * @param {string} number - supposed valid number
 */
const getImportNumber = (number) => {
	number = parseInt(number.replace(/\.|,/g, ""), 10);

	if (Number.isNaN(number)) number = null;

	return number;
};

module.exports = {
	listAccounts,
	importData,
	getUser,
	userLastSample,
	loadAccount,
	setSampleKey,
	getImportUsername,
	isCellValid,
	getImportDate,
	getImportNumber,
};
