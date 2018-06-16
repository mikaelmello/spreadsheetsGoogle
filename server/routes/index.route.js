const express = require("express");
// const spreadsheetsRoute = require("./spreadsheets.route");
const instagramRoute = require("./instagram.route");
const twitterRoute = require("./twitter.route");
const facebookRoute = require("./facebook.route");
const youtubeRoute = require("./youtube.route");
const ResocieObs = require("../../config/resocie.json").observatory;
const httpStatus = require("../../config/resocie.json").httpStatus;

const router = express.Router();

// router.use("/", spreadsheetsRoute);

router.get("/", (req, res) => {
	const linkMap = {
		error: false,
		links: [
			{
				rel: "social-network-facebook",
				href: `${req.protocol}://${req.get("host")}/facebook/`,
			},
			{
				rel: "social-network-instagram",
				href: `${req.protocol}://${req.get("host")}/instagram/`,
			},
			{
				rel: "social-network-twitter",
				href: `${req.protocol}://${req.get("host")}/twitter/`,
			},
			{
				rel: "social-network-youtube",
				href: `${req.protocol}://${req.get("host")}/youtube/`,
			},
		],
	};

	const showcase = [{
		img: "/imagens/vitrine_0_midia.svg",
		alt: "Opção de Mídia Digital",
		description: "Pode-se selecionar uma ou mais das nossas mídias disponíveis",
	}, {
		img: "/imagens/vitrine_1_atores.svg",
		alt: "Opção de Atores",
		description: "Pode-se selecionar um ou mais das nossos atores disponíveis",
	}, {
		img: "/imagens/vitrine_2_caracteristica.svg",
		alt: "Opção de Características",
		description: "Pode-se selecionar uma ou mais das características numa mídia digital",
	}];

	res.render("index", {
		linkMap: linkMap,
		showcase: showcase,
	});
});

router.get("/qualquer", (req, res) => {
	const data = {
		texto: "testandi",
		extra: "qualquer coisa",
		statusCod: httpStatus.ERROR_SPLIT_ACTORS,
	};
	// res.render("qualquer");
	console.log("Passou por aqui");
	console.log(`Status enviado = ${httpStatus.ERROR_SPLIT_ACTORS}`);
	res.send(data);
});

router.get("/espacoExploratorio", (req, res) => {
	const socialMedia = ResocieObs.socialMidia;
	const medias = [];

	for (midia in socialMedia) {					// eslint-disable-line
		const aux = socialMedia[midia];				// eslint-disable-line
		const list = {
			lower: aux,
			upper: capitalize(aux),
		};

		medias.push(list);
	}

	res.render("plot", { medias });
});

router.get("/espacoExploratorio2", (req, res) => {
	res.render("plot2");
});

// mount facebook routes at /facebook
router.use("/facebook", facebookRoute);

// mount twitter routes at /twitter
router.use("/twitter", twitterRoute);

// mount youtube routes at /youtube
router.use("/youtube", youtubeRoute);

router.use("/instagram", instagramRoute);

const capitalize = (str) => {
	return str.replace(/\b\w/g, l => l.toUpperCase()); // eslint-disable-line
};

module.exports = router;
