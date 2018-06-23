/*	Required modules */
const mongoose = require("mongoose");
const InstagramDB = require("../models/instagram.model");
const ResocieObs = require("../../config/resocie.json").observatory;
const digitalMediaCtrl = require("./digitalMedia.ctrl");

/*	Media identification */
const SOCIAL_MIDIA = ResocieObs.socialMidia.instagramMidia;

/*	Route final methods */
/**
 * Search for all registered Instagram accounts.
 * @param {object} req - standard request object from the Express library
 * @param {object} res - standard response object from the Express library
 * @returns Successfully returns the list with all registered actors;
 * in case of error, inform what happened
 */
const listAccounts = async (req, res) => {
	const instagramInfo = {
		model: InstagramDB,
		projection: "name ID link -_id",
		name: SOCIAL_MIDIA,
	};

	await digitalMediaCtrl.listAccounts(req, res, instagramInfo);
};

/**
 * Parses the data of a spreadsheet to retrieve instagram accounts and add them into the database
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
	const iRange = req.sheet.instagramRange;

	mongoose.connection.collections.instagramAccount.deleteMany();

	for (let i = 0; i < length; i += 1) {
		const cTab = tabs[i];
		cType = 0;

		const rowsCount = cTab.length;
		for (let j = 0; j < rowsCount; j += 1) {
			const row = cTab[j];
			const name = row[iRange.nameRow].replace(/\n/g, " ");

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

			// validation of id field with regex to capture only the id
			// and not the whole profile url
			const id = getImportID(row[iRange.profileRow]);

			// if current actor hasnt been defined yet, create a new schema
			if (actors[name] === undefined) {
				const newAccount = InstagramDB({
					name: name,
					ID: id,
					link: row[iRange.profileRow],
					category: req.sheet.categories[cType],
				});
				actors[name] = newAccount;
			} else if (!actors[name].ID) {
				actors[name].ID = id;
			}

			// if current actor does not have a instagram id, continue
			if (id === null) continue; // eslint-disable-line no-continue

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
 * Returns an object with Instagram-related queries based on its model
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
	const instagramInfo = {
		name: SOCIAL_MIDIA,
		queries: "instagramQueries",
	};

	digitalMediaCtrl.getUser(req, res, instagramInfo);
};

/**
 * Data recovery latest about a given user
 * @param {object} req - standard request object from the Express library
 * @param {object} res - standard response object from the Express library
 */
const getLatest = (req, res) => {
	const instagramInfo = {
		name: SOCIAL_MIDIA,
		queries: "instagramQueries",
	};

	digitalMediaCtrl.getLatest(req, res, instagramInfo);
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
	const instagramInfo = {
		model: InstagramDB,
		projection: "-_id -__v",
	};

	return digitalMediaCtrl.loadAccount(req, res, next, instagramInfo);
};

/**
 * Layer to query requested identification
 * @param {object} req - standard request object from the Express library
 * @param {object} res - standard response object from the Express library
 * @param {object} next - standard next function
 * @returns Execution of the next feature, over the history key generated
 */
const setHistoryKey = (req, res, next) => {
	const instagramInfo = {
		queriesPT: "instagramQueriesPT",
	};

	digitalMediaCtrl.setHistoryKey(req, res, next, instagramInfo);
};

/*	Methods of abstraction */
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
	importData,
	getUser,
	getQueries,
	getLatest,
	loadAccount,
	setHistoryKey,
};
