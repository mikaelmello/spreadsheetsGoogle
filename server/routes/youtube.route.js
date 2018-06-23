/*	Required modules */
const express = require("express");
const youtubeCtrl = require("../controllers/youtube.ctrl");
const spreadsheetsCtrl = require("../controllers/spreadsheets.controller");
const digitalMediaCtrl = require("../controllers/digitalMedia.ctrl");
const viewCtrl = require("../controllers/view.ctrl");

/*	Global constants */
const router = express.Router(); // eslint-disable-line new-cap

/**
 * Access to the Youtube data home page.
 * Presentation of all user registered, identified by name.
*/
router.route("/")
	.get(youtubeCtrl.listAccounts);

/**
 * Returns object with Youtube-related queries
*/

router.route("/queries")
	.get(youtubeCtrl.getQueries);

/**
 * Comparison between actors for data on Youtube
 */
router.route("/compare/:query")
	.get(
		digitalMediaCtrl.splitActors,
		youtubeCtrl.loadAccount,
		viewCtrl.getDataset,
		viewCtrl.getChartLimits,
		viewCtrl.getConfigLineChart,
		viewCtrl.plotLineChart,
	);

/**
 *  Inserting all records, redirecting to Youtube main page
 */
router.route("/import")
	.get(
		spreadsheetsCtrl.authenticate,
		spreadsheetsCtrl.setResocieSheet,
		spreadsheetsCtrl.listCollectives,
		youtubeCtrl.importData,
	);

router.route("/update")
	.get(youtubeCtrl.updateData);

/**
 * Access to the data home page of a given user.
 * Presentation of all the data registered.
 */
router.route("/:id")
	.get(youtubeCtrl.getUser);

/**
 * Access to the latest valid data of a given user.
 */
router.route("/latest/:id")
	.get(youtubeCtrl.getLatest);

/**
 * Presentation of the temporal evolution of a given query for a given user.
 */
router.route("/:id/:query")
	.get(
		viewCtrl.getDataset,
		viewCtrl.getChartLimits,
		viewCtrl.getConfigLineChart,
		viewCtrl.plotLineChart,
	);

/**
 * Search for a user in the database
 */
router.param("id", youtubeCtrl.loadAccount);

/**
 * Sets the requested query
 */
router.param("query", youtubeCtrl.setHistoryKey);

module.exports = router;
