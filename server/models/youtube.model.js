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
	channelUrl: {
		type: String,
		default: null,
	},
	channel: {
		type: String,
		default: null,
	},
	history: {
		type: [youtubeChannel],
		default: [],
	},
});

module.exports = mongoose.model("youtubeAccount", youtubeAccountSchema, "youtubeAccount");
