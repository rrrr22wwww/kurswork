// ORM:
const { DataTypes } = require('sequelize');
const database = require('#services/db.service');


const DisabledRefreshToken = database.define(
	'DisabledRefreshToken',
	{
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true,
			allowNull: false
		},
		token: {
			type: DataTypes.STRING(512),
			required: true,
			allowNull: false,
			unique: true
		},
		token_type: {
			type: DataTypes.STRING(50),
			allowNull: false,
			comment: 'refresh/access/email_verify'
		},
		expires_at: {
			type: DataTypes.DATE,
			allowNull: false
		},
		user_id: {
			type: DataTypes.UUID,
			required: true,
			allowNull: false,
			references: {
				model: 'Users',
				key: 'id'
			}
		}
	},
	{
		// Enable automatic 'createdAt' and 'updatedAt' fields.
		timestamps: true,
		// Only allow 'soft delete'
		// (set of 'deletedAt' field, insted of the real deletion).
		paranoid: true
	}
);

// Static methods:
DisabledRefreshToken.associate = models => {
	models.DisabledRefreshToken.belongsTo(models.User, {
		foreignKey: 'user_id',
		as: 'user'
	});
}

DisabledRefreshToken.createOrFind = function({ token, userId }) {
	const where = {
		token
	};

	const defaults = {
		token: token,
		user_id: userId,
		token_type: 'refresh',
		expires_at: new Date(Date.now() + 60 * 60 * 1000)
	};

	const query = {
		where,
		defaults
	};
	return this.findOrCreate(query);
}

DisabledRefreshToken.selectAll = function({ token }) {
	const where = {
		token
	};
	const query = { where };
	return this.findAll(query);
}
// Static methods\

// Instance methods:
DisabledRefreshToken.prototype.toJSON = function() {
	const values = Object.assign({}, this.get());
	return values;
}
// Instance methods\

module.exports = DisabledRefreshToken;
