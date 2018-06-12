const express = require("express");
const youtubeCtrl = require("../controllers/youtube.controller");
const spreadsheetsCtrl = require("../controllers/spreadsheets.controller");

const router = express.Router(); // eslint-disable-line new-cap

// Lista todas as contas de user youtube
router.route("/")
	.get(youtubeCtrl.listAccounts);

router.route("/compare/:query")
	.get(
		youtubeCtrl.splitActors,
		youtubeCtrl.loadAccount,
		youtubeCtrl.getDataset,
		youtubeCtrl.getChartLimits,
		youtubeCtrl.drawLineChart,
	);
// Importa os dados da tabela para o banco de dados -> youtube/import
router.route("/import")
	.get(
		spreadsheetsCtrl.authenticate,
		spreadsheetsCtrl.setResocieSheet,
		spreadsheetsCtrl.listCollectives,
		youtubeCtrl.importData,
	);

router.route("/update")
	.get(youtubeCtrl.updateData);

// Lista os dados de um usuario especifico
router.route("/:id")
	.get(youtubeCtrl.getUser);

/**
 * Access to the latest valid data of a given user.
 */
router.route("/latest/:id")
	.get(youtubeCtrl.getLatest);

// Mostra o gráfico de um atributo especifico de um usuario Ex. /youtube/Joao/videos
router.route("/:id/:query")
	.get(
		youtubeCtrl.getDataset,
		youtubeCtrl.getChartLimits,
		youtubeCtrl.drawLineChart,
	);

router.param("id", youtubeCtrl.loadAccount);

router.param("query", youtubeCtrl.setHistoryKey);

module.exports = router;
