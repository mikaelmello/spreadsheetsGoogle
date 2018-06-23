/*	Required modules */
const express = require("express");
const portalCtrl = require("../controllers/portal.ctrl");

/*	Global constants */
const router = express.Router(); // eslint-disable-line new-cap

router.get("/qualquer", (req, res) => {
	const data = {
		texto: "testandi",
		extra: "qualquer coisa",
		// statusCod: httpStatus.ERROR_SPLIT_ACTORS,
	};
	// res.render("qualquer");
	console.log("Passou por aqui");
	// console.log(`Status enviado = ${httpStatus.ERROR_SPLIT_ACTORS}`);
	res.send(data);
});

router.route("/espacoExploratorio")
	.get(portalCtrl.getPlotInitial);

router.get("/espacoExploratorio2", (req, res) => {
	res.render("plot2");
});

router.route("/quemsomos")
	.get(portalCtrl.getDataviz);

router.get("/flexibilidades", (req, res) => {
	res.render("flexibilidades", {
		title: "Flexibilidades",
	});
});

module.exports = router;
