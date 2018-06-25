/*	Required modules */
const mongoose = require("mongoose");
const request = require("request-promise");
const TwitterDB = require("../models/twitter.model");
const digitalMediaCtrl = require("./digitalMedia.ctrl");
const HttpStatus = require("../../config/resocie.json").httpStatus;
/*	Media identification */
const SOCIAL_MIDIA = require("../../config/resocie.json").observatory.socialMidia.twitterMidia;

/*	Route final methods */
/**
 * Search for all registered Twitter accounts.
 * @param {object} req - standard request object from the Express library
 * @param {object} res - standard response object from the Express library
 * @return Successfully returns the list with all registered actors;
 * in case of error, inform what happened
 */
const listAccounts = async (req, res) => {
	const twitterInfo = {
		model: TwitterDB,
		projection: "name ID link -_id",
		name: SOCIAL_MIDIA,
	};

	await digitalMediaCtrl.listAccounts(req, res, twitterInfo);
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

			// validation of id field with regex to capture only the id
			// and not the whole profile url
			const id = getImportID(row[tRange.profileRow]);

			// if current actor hasnt been defined yet, create a new schema
			if (actors[name] === undefined) {
				const newAccount = TwitterDB({
					name: name,
					ID: id,
					link: row[tRange.profileRow],
					category: req.sheet.categories[cType],
				});
				actors[name] = newAccount;
			} else if (!actors[name].ID) {
				actors[name].link = row[tRange.profileRow];
				actors[name].ID = id;
			}

			// if current actor does not have a twitter id, continue
			if (id === null) continue; // eslint-disable-line no-continue

			// Defines sample and adds it to the actor document
			const history = {
				date: row[tRange.dateRow],
				likes: row[tRange.likesRow],
				followers: row[tRange.followersRow],
				following: row[tRange.followingRow],
				moments: row[tRange.momentsRow],
				tweets: row[tRange.tweetsRow],
				campaigns: row[tRange.campaignsRow],
			};

			// validates all keys to a sample
			Object.entries(history).forEach(([key, value]) => { // eslint-disable-line no-loop-func
				if (key === "date") {
					// Parses the date of the sample and use the last one if something wrong happens
					const newDate = getImportDate(value, lastDate);
					lastDate = newDate;
					history[key] = new Date(`${newDate[1]}/${newDate[0]}/${newDate[2]}`);
				} else if (!isCellValid(value)) {
					history[key] = null;
				} else if (key !== "campaigns") {
					// if string is not empty, remove all dots and commas to avoid
					// real numbers
					history[key] = getImportNumber(value);
				}
			});

			actors[name].history.push(history);
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
 * Returns an object with Twitter-related queries based on its model
 * @param {object} req - standard request object from the Express library
 * @param {object} res - standard response object from the Express library
 */
const getQueries = (req, res) => {
	digitalMediaCtrl.getQueries(req, res, SOCIAL_MIDIA);
};

/**
 * Search for all registered Twitter accounts of a particular category.
 * @param {object} req - standard request object from the Express library
 * @param {object} res - standard response object from the Express library
 * @return Successfully returns the list with all registered actors;
 * in case of error, inform what happened
 */
const getActors = async (req, res) => {
	const twitterInfo = {
		model: TwitterDB,
		projection: "ID name -_id",
		name: SOCIAL_MIDIA,
	};
	await digitalMediaCtrl.getActors(req, res, twitterInfo);
};

const updateData = async (req, res) => {
	const actorsArray = await TwitterDB.find({});
	const actors = {};
	const promises = [];
	let newActors;
	let dates;

	try {
		const response = await request({	uri: "https://twitter-data-monitor-unb.herokuapp.com/api/actors", json: true });
		newActors = response.actors;
	} catch (e) {
		return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
			error: true,
			description: `Houve um erro ao fazer o pedido de atores no servidor do Monitor de Dados do Twitter: ${e}`,
		});
	}

	const lengthActors = actorsArray.length;
	for (let i = 0; i < lengthActors; i += 1) {
		actors[actorsArray[i].name] = actorsArray[i];
	}

	const lenActorsNew = newActors.length;

	try {
		const response = await request({	uri: "https://twitter-data-monitor-unb.herokuapp.com/api/actors/datetime", json: true });
		dates = response.dates;
		dates.sort();
	} catch (e) {
		return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
			error: true,
			description: `Houve um erro ao fazer o pedido de datas no servidor do Monitor de Dados do Twitter: ${e}`,
		});
	}

	for (let i = 0; i < lenActorsNew; i += 1) {
		if (actors[newActors[i]] === undefined) {
			const newActor = new TwitterDB({
				name: newActors[i],
				ID: newActors[i],
				history: [],
			});
			actors[newActors[i]] = newActor;
		}
		promises.push(updateActor(actors, actors[newActors[i]], dates));
	}
	await Promise.all(promises);
	return res.redirect("/twitter");
};

