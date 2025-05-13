console.log('[configs/database.js] Reading DB environment variables:');
console.log('[configs/database.js] DB_NAME:', process.env.DB_NAME);
console.log('[configs/database.js] DB_USER:', process.env.DB_USER);
console.log('[configs/database.js] DB_PASSWORD exists:', !!process.env.DB_PASSWORD); // Log existence, not the value
console.log('[configs/database.js] DB_HOST:', process.env.DB_HOST);
console.log('[configs/database.js] DB_PORT:', process.env.DB_PORT);
console.log('[configs/database.js] DB_DIALECT:', process.env.DB_DIALECT);

module.exports = {
	database: process.env.DB_NAME,
	username: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	host: process.env.DB_HOST ?? 'localhost',
	port: process.env.DB_PORT ?? '5432',
	dialect: process.env.DB_DIALECT ?? 'postgres',

	pool: {
		max: 5,
		min: 0,
		idle: 10000,
	},
	timestamps: true,
	logging: console.log // Ensure Sequelize logging is on
};