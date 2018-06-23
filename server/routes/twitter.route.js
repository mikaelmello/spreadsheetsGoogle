const express = require("express");
const twitterCtrl = require("../controllers/twitter.ctrl");
const spreadsheetsCtrl = require("../controllers/spreadsheets.controller");
const digitalMediaCtrl = require("../controllers/digitalMedia.ctrl");
const viewCtrl = require("../controllers/view.ctrl");

const router = express.Router(); // eslint-disable-line new-cap

/**
 * Access to the Twitter data home page.
 * Presentation of all user registered, identified by name.
*/
router.route("/")
	.get(twitterCtrl.listAccounts);

/**
 * Returns object with Twiiter-related queries
*/

router.route("/queries")
	.get(twitterCtrl.getQueries);

/**
 * Comparison between actors for data on Twitter
 */
router.route("/compare/:query")
	.get(
		digitalMediaCtrl.splitActors,
		twitterCtrl.loadAccount,
		viewCtrl.getDataset,
		viewCtrl.getChartLimits,
		viewCtrl.getConfigLineChart,
		viewCtrl.plotLineChart,
	);

/**
 *  Inserting all records, redirecting to Twitter main page
 */
router.route("/import")
	.get(
		spreadsheetsCtrl.authenticate,
		spreadsheetsCtrl.setResocieSheet,
		spreadsheetsCtrl.listCollectives,
		twitterCtrl.importData,
	);

router.route("/update")
	.get(twitterCtrl.updateData);

/**
 * Access to the data home page of a given user.
 * Presentation of all the data registered.
 */
router.route("/:id")
	.get(twitterCtrl.getUser);

/**
 * Access to the latest valid data of a given user.
 */
router.route("/latest/:id")
	.get(twitterCtrl.getLatest);

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
router.param("id", twitterCtrl.loadAccount);

/**
 * Sets the requested query
 */
router.param("query", twitterCtrl.setHistoryKey);

module.exports = router;
