/*	Required modules */
const mongoose = require("mongoose");
const FacebookDB = require("../models/facebook.model");
const digitalMediaCtrl = require("./digitalMedia.ctrl");
/*	Media identification */
const SOCIAL_MIDIA = require("../../config/resocie.json").observatory.socialMidia.facebookMidia;

/*	Route final methods */
/**
 * Search for all registered Facebook accounts.
 * @param {object} req - standard request object from the Express library
 * @param {object} res - standard response object from the Express library
 * @return Successfully returns the list with all registered actors;
 * in case of error, inform what happened
 */
const listAccounts = async (req, res) => {
	const facebookInfo = {
		model: FacebookDB,
		projection: "name ID link -_id",
		name: SOCIAL_MIDIA,
	};

	await digitalMediaCtrl.listAccounts(req, res, facebookInfo);
};

/**
 * Insert all Facebook accounts available.
 * @param {object} req - standard request object from the Express library
 * @param {object} res - standard response object from the Express library
 */
const importAccounts = async (req, res) => {
	const tabs = req.collectives;
	const length = tabs.length;
	const actors = {};
	const categories = req.sheet.categories;
	const facebookRange = req.sheet.facebookRange;
	const nameRow = req.sheet.range.nameRow;
	const linkRow = facebookRange.linkRow;
	const likesRow = facebookRange.likesRow;
	const followersRow = facebookRange.followersRow;
	const dateRow = facebookRange.dateRow;
	let cCategory = 0;
	let lastDate;

	mongoose.connection.collections.facebook.deleteMany();

	for (let posSheet = 0; posSheet < length; posSheet += 1) {
		const cSheet = tabs[posSheet];
		const rowsCount = cSheet.length;
		cCategory = 0;

		for (let posRow = 0; posRow < rowsCount; posRow += 1) {
			const cRow = cSheet[posRow];

			if (!cRow[nameRow] || posRow < 1) {
				continue; // eslint-disable-line no-continue
			}

			// Se estivermos na row que indicao o novo tipo, atualiza
			// a string do tipo atual e continua para a próxima row
			if (cRow[nameRow] === categories[cCategory + 1]) {
				cCategory += 1;
				continue; // eslint-disable-line no-continue
			}

			const accountLink = getImportAccountLink(cRow[linkRow]);

			if (actors[cRow[nameRow]] === undefined) {
				const newAccount = FacebookDB({
					name: cRow[nameRow].replace(/\n/g, " "),
					category: categories[cCategory],
					link: accountLink,
					ID: getImportID(accountLink),
				});

				actors[cRow[nameRow]] = newAccount;
			} else if (!actors[cRow[nameRow]].ID) {
				actors[cRow[nameRow]].link = accountLink;
				actors[cRow[nameRow]].ID = accountLink;
			}

			if (accountLink) {
				for (let posRow2 = linkRow; posRow2 <= dateRow; posRow2 += 1) {
					if (!isCellValid(cRow[posRow2])) {
						cRow[posRow2] = null;
					} else if (posRow2 === likesRow	|| posRow2 === followersRow) {
						cRow[posRow2] = getImportNumber(cRow[posRow2]);
					}
				}

				const newDate = getImportDate(cRow[dateRow], lastDate);
				lastDate = newDate;

				const newHistory = {
					likes: cRow[likesRow],
					followers: cRow[followersRow],
					date: new Date(`${newDate[1]}/${newDate[0]}/${newDate[2]}`),
				};

				actors[cRow[nameRow]].history.push(newHistory);
			}
		}
	}
	const savePromises = [];
	Object.entries(actors).forEach((cActor) => {
		savePromises.push(cActor[1].save());
	});

	await Promise.all(savePromises);
	return res.redirect("/facebook");
};

/**
 * Returns an object with Facebook-related queries based on its model
 * @param {object} req - standard request object from the Express library
 * @param {object} res - standard response object from the Express library
 */
const getQueries = (req, res) => {
	digitalMediaCtrl.getQueries(req, res, SOCIAL_MIDIA);
};

/**
 * Data recovery about a given user
 * @param {object} req - standard request object from the Express library
 * @param {object} res - standard response object from the Express library
 */
const getUser = (req, res) => {
	const facebookInfo = {
		name: SOCIAL_MIDIA,
		queries: "facebookQueries",
	};

	digitalMediaCtrl.getUser(req, res, facebookInfo);
};

/**
 * Data recovery latest about a given user
 * @param {object} req - standard request object from the Express library
 * @param {object} res - standard response object from the Express library
 */
const getLatest = (req, res) => {
	const facebookInfo = {
		name: SOCIAL_MIDIA,
		queries: "facebookQueries",
	};

	digitalMediaCtrl.getLatest(req, res, facebookInfo);
};

/*	Route middlewares */
/**
 * Look for a specific registered Facebook account, by id.
 * @param {object} req - standard request object from the Express library
 * @param {object} res - standard response object from the Express library
 * @param {object} next - standard next function
 * @returns Execution of the next feature, over the data found
 */
const loadAccount = async (req, res, next) => {
	const facebookInfo = {
		model: FacebookDB,
		projection: "-_id -__v",
	};

	return digitalMediaCtrl.loadAccount(req, res, next, facebookInfo);
};

/**
 * Layer to query requested identification
 * @param {object} req - standard request object from the Express library
 * @param {object} res - standard response object from the Express library
 * @param {object} next - standard next function
 * @returns Execution of the next feature, over the history key generated
 */
const setHistoryKey = (req, res, next) => {
	const facebookInfo = {
		queriesPT: "facebookQueriesPT",
	};

	digitalMediaCtrl.setHistoryKey(req, res, next, facebookInfo);
};

/*	Methods of abstraction upon response */
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
 * Acquire the account link from the import base
 * @param {string} accountLink - supposed account link
 */
const getImportAccountLink = (accountLink) => {
	if (isCellValid(accountLink)) return accountLink;

	return null;
};

/**
 * Acquire the account id from the import base
 * @param {string} idRaw - supposed account id
 */
const getImportID = (idRaw) => {
	if (!(idRaw) || !(idRaw.includes(`${SOCIAL_MIDIA}.com`))) return null;

	let id = idRaw.replace(`https://www.${SOCIAL_MIDIA}.com/`, "");
	id = id.replace(`https://${SOCIAL_MIDIA}.com/`, "");
	id = id.split("/");

	if (id[0] !== "pg")	id = id[0];
	else id = id[1];

	id = id.split("?");

	return id[0];
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

module.exports = {
	listAccounts,
	importAccounts,
	getUser,
	getQueries,
	getLatest,
	loadAccount,
	isCellValid,
	setHistoryKey,
};
