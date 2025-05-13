// ORM:
const { DataTypes } = require('sequelize');
const database = require('#services/db.service');

const Tag = database.define(
	'Tag',
	{
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true,
			allowNull: false
		},
		name: {
			type: DataTypes.TEXT,
			allowNull: false,
			unique: true // Assuming tag names should be unique
		}
	},
	{
		// Enable automatic 'createdAt' and 'updatedAt' fields
		timestamps: true,
		// Only allow 'soft delete'
		paranoid: true
	}
);

// Static methods:
Tag.associate = (models) => {
	// Tag belongs to many Posts through PostCategoryTag (many-to-many)
	models.Tag.belongsToMany(models.Post, {
		through: models.PostCategoryTag,
		foreignKey: 'tags_id', // Note the pluralization to match DBML
		as: 'posts'
	});
};

Tag.findById = function(id) {
	return this.findByPk(id);
};

module.exports = Tag;
