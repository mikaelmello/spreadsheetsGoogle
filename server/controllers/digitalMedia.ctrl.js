const logger = require("../../config/logger");
const ResocieObs = require("../../config/resocie.json").observatory;
const HttpStatus = require("../../config/resocie.json").httpStatus;
const ErrorMsgs = require("../../config/resocie.json").errorMessages;

/*	Route final methods */
/**
 * Search for all registered accounts in a given digital media
 * @param {object} req - standard request object from the Express library
 * @param {object} res - standard response object from the Express library
 * @param {object} media - selected digital media
 * @return Successfully returns the list with all registered actors;
 * in case of error, inform what happened
 */
const listAccounts = async (req, res, media) => {
	try {
		const accounts = await media.model.find({}, media.projection);

		const importLink = await getInitialLink(req, accounts, media.name);

		const sendInfo = {
			import: importLink,
			accounts,
		};

		res.send(sendInfo);
	} catch (error) {
		const errorMsg = ErrorMsgs.ERROR_LIST_ACCOUNTS + capitalize(media.name);

		stdErrorHand(res, HttpStatus.ERROR_LIST_ACCOUNTS, errorMsg, error);
	}
};

/**
 * Returns a list with all possible queries in the model
 * Used to limit possible routes
 * @param {object} req - standard request object from the Express library
 * @param {object} res - standard response object from the Express library
 * @param {object} media - social media to have its queries retrieved
 */
const getQueries = (req, res, media) => {
	let queryType = `${media}Queries`;
	const queriesList = ResocieObs.queries[queryType];
	queryType = `${media}QueriesPT`;
	const resocieQueriesPT = ResocieObs.queriesPT[queryType];
	const queries = [];

	/* eslint-disable*/
	for(query of queriesList) {
		const aux = {
			val: query,
			name: capitalize(resocieQueriesPT[query]),
		};
		queries.push(aux);
	};
	/* eslint-enable */

	res.send(queries);
};

/**
 * Search for all registered of a particular category in a given digital media.
 * @param {object} req - standard request object from the Express library
 * @param {object} res - standard response object from the Express library
 * @param {object} media - social media to have its queries retrieved
 * @return Successfully returns the list with all registered actors;
 * in case of error, inform what happened
 */
const getActors = async (req, res, media) => {
	const category = decodeCat(req);

	try {
		const accounts = await media.model.find({ category: category }, media.projection);

		res.send(accounts);
	} catch (error) {
		const errorMsg = ErrorMsgs.ERROR_CAT_ACTORS + category;

		stdErrorHand(res, HttpStatus.ERROR_CAT_ACTORS, errorMsg, error);
	}
};

/**
 * Data recovery about a given user
 * @param {object} req - standard request object from the Express library
 * @param {object} res - standard response object from the Express library
 * @param {object} media - selected digital media
 * @return Successfully returns the requested user;
 * in case of error, inform what happened
 */
const getUser = (req, res, media) => {
	try {
		const account = req.account[0].toObject();
		account.links = getQueriesLink(req, account.ID, media);

		res.send(account);
	} catch (error) {
		const errorMsg = ErrorMsgs.ERROR_GET_USER;

		stdErrorHand(res, HttpStatus.ERROR_GET_USER, errorMsg, error);
	}
};

/**
 * Data recovery latest about a given user
 * @param {object} req - standard request object from the Express library
 * @param {object} res - standard response object from the Express library
 * @param {object} media - selected digital media
 * @return Successfully returns the latest data of the requested user;
 * in case of error, inform what happened
 */
const getLatest = (req, res, media) => {
	try {
		const history = req.account[0].toObject().history;
		const latest = getLatestData(history, media);

		res.send(latest);
	} catch (error) {
		const errorMsg = ErrorMsgs.ERROR_LATEST + req.account.name;

		stdErrorHand(res, HttpStatus.ERROR_LATEST, errorMsg, error);
	}
};

