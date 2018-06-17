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

router.get("/quemsomos", (req, res) => {
	const developers = [
		{
			name: "Rodrigo Ferreira Guimarães",
			text: "Estudante de Engenharia de Computação pela Universidade de Brasília. Tem interesse pela área educacional. ",
			github: "https://github.com/rodrigofegui",
			cv: "http://lattes.cnpq.br/9277938174017919",
			img: "/imagens/Rodrigo.jpg",
		},
	];
	res.render("quemSomos", {
		title: "Quem Somos",
		developers: developers,
	});
});

router.get("/flexibilidades", (req, res) => {
	res.render("flexibilidades", {
		title: "Flexibilidades",
	});
});

module.exports = router;
