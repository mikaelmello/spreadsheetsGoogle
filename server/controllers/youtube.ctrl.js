/*	Required modules */
/*	Required modules */
const mongoose = require("mongoose");
const request = require("request-promise");
const YoutubeDB = require("../models/youtube.model");
const digitalMediaCtrl = require("./digitalMedia.ctrl");
const HttpStatus = require("../../config/resocie.json").httpStatus;
/*	Media identification */
const SOCIAL_MIDIA = require("../../config/resocie.json").observatory.socialMidia.youtubeMidia;


/*	Route final methods */
/**
 * Search for all registered Youtube accounts.
 * @param {object} req - standard request object from the Express library
 * @param {object} res - standard response object from the Express library
 * @return Successfully returns the list with all registered actors;
 * in case of error, inform what happened
 */
const listAccounts = async (req, res) => {
	const youtubeInfo = {
		model: YoutubeDB,
		projection: "name ID link -_id",
		name: SOCIAL_MIDIA,
	};

	await digitalMediaCtrl.listAccounts(req, res, youtubeInfo);
};

/**
 * Insert YouTube accounts available from spreadsheet to database
 * @param {object} req - standard req object from the Express library
 * @param {object} res - standard res object from the Express library
 * @return {redirect} - redirect for /youtube page if import successful
 */
const importData = async (req, res) => {
	const actorsArray = await YoutubeDB.find({});
	const actors = {};
	const tabs = req.collectives;
	const length = tabs.length;
	const categories = req.sheet.categories;
	const youtubeRange = req.sheet.youtubeRange;
	const nameRow = req.sheet.range.nameRow;
	const dateRow = youtubeRange.dateRow;
	const channelRow = youtubeRange.channelRow;
	const subscribsRow = youtubeRange.subscribsRow;
	const videosRow = youtubeRange.videosRow;
	const viewsRow = youtubeRange.viewsRow;
	let cCategory;
	let lastDate;

	mongoose.connection.collections.youtubeAccount.deleteMany();

	const lengthActors = actorsArray.length;
	for (let i = 0; i < lengthActors; i += 1) {
		actors[actorsArray[i].name] = actorsArray[i];
	}

	for (let i = 0; i < length; i += 1) {
		const cTab = tabs[i];
		const rowsCount = cTab.length;
		cCategory = 0;

		for (let j = 0; j < rowsCount; j += 1) {
			const cRow = cTab[j];

			// se a row for vazia ou a primeira, continua
			if (j < 1 || !(cRow[nameRow])) {
				continue; // eslint-disable-line no-continue
			}

			// Se estivermos na row que indicao o novo tipo, atualiza
			// a string do tipo atual e continua para a próxima row
			if (cRow[nameRow] === categories[cCategory + 1]) {
				cCategory += 1;
				continue; // eslint-disable-line no-continue
			}
			// Se o canal é válido, cria um novo schema para o canal
			const channelUrl = getImportChannelURL(cRow[channelRow]);
			const id = getImportID(channelUrl);
			const name = cRow[nameRow].replace(/\n/g, " ");

			// Caso não exista o usuario atual, cria um novo schema para o usuario
			if (actors[cRow[nameRow]] === undefined) {
				const newAccount = YoutubeDB({
					name: name,
					category: categories[cCategory],
					link: channelUrl,
					ID: id,
				});
				actors[cRow[nameRow]] = newAccount;
			} else if (!actors[cRow[nameRow]].link) {
				actors[cRow[nameRow]].link = channelUrl;
				actors[cRow[nameRow]].ID = id;
			}

			// Se o canal não for null verifica se os inscritos,
			// videos e vizualizações são válidos
			if (channelUrl) {
				for (let k = subscribsRow; k <= viewsRow; k += 1) {
					if (!isCellValid(cRow[k])) cRow[k] = null;
					else cRow[k] = getImportNumber(cRow[k]);
				}

				// Insere a data no schema e caso ocorra erros insera a ultima data
				const newDate = getImportDate(cRow[dateRow], lastDate);
				lastDate = newDate;

				// Define os schemas e adicioana os dados dos atores
				const newHistory = {
					subscribers: cRow[subscribsRow],
					videos: cRow[videosRow],
					views: cRow[viewsRow],
					date: new Date(`${newDate[1]}/${newDate[0]}/${newDate[2]}`),
				};
				let histFound = false;
				for (let k = 0; k < actors[cRow[nameRow]].history.length; k += 1) {
					const sample = actors[cRow[nameRow]].history[k];
					if (sample.date.getTime() === newHistory.date.getTime()) {
						histFound = true;
						break;
					}
				}
				if (histFound === false) {
					actors[cRow[nameRow]].history.push(newHistory);
				}
			}
		}
	}

	const savePromises = [];
	Object.entries(actors).forEach(([cActor]) => {
		savePromises.push(actors[cActor].save());
	});
	await Promise.all(savePromises);

	return res.redirect("/youtube");
};

/**
 * Returns an object with Youtube-related queries based on its model
 * @param {object} req - standard request object from the Express library
 * @param {object} res - standard response object from the Express library
 */
const getQueries = (req, res) => {
	digitalMediaCtrl.getQueries(req, res, SOCIAL_MIDIA);
};

/**
 * Search for all registered Youtube accounts of a particular category.
 * @param {object} req - standard request object from the Express library
 * @param {object} res - standard response object from the Express library
 * @return Successfully returns the list with all registered actors;
 * in case of error, inform what happened
 */
