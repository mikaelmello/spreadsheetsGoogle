"use strict";
const {google} = require("googleapis");
const ChartjsNode = require("chartjs-node");
const fileName = "frentePopularInstagram.png";
const pathOfFile = __dirname + "/" + fileName;

/**
* Contacts the Google API and generates a token. Returns the path of the 
* chart generated on disk and calls the res object to send the image
* to the browser.
* @param {object} client - client object for authentication with Google
* @param {object} req - standard req object from the Express library
* @param {object} res - standard res object from the Express library
* @returns {String} pathOfFile - path of the chart generated on disk
* @returns {File} outputFile - Promise containing resized image or error
*/
let authenticate = (client,req,res) => {
	const code = req.query.code;
	client.getToken(code, (err, tokens) => {
		if (err) {
			console.error("Error getting oAuth tokens:");
			throw err;
		}
		client.credentials = tokens;
		listCollectives(client)
			.then(collectives => {
				return generateCharts(collectives);
			})
			.then(() => {
				res.sendFile(pathOfFile);
				return pathOfFile;
			});
	});
};

/**
 * Returns data from a given spreadsheeet in JSON format
 * @params {object} auth - auth object generated by Google authentication
 * @returns {Promise} collectivesPromise - Promise object that resolves when rows of Google
 * Spreadsheet's data are collected and fails when the API returns an error 
 */
let listCollectives = (auth) => {
	const collectivesPromise = new Promise(function(resolve, reject) {
		const sheets = google.sheets("v4");
		sheets.spreadsheets.values.get({
			auth: auth,
			spreadsheetId: "1yesZHlR3Mo0qpuH7VTFB8_zyl6p_H-b1khh-wlB3O_Q",
			range: "A:S"
		}, (err, res) => {
			if (err) {
				console.error("The API returned an error.");
				reject(err);
			}
			const rows = res.data.values;
			if (rows.length === 0) {
				console.warn("No data found.");
			} else {
				resolve(rows);
			}
		});
	});
	return collectivesPromise;
};

/**
 * Generates a Pie chart from data collected from the Spreadsheets API. 
 * This example refers to the "Movimento Frente Popular" row in the spreadsheet,
 * and plots the "Tweets","Seguindo","Seguidores" and "Curtidas" column for that
 * organization.
 * @params {object} collectives - JSON object that contains information for social movements
 * @returns {Promise} Promise object that resolves when 
 * the chart's image file is written to disk data are collected and fails when 
 * chartJSNode fails to do so.
 */
let generateCharts = (collectives) => {
  console.log(JSON.stringify(collectives));
	const chartNode = new ChartjsNode(600, 600);
	/* In sequence: Tweets, Seguindo, Seguidores, Curtidas */
	const data = [collectives[2][8], collectives[2][9], collectives[2][10], collectives[2][11]];
	/* INSTAGRAM */
	const label = collectives[0][16];
	const labels = [
		collectives[1][8], // Tweets
		collectives[1][9], // Seguindo
		collectives[1][10], // Seguidores
		collectives[1][11], // Curtidas
	];
	const config = {
		type: "pie",
		data: {
			datasets: [{
				data: data,
				backgroundColor: ["#3e95cd", "#8e5ea2","#3cba9f","#e8c3b9"],
				label: label 
			}],
			labels: labels
		},
		options: {
			responsive: true
		}
	};
	return chartNode.drawChart(config)
		.then(() => {
			// chart is created
			// get image as png buffer
			return chartNode.getImageBuffer("image/png");
		})
		.then(buffer => {
			Array.isArray(buffer); // => true
			// as a stream
			return chartNode.getImageStream("image/png");
		})
		.then(streamResult => {
			// using the length property you can do things like
			// directly upload the image to s3 by using the
			// stream and length properties
			streamResult.stream; // => Stream object
			streamResult.length; // => Integer length of stream
			// write to a file
			return chartNode.writeImageToFile("image/png", pathOfFile);
		});
};

module.exports = {generateCharts, authenticate};