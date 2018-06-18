const mongoose = require("mongoose");

const nameModel = "instagramAccounts";
const collectionName = "instagramAccount";

/**
 * Modelo da coleção do Instagram para um banco de dados não relacional (MongoDB).
 * Leva em consideração os seguintes aspectos:
 */

const instagramHistory = {
	date: {
		type: Date,
		required: true,
		default: Date.now,
	},
	followers: {
		type: Number,
	},
	following: {
		type: Number,
	},
	num_of_posts: {
		type: Number,
	},
};

const instagramAccountSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
	},
	username: {
		type: String,
		default: null,
	},
	type: {
		type: String,
		default: null,
	},
	link: {
		type: String,
		trim: true,
		default: null,
	},
	history: {
		type: [instagramHistory],
		default: [],
	},
});

module.exports = mongoose.model(nameModel, instagramAccountSchema, collectionName);
