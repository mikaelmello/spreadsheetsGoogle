const express = require("express");
const instagramCtrl = require("../controllers/instagram.ctrl");
const spreadsheetsCtrl = require("../controllers/spreadsheets.controller");
const digitalMediaCtrl = require("../controllers/digitalMedia.ctrl");
const viewCtrl = require("../controllers/view.ctrl");

const router = express.Router(); // eslint-disable-line new-cap

/**
 * Access to the Instagram data home page.
 * Presentation of all user registered, identified by name.
*/
router.route("/")
	.get(instagramCtrl.listAccounts);

/**
 * Returns object with Instagram-related queries
*/

router.route("/queries")
	.get(instagramCtrl.getQueries);

/**
 * Comparison between actors for data on Instagram
 */
router.route("/compare/:query")
	.get(
		digitalMediaCtrl.splitActors,
		instagramCtrl.loadAccount,
		viewCtrl.getDataset,
		viewCtrl.getChartLimits,
		viewCtrl.getConfigLineChart,
		viewCtrl.plotLineChart,
	);

/**
 *  Inserting all records, redirecting to Instagram main page
 */
router.route("/import")
	.get(
		spreadsheetsCtrl.authenticate,
		spreadsheetsCtrl.setResocieSheet,
		spreadsheetsCtrl.listCollectives,
		instagramCtrl.importData,
	);

/**
 * Access to the data home page of a given user.
 * Presentation of all the data registered.
 */
router.route("/:id")
	.get(instagramCtrl.getUser);

/**
 * Access to the latest valid data of a given user.
 */
router.route("/latest/:id")
	.get(instagramCtrl.getLatest);

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
router.param("id", instagramCtrl.loadAccount);

/**
 * Sets the requested query
 */
router.param("query", instagramCtrl.setHistoryKey);

module.exports = router;
