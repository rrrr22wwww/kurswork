// ORM:
const { DataTypes } = require('sequelize');
const database = require('#services/db.service');

const Category = database.define(
	'Category',
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
			unique: true // Assuming category names should be unique
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
Category.associate = (models) => {
	// Category belongs to many Posts through PostCategoryTag (many-to-many)
	models.Category.belongsToMany(models.Post, {
		through: models.PostCategoryTag,
		foreignKey: 'category_id',
		as: 'posts'
	});
};

Category.findById = function(id) {
	return this.findByPk(id);
};

module.exports = Category;