/*	Route middlewares */
/**
 * Look for a specific registered account, by your identification.
 * @param {object} req - standard request object from the Express library
 * @param {object} res - standard response object from the Express library
 * @param {object} next - standard next function
 * @param {object} media - selected digital media
 * @returns Execution of the next feature, over the data found
 */
const loadAccount = async (req, res, next, media) => {
	try {
		await lookUpAccount(req, media);

		return next();
	} catch (error) {
		const id = getRequestID(req);

		const errorMsg = ErrorMsgs.ERROR_LOAD_ACCOUNT + id;

		return stdErrorHand(res, HttpStatus.ERROR_LOAD_ACCOUNT, errorMsg, error);
	}
};

/**
 * Layer to query requested identification
 * @param {object} req - standard request object from the Express library
 * @param {object} res - standard response object from the Express library
 * @param {object} next - standard next function
 * @param {object} media - selected digital media
 * @returns Execution of the next feature, over the history key generated
 */
const setHistoryKey = (req, res, next, media) => {
	const queriesPT = ResocieObs.queriesPT[media.queriesPT];
	const historyKey = req.params.query;
	const historyKeyPT = queriesPT[historyKey];

	if (historyKeyPT === undefined)	return errorHistoryKey(req, res, historyKey);

	req.chart = {
		historyKey: historyKey,
		historyKeyPT: historyKeyPT,
	};

	return next();
};

/**
 * Split of actors to be compared
 * @param {object} req - standard request object from the Express library
 * @param {object} res - standard response object from the Express library
 * @param {object} next - standard next function
 * @returns Execution of the next feature
 */
const splitActors = (req, res, next) => {
	try {
		const actors = req.query.actors.split(",");

		if (actors.length <= 1) {
			throw new TypeError("Insufficient amount of actors for a comparison");
		}

		req.actors = actors;

		next();
	} catch (error) {
		const errorMsg = ErrorMsgs.ERROR_SPLIT_ACTORS;

		stdErrorHand(res, HttpStatus.ERROR_SPLIT_ACTORS, errorMsg, error);
	}
};

/*	Methods of abstraction upon request */
/**
 * Choose from searching multiple accounts or just one
 * @param {object} req - standard request object from the Express library
 * @param {object} media - selected digital media
 */
const lookUpAccount = async (req, media) => {
	if (req.actors !== undefined) {
		/* eslint-disable */
		for (const cActor of req.actors)
			await findAccount(req, cActor, media);
		/* eslint-enable */
	} else {
		const id = req.params.id;
		await findAccount(req, id, media);
	}
};

/**
 * Search for an account in the records and making it available
 * @param {object} req - standard request object from the Express library
 * @param {object} id - standard identifier of a Facebook account
 */
const findAccount = async (req, id, media) => {
	const account = await media.model.findOne({ ID: id }, media.projection);

	if (!account) throw TypeError(`There is no user [${id}]`);

	if (req.account === undefined) req.account = [];

	req.account.push(account);
};

/**
 * Acquiring the links to the home page
 * @param {object} req - standard request object from the Express library
 * @param {object} accounts - Accounts registered for Facebook
 */
const getInitialLink = (req, accounts, socialMedia) => {
	getAccountLink(req, accounts, socialMedia);

	return getImportLink(req, socialMedia);
};

/**
 * Acquire links to all registered Facebook accounts
 * @param {object} req - standard request object from the Express library
 * @param {object} accounts - Accounts registered for Facebook
 */
const getAccountLink = (req, accounts, socialMedia) => {
	const length = accounts.length;

	for (let i = 0; i < length; i += 1) {
		accounts[i] = accounts[i].toObject();
		accounts[i].links = [];
		const id = accounts[i].ID;

		if (id) {
			const link = {
				rel: `${socialMedia}.account`,
				href: `${req.protocol}://${req.get("host")}/${socialMedia}/${id}`,
			};
			accounts[i].links.push(link);
		}
	}
};

