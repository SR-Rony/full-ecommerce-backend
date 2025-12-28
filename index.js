// index.js
import dotenv from "dotenv";
import express from "express";
import http from "http";
import morgan from "morgan";
import { MongooseConnectionInstance } from "./src/config/db.js";
import CONFIG from "./src/config/index.js";
import { VersionRoute } from "./src/routes/version.route.js";
// import { attachSocketIO, setupSocketIO } from "./src/socket/socket.js";
import { siteDomains } from "./src/config/constant.js";
import { logger } from "./src/utils/index.js";
import { customLogFormat } from "./src/utils/logger.js";
import { emailToLowerCase } from "./src/middlewares/common/emailLowercase.js";


// Load environment variables from .env file
dotenv.config();

// Initialize Express
const app = express();
const port = CONFIG.LISTEN.PORT;
const server = http.createServer(app);
// const io = setupSocketIO(server);
// app.use(attachSocketIO);
app.set('trust proxy', 1);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan(customLogFormat));

app.use((req, res, next) => {
  const origin = req.get('Origin');
  if (origin) {
    const url = new URL(origin);
    const domain = url.hostname;
    console.log('Domain:', domain);
    if(Object.values(siteDomains).includes(domain)) {
      req.origin = domain;
    } else {
      req.origin = siteDomains.default
      console.log("invalid origin: using default origin.")
    }
  } else {
    req.origin = siteDomains.default
    console.log("origin not provided: using default origin.")
  }
  next();
});


app.get('/favicon.ico', (req, res) => {
  // Send a 204 No Content status code
  return res.status(204).end();
});
// Connect to DB
MongooseConnectionInstance();

// apply email to lowercase logic globally.
app.use(emailToLowerCase);

// Define routes and business logic
VersionRoute(app);

/**
 * Global error handler middleware for express-validator.
 * This middleware checks for validation errors and sends an error response if any are found.
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @param {function} next - The next middleware function.
 */


/**
 * Start the Express server.
 * @param {number} port - The port number on which the server should listen.
 */
server.listen(port, () => {
  logger.info(`Customer Server is running on port ${port}`);
});
