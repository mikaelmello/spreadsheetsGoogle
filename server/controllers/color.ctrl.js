const Color = require("color");

const minHue	= 0;
const maxHue	= 360;
const stpHue	= 63;
const minSat	= 58.82;	// 150
const maxSat	= 100.0;	// 255
const minLight	= 29.41;	// 75
const maxLight	= 61.96;	// 158
let lHue;
let cHue;
let cSat;
let cLight;
const WHITE = "#ffffff";
const BLACK = "#000000";

/**
 * Generates a random color
 */
const getColor = () => {
	cHue = newHue();
	cSat = random(minSat, maxSat);
	cLight = random(minLight, maxLight);

	return Color.hsl(cHue, cSat, cLight).hex();
};

/**
 * Checks if the two colors are different enough
 */
const newHue = () => {
	let hue;
	do {
		hue = random(minHue, maxHue);
	} while (Math.abs(hue - lHue) < stpHue);

	lHue = hue;

	return hue;
};

/**
 * Generates a random number, in a given range
 * @param {number} min - minimum value
 * @param {number} max - maximum value
 */
const random = (min = 0, max) => {
	return Math.floor(Math.random() * (max - min)) + min;
};

module.exports = { WHITE, BLACK, getColor };
