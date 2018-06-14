const httpStatus = require("http-status");
// const Color = require("./color.controller");
const logger = require("../../config/logger");
// const ResocieObs = require("../../config/resocie.json").observatory;
const ErrorMsgs = require("../../config/resocie.json").errorMessages;

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
 * Capitalization of a given string
 * @param {string} str - string for modification
 */
const capitalize = (str) => {
	return str.replace(/\b\w/g, l => l.toUpperCase()); // eslint-disable-line
};

/**
 * Search for all registered Instagram accounts.
 * @param {object} req - standard request object from the Express library
 * @param {object} res - standard response object from the Express library
 * @return {object} result - list with all registered accounts, displaying the link and the name
 * @return {String} description - error warning
 */
const listAccounts = async (req, res, params) => {
	try {
		const accounts = await params.model.find({}, params.projection);

		const importLink = await getInitialLink(req, accounts, params.socialMedia);

		res.status(httpStatus.OK).json({
			error: false,
			import: importLink,
			accounts,
		});
	} catch (error) {
		const errorMsg = ErrorMsgs.ERROR_LIST_ACCOUNTS + capitalize(params.socialMedia);

		stdErrorHand(res, httpStatus.ERROR_LIST_ACCOUNTS, errorMsg, error);
	}
};

/*	Methods of abstraction upon request */

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
		const id = accounts[i].username;

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

module.exports = {
	splitActors,
	capitalize,
	listAccounts,
};