/**
 * Acquiring link to import from Facebook accounts
 * @param {object} req - standard request object from the Express library
 */
const getImportLink = (req, socialMedia) => {
	return {
		rel: `${socialMedia}.import`,
		href: `${req.protocol}://${req.get("host")}/${socialMedia}/import`,
	};
};

/**
 * Acquiring the links to the possible queries for Facebook
 * @param {object} req - standard request object from the Express library
 * @param {object} id - standard identifier of a Facebook account
 */
const getQueriesLink = (req, id, socialMedia) => {
	const links = [];
	const midiaQueries = ResocieObs.queries[socialMedia.queries];

	links.push(getCommomLink(req, id, socialMedia.name));

	for (query of midiaQueries) {								// eslint-disable-line
		links.push(getQueryLink(req, id, socialMedia, query));	// eslint-disable-line
	}

	return links;
};

/**
 * Acquisition of the link to the common query among all social media
 * @param {object} req - standard request object from the Express library
 * @param {object} id - standard identifier of a Facebook account
 */
const getCommomLink = (req, id, socialMedia) => {
	const commom = ResocieObs.queries.commonQuery;

	return {
		rel: `${socialMedia}.account.${commom}`,
		href: `${req.protocol}://${req.get("host")}/${socialMedia}/${commom}/${id}`,
	};
};

/**
 * Acquire the link to a given query for Facebook
 * @param {object} req - standard request object from the Express library
 * @param {object} id - standard identifier of a Facebook account
 * @param {object} query - query requested
 */
const getQueryLink = (req, id, socialMedia, query) => {
	return {
		rel: `${socialMedia.name}.account.${query}`,
		href: `${req.protocol}://${req.get("host")}/${socialMedia.name}/${id}/${query}`,
	};
};

/**
 * Acquire of ID under handling
 * @param {object} req - standard request object from the Express library
 */
const getRequestID = (req) => {
	if (req.actors !== undefined)	return req.actors;

	return req.params.id;
};

/**
 * Standard query error handler
 * @param {object} req - standard request object from the Express library
 * @param {object} res - standard response object from the Express library
 * @param {string} query - Query Attempt
 */
const errorHistoryKey = (req, res, query) => {
	const errorMsg = ErrorMsgs.ERROR_QUERY_KEY + query;
	const error = `Tried to access ${req.originalUrl}`;

	return stdErrorHand(res, HttpStatus.ERROR_QUERY_KEY, errorMsg, error);
};

const decodeCat = (req) => {
	const categoryCode = req.params.cat.toUpperCase();

	return ResocieObs.categories[categoryCode];
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

	res.send({
		errorCode: errorCode,
		description: errorMsg,
	});
};

/*	Methods of abstraction */
/**
 * Data recovery latest about a given user
 * @param {object} history - history under analysis
 * @param {object} media - selected digital media
 */
const getLatestData = (history, media) => {
	const length = history.length - 1;
	const latest = {};
	const limit = ResocieObs.queriesRange[media.queries];
	const queries = ResocieObs.queries[media.queries];
	let count = 0;

	for (let ind = length; ind >= 0 && count <= limit; ind -= 1) {
		/* eslint-disable */
		for (query of queries) {
			if (latest[query] === undefined
				&& history[ind][query] !== undefined) {
				latest[query] = history[ind][query];
				count += 1;
			}
		}
		/* eslint-enable */
	}

	return latest;
};

/**
 * Capitalization of a given string
 * @param {string} str - string for modification
 */
const capitalize = (str) => {
	/* eslint-disable */
	str = str.charAt(0).toUpperCase() + str.slice(1);
	str = str.replace(/\s\w/g, l => l.toUpperCase());
	/* eslint-enable */

	return str;
};

module.exports = {
	listAccounts,
	getUser,
	getActors,
	getLatest,
	getQueries,
	loadAccount,
	setHistoryKey,
	splitActors,
	capitalize,
};
