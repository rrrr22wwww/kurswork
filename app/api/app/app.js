/**
 * Main application file:
 */

require('dotenv').config(); // Load environment variables from .env file

// Info about current and allowed environments.
const environments = require('#configs/envinorments');
// Middleware for parsing requests bodies.
const bodyParser = require('body-parser');
// Cookie Parser
const cookieParser = require('cookie-parser');
// Express.
const express = require('express');
const http = require('http');
// Mild security.
const helmet = require('helmet');
// Cross-origin requests middleware.
const cors = require('cors');

// Server configuration:
// ORM.
const DB = require('#services/db.service');
// Port info.
const serverConfig = require('#configs/server');

// Express application.
const app = express();
// HTTP server (Do not use HTTPS, manage TLS with some proxy, like Nginx).
const server = http.Server(app);
// Routes.
const routes = require('#routes/');

// Расширенные настройки CORS вместо базовых
app.use(cors({
  origin: 'http://localhost:3000', // URL вашего фронтенда
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Content-Length'],
  exposedHeaders: ['X-Total-Count', 'X-Pagination-Total-Pages'],
  preflightContinue: false,
  optionsSuccessStatus: 204,
  maxAge: 86400
}));

// Set views path.
app.set('views', __dirname+'/views');
// Set template engine (Pug by default).
app.set('view engine', 'pug');
// Set folder for static contents.
app.use(express.static('public'));

// Secure express app.
app.use(helmet({
	dnsPrefetchControl: false,
	frameguard: false,
	ieNoOpen: false,
}));

// Use Cookie Parser middleware
app.use(cookieParser());

// Parsing the request bodies.
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Setup routes.
app.use(routes({ app }));


// Reference to the active database connection.
let db;

async function _beforeStart() {
	if (environments.allowed.indexOf(environments.current) === -1) {
		console.error(`NODE_ENV is set to ${environments.current}, but only ${environments.allowed.toString()} are valid.`);
		process.exit(1);
	}

	// Start ORM.
	db = await DB.service(environments.current);
	db.start();

	return Promise.resolve();
}

// Initialize server:
_beforeStart()
.then(() => {
	server.listen(serverConfig.port, () => {
		// Server is up!
		console.info(`Server is running on port: ${serverConfig.port}`);
	});
})
.catch((error) => {
	console.error('Could not start server:', error);
});
// Initialize server\

// Handle process errors:
process.on('unhandledRejection', (reason, p) => {
	console.error(reason, 'Unhandled Rejection at Promise', p);
});
	
process.on('uncaughtException', (error) => {
	console.error(error, 'Uncaught Exception thrown');
	
	_gracefulShutdown(true);
});

function _gracefulShutdown(exit=false) {
	console.warn('Received SIGINT or SIGTERM. Shutting down gracefully...');
	const exitCode = exit ? 1 : 0;

	server.close(() => {
		console.info('Closed out remaining connections.');
		process.exit(exitCode);
	});

	// Force stop after 5 seconds:
	setTimeout(() => {
		console.warn('Could not close HTTP connections in time, forcefully shutting down');
		process.exit(exitCode);
	}, 5*1000);
}
// Handle process errors\