const updateActor = async (actors, actor, dates) => {
	const name = actor.name;
	if (actors[name].name !== null) {
		const dateMap = {};
		const history = actors[name].history;
		if (history !== undefined) {
			const length = history.length;
			for (let j = 0; j < length; j += 1) {
				dateMap[history[j].date] = 1;
			}
		}
		const lenDates = dates.length;
		const datePromises = [];
		for (let j = 0; j < lenDates; j += 1) {
			const date = dates[j].substring(0, 10);
			const dateArray = date.split("-");
			const dateDate = new Date(`${dateArray[1]}-${dateArray[2]}-${dateArray[0]}`);

			if (dateMap[dateDate] === 1) continue; // eslint-disable-line

			const linkName = name.replace(/ /g, "_");
			const adr = `https://twitter-data-monitor-unb.herokuapp.com/api/actor/${linkName}/${date}`;
			console.log(linkName);
			console.log(date);

			datePromises.push(callUpdateDate(adr, dateDate).then((newHistory) => {
				if (newHistory) actor.history.push(newHistory);
			}).catch(() => { /* console.log(err); */ }));
		}
		await Promise.all(datePromises);
	}
	return actorSavePromise(actor);
};

const actorSavePromise = (actor) => {
	const promise = new Promise((resolve, reject) => {
		actor.save((err) => {
			if (err) reject(err);
			resolve(err);
		});
	});
	return promise;
};

const callUpdateDate = async (url, dateDate) => {
	try {
		const rawHistory = await getHistory(url); // eslint-disable-line
		const keys = [];
		for (key in rawHistory) { // eslint-disable-line
			keys.push(key); // eslint-disable-line
		}
		const newHistory = {};
		newHistory.date = dateDate;
		newHistory.tweets = rawHistory[keys[0]].tweets_count;
		newHistory.followers = rawHistory[keys[0]].followers_count;
		newHistory.following = rawHistory[keys[0]].following_count;
		newHistory.likes = rawHistory[keys[0]].likes_count;
		return newHistory;
	} catch (err) {
		return undefined;
	}
};

const getHistory = async (adr) => {
	const history = await request({	uri: adr, json: true });
	return history;
};

/**
 * Data recovery about a given user
 * @param {object} req - standard request object from the Express library
 * @param {object} res - standard response object from the Express library
 */
const getUser = (req, res) => {
	const twitterInfo = {
		name: SOCIAL_MIDIA,
		queries: "twitterQueries",
	};

	digitalMediaCtrl.getUser(req, res, twitterInfo);
};

/**
 * Data recovery latest about a given user
 * @param {object} req - standard request object from the Express library
 * @param {object} res - standard response object from the Express library
 */
const getLatest = (req, res) => {
	const twitterInfo = {
		name: SOCIAL_MIDIA,
		queries: "twitterQueries",
	};

	digitalMediaCtrl.getLatest(req, res, twitterInfo);
};

/*	Route middlewares */
/**
 * Loads a twitter Account and pass it into the req.account object
 * @param {object} req - standard req object from the Express library
 * @param {object} res - standard res object from the Express library
 * @param {object} next - standard next object from the Express library
 */
const loadAccount = async (req, res, next) => {
	const twitterInfo = {
		model: TwitterDB,
		projection: "-_id -__v",
	};

	return digitalMediaCtrl.loadAccount(req, res, next, twitterInfo);
};

/**
 * Layer to query requested identification
 * @param {object} req - standard request object from the Express library
 * @param {object} res - standard response object from the Express library
 * @param {object} next - standard next function
 * @returns Execution of the next feature, over the history key generated
 */
const setHistoryKey = (req, res, next) => {
	const twiiterInfo = {
		queriesPT: "twitterQueriesPT",
	};

	digitalMediaCtrl.setHistoryKey(req, res, next, twiiterInfo);
};

/*	Methods of abstraction upon response */
/**
 * Acquire the account id from the import base
 * @param {string} idRaw - supposed account username
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
	getQueries,
	getActors,
	updateData,
	getHistory,
	getUser,
	getLatest,
	loadAccount,
	setHistoryKey,
};
