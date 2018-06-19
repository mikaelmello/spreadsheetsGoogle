const mongoose = require("mongoose");

const sampleSchema = {
	date: {
		type: Date,
		required: true,
	},
	tweets: {
		type: Number,
	},
	followers: {
		type: Number,
	},
	following: {
		type: Number,
	},
	likes: {
		type: Number,
	},
	moments: {
		type: Number,
	},
	campaigns: {
		type: [String],
		default: [],
	},
};

const twitterAccountSchema = new mongoose.Schema({
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
		type: [sampleSchema],
		default: [],
	},
});

module.exports = mongoose.model("twitterAccount", twitterAccountSchema, "twitterAccount");
