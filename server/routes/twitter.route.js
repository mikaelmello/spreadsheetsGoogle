const express = require("express");
const twitterCtrl = require("../controllers/twitter.controller");
const spreadsheetsCtrl = require("../controllers/spreadsheets.controller");

const viewCtrl = require("../controllers/view.controller");
const geralCtrl = require("../controllers/geral.controller");

const router = express.Router(); // eslint-disable-line new-cap


// / listar todas as contas na db
// /compare-all/likes ou outras paradas pra gerar um grafico comparando todos os atores
// /:username
// /:username/likes ou outras para analisar todas as amostras de um dado

// /import-data

router.route("/")
	.get(twitterCtrl.listAccounts);

router.route("/compare/:query")
	.get(
		geralCtrl.splitActors,
		twitterCtrl.loadAccount,
		viewCtrl.getDataset,
		viewCtrl.getChartLimits,
		viewCtrl.getConfigLineChart,
		viewCtrl.plotLineChart,
	);

router.route("/import")
	.get(
		spreadsheetsCtrl.authenticate,
		spreadsheetsCtrl.setResocieSheet,
		spreadsheetsCtrl.listCollectives,
		twitterCtrl.importData,
	);

router.route("/:username")
	.get(twitterCtrl.getUser);

router.route("/latest/:username")
	.get(twitterCtrl.userLastSample);

router.route("/:username/:query")
	.get(
		viewCtrl.getDataset,
		viewCtrl.getChartLimits,
		viewCtrl.getConfigLineChart,
		viewCtrl.plotLineChart,
	);

router.param("username", twitterCtrl.loadAccount);
router.param("query", twitterCtrl.setSampleKey);

module.exports = router;
