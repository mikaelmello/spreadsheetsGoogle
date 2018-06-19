const mongoose = require("mongoose");

const youtubeChannel = {
	subscribers: {
		type: Number,
	},
	videos: {
		type: Number,
	},
	views: {
		type: Number,
	},
	date: {
		type: Date,
		required: true,
		default: Date.now,
	},
};

const youtubeAccountSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
	},
	category: {
		type: String,
		default: null,
	},
	ID: {
		type: String,
		default: null,
	},
	link: {
		type: String,
		trim: true,
		default: null,
	},
	history: {
		type: [youtubeChannel],
		default: [],
	},
});

module.exports = mongoose.model("youtubeAccount", youtubeAccountSchema, "youtubeAccount");
