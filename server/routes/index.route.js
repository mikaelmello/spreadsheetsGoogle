const express = require("express");
// const spreadsheetsRoute = require("./spreadsheets.route");
const instagramRoute = require("./instagram.route");
const twitterRoute = require("./twitter.route");
const facebookRoute = require("./facebook.route");
const youtubeRoute = require("./youtube.route");
const portalRoute = require("./portal.route");

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

router.use("/portal", portalRoute);

router.use("/facebook", facebookRoute);

router.use("/twitter", twitterRoute);

router.use("/youtube", youtubeRoute);

router.use("/instagram", instagramRoute);

module.exports = router;
