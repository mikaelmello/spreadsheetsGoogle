const ResocieObs = require("../../config/resocie.json").observatory;

const getPlotInitial = (req, res) => {
	const medias = getInitialMedias();
	const categories = getInitialCategories();

	res.render("plot", {
		title: "Espaço Exploratório",
		medias,
		categories,
	});
};

const getInitialMedias = () => {
	const socialMedia = ResocieObs.socialMidia;
	const medias = [];

	/* eslint-disable */
	for (midia in socialMedia) {				
		const aux = socialMedia[midia];
		const list = {
			lower: aux,
			upper: capitalize(aux),
		};

		medias.push(list);
	}
	/* eslint-enable */
	return medias;
};

const getInitialCategories = () => {
	const resocieCategories = ResocieObs.categories;
	const categories = [];

	/* eslint-disable */
	for (category in resocieCategories) {					
		const aux = resocieCategories[category];
		const list = {
			val: category,
			name: capitalize(aux.toLowerCase()),
		};

		categories.push(list);
	}
	/* eslint-enable */
	return categories;
};

const capitalize = (str) => {
	/* eslint-disable */
	str = str.charAt(0).toUpperCase() + str.slice(1);
	str = str.replace(/\s\w/g, l => l.toUpperCase());
	/* eslint-enable */

	return str;
};

module.exports = {
	getPlotInitial,
};
