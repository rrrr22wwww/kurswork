// ORM:
const { DataTypes } = require('sequelize');
const database = require('#services/db.service');

// Password hasher.
const bcryptSevice = require('#services/bcrypt.service');


const User = database.define(
	'User',
	{
		id: { // Added to match DBML
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true,
			allowNull: false
		},
		username: { // Renamed from email to match DBML
			type: DataTypes.STRING(255),
			unique: true,
			allowNull: false
		},
		password: { // This field stores the hash after the hook runs; type changed to TEXT
			type: DataTypes.TEXT,
			allowNull: false
		},
		role: { // Added to match DBML
			type: DataTypes.STRING,
			allowNull: true // Set to false and add defaultValue if role is mandatory
		},
	},
	{
		// Enable automatic 'createdAt' and 'updatedAt' fields.
		timestamps: true,
		// Only allow 'soft delete'
		// (set of 'deletedAt' field, insted of the real deletion).
		paranoid: true
	}
);

// Hooks:
User.beforeValidate((user) => {
	// Hash user's password.
	// This hook assumes 'user.password' contains the plain text password at this stage,
	// and bcryptSevice.hashPassword(user) correctly extracts and hashes it,
	// returning the hash to be stored back in the 'password' field.
	user.password = bcryptSevice.hashPassword(user);
})
// Hooks\

// Static methods:
User.associate = (models) => {
	models.User.hasMany(models.DisabledRefreshToken, {
		foreignKey: 'UserId', // Ensure DisabledRefreshToken.UserId is also UUID if User.id is UUID
		as: 'disabledRefreshTokens'
	});
}

User.findById = function(id) {
	return this.findByPk(id);
}

User.findOneByUsername = function(username) { // Renamed from findOneByEmail
	const query = {
		where: {
			username // Changed from email
		}
	};
	return this.findOne(query);
}
// Static methods\

// Instance methods:
User.prototype.toJSON = function() {
	const values = { ...this.get() };
	delete values.password;
	return values;
}
// Instance methods\

module.exports = User;
