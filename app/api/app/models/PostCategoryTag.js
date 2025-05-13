// ORM:
const { DataTypes } = require('sequelize');
const database = require('#services/db.service');

const PostCategoryTag = database.define(
	'PostCategoryTag',
	{
		post_id: {
			type: DataTypes.UUID,
			allowNull: false,
			references: {
				model: 'Posts', // This is the table name created by Sequelize (plural of model name)
				key: 'id'
			}
		},
		category_id: {
			type: DataTypes.UUID,
			allowNull: true, // Set to allow null to support post-tag without category
			references: {
				model: 'Categories', // This is the table name created by Sequelize (plural of model name)
				key: 'id'
			}
		},
		tags_id: {
			type: DataTypes.UUID,
			allowNull: true, // Set to allow null to support post-category without tag
			references: {
				model: 'Tags', // This is the table name created by Sequelize (plural of model name)
				key: 'id'
			}
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
// PostCategoryTag.associate = (models) => {
// 	// No additional associations needed as this is a junction table
// 	// The connections are defined in Post, Category, and Tag models
// };

module.exports = PostCategoryTag;
