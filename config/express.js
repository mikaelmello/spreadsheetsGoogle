const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const compress = require("compression");
const methodOverride = require("method-override");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");

const routes = require("../server/routes/index.route");

// Open an http server to accept the oauth callback. In this
// simple example, the only request to our webserver is to
// /oauth2callback?code=<code>
const app = express();

// parse body params and attach them to req.body
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// parse the cookies
app.use(cookieParser());

app.use(compress());
app.use(methodOverride());

// secure apps by setting various HTTP headers
app.use(helmet());

// enable CORS - Cross Origin Resource Sharing
app.use(cors());

// mount all routes on / path
app.use("/", routes);

// Load View Engine
app.set("views", path.join(__dirname, "../views"));
app.set("view engine", "pug");

// Set Public Folder
app.use(express.static(path.join(__dirname, "../public")));

module.exports = app;