const getActors = async (req, res) => {
	const youtubeInfo = {
		model: YoutubeDB,
		projection: "ID name -_id",
		name: SOCIAL_MIDIA,
	};
	await digitalMediaCtrl.getActors(req, res, youtubeInfo);
};


const updateData = async (req, res) => {
	const actorsArray = await YoutubeDB.find({});
	const actors = {};
	let newActors;
	let dates;

	try {
		const response = await request({	uri: "https://youtube-data-monitor.herokuapp.com/actors", json: true });
		newActors = response.actors;
	} catch (e) {
		return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
			error: true,
			description: `Houve um erro ao fazer o pedido de atores no servidor do Monitor de Dados do Youtube: ${e}`,
		});
	}

	const lengthActors = actorsArray.length;
	for (let i = 0; i < lengthActors; i += 1) {
		actors[actorsArray[i].name] = actorsArray[i];
	}

	const lenActorsNew = newActors.length;

	try {
		const response = await request({	uri: "https://youtube-data-monitor.herokuapp.com/dates", json: true });
		dates = response.dates;
		dates.sort();
	} catch (e) {
		return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
			error: true,
			description: `Houve um erro ao fazer o pedido de datas no servidor do Monitor de Dados do Youtube: ${e}`,
		});
	}

	let ans = "";

	for (let i = 0; i < lenActorsNew; i += 1) {
		if (actors[newActors[i]] === undefined) {
			const newActor = YoutubeDB({
				name: newActors[i],
				channelUrl: `https://youtube.com/channel/${newActors[i]}`,
				history: [],
			});
			actors[newActors[i]] = newActor;
		}
		const name = actors[newActors[i]].name;
		if (actors[name].link !== null) {
			const dateMap = {};
			const history = actors[name].history;
			if (history !== undefined) {
				const length = history.length;
				for (let j = 0; j < length; j += 1) {
					dateMap[history[j].date] = 1;
				}
			}
			const lenDates = dates.length;
			for (let j = 0; j < lenDates; j += 1) {
				const newHistory = {};
				let rawHistory = {};
				const date = dates[j].substring(0, 10);
				const dateArray = date.split("-");
				const dateDate = new Date(`${dateArray[2]}-${dateArray[1]}-${dateArray[0]}`);
				if (dateMap[dateDate] === 1) continue; // eslint-disable-line

				const linkName = name.replace(/ /g, "_");
				const adr = `https://youtube-data-monitor.herokuapp.com/${date}/canal/${linkName}`;

				try {
					// melhorar esse await depois para agilizar o processo
					rawHistory = await getHistory(adr); // eslint-disable-line
					newHistory.date = dateDate;
					newHistory.subscribers = rawHistory.subscribers;
					newHistory.videos = rawHistory.video_count;
					newHistory.views = rawHistory.view_count;
					console.log(name);
					console.log(date);
					console.log(newHistory);
					actors[newActors[i]].history.push(newHistory);
				} catch (e) {
					ans += `Houve um erro ao fazer o pedido de dados no link ${adr} no Monitor de Dados do Youtube: ${e}\n\n`;
				}
			}
		}
	}

	console.log("terminou");

	const savePromises = [];
	Object.entries(actors).forEach(([cActor]) => {
		savePromises.push(actors[cActor].save());
	});
	await Promise.all(savePromises);
	if (ans) {
		return res.status(400).json({
			error: true,
			description: ans,
		});
	}
	return res.redirect("/youtube");
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
	const youtubeInfo = {
		name: SOCIAL_MIDIA,
		queries: "youtubeQueries",
	};

	digitalMediaCtrl.getUser(req, res, youtubeInfo);
};

/**
 * Data recovery latest about a given user
 * @param {object} req - standard request object from the Express library
 * @param {object} res - standard response object from the Express library
 */
const getLatest = (req, res) => {
	const youtubeInfo = {
		name: SOCIAL_MIDIA,
		queries: "youtubeQueries",
	};

	digitalMediaCtrl.getLatest(req, res, youtubeInfo);
};

/*	Route middlewares */
/**
 * Look for a specific registered Youtube account, by id.
 * @param {object} req - standard request object from the Express library
 * @param {object} res - standard response object from the Express library
 * @param {object} next - standard next function
 * @returns Execution of the next feature, over the data found
 */
const loadAccount = async (req, res, next) => {
	const youtubeInfo = {
		model: YoutubeDB,
		projection: "-_id -__v",
	};

	return digitalMediaCtrl.loadAccount(req, res, next, youtubeInfo);
};

/**
 * Layer to query requested identification
 * @param {object} req - standard request object from the Express library
 * @param {object} res - standard response object from the Express library
 * @param {object} next - standard next function
 * @returns Execution of the next feature, over the history key generated
 */
const setHistoryKey = (req, res, next) => {
	const youtubeInfo = {
		queriesPT: "youtubeQueriesPT",
	};

	digitalMediaCtrl.setHistoryKey(req, res, next, youtubeInfo);
};

/*	Methods of abstraction */
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
 * Acquire the channel link from the import base
 * @param {string} channelLink - supposed account link
 */
const getImportChannelURL = (channelLink) => {
	if (isCellValid(channelLink)) return channelLink;

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

	if (id[0] === "channel"
		|| id[0] === "user") {
		id = id[1];
	} else id = id[0];

	return id;
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
	getQueries,
	getActors,
	getUser,
	getLatest,
	loadAccount,
	setHistoryKey,
	isCellValid,
	updateData,
};
