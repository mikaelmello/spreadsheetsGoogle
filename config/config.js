// require and configure dotenv, will load vars in .env in PROCESS.ENV
require("dotenv").config();

const config = {
	env: process.env.NODE_ENV,
	port: process.env.PORT,
	mongo: {
		host: `${process.env.MONGO_HOST}-${process.env.NODE_ENV}`,
		port: process.env.MONGO_PORT,
	},
	web: (process.env.NODE_ENV !== "production") ? undefined : {
		client_id: process.env.CLIENT_ID,
		client_secret: process.env.CLIENT_SECRET
	}
};

module.exports = config;
