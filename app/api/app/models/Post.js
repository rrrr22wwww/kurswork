// ORM:
const { DataTypes } = require('sequelize');
const database = require('#services/db.service');

const Post = database.define(
	'Post',
	{
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true,
			allowNull: false
		},
		title: {
			type: DataTypes.STRING(255),
			allowNull: false
		},
		description: {
			type: DataTypes.TEXT,
			allowNull: true
		},
		preview_url: {
			type: DataTypes.STRING(255),
			allowNull: true
		},
		body: {
			type: DataTypes.TEXT,
			allowNull: true,
			comment: 'Content of the post'
		},
		creator_user_id: {
			type: DataTypes.UUID, // Changed from INTEGER to UUID to match User.id
			allowNull: false
		},
		status: {
			type: DataTypes.STRING(50), // Assuming status length doesn't exceed 50 characters
			allowNull: true
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
Post.associate = (models) => {
	// Post belongs to User (many-to-one)
	models.Post.belongsTo(models.User, {
		foreignKey: 'creator_user_id',
		as: 'creator'
	});

	// Post belongs to many Categories through PostCategoryTag (many-to-many)
	models.Post.belongsToMany(models.Category, {
		through: models.PostCategoryTag,
		foreignKey: 'post_id',
		as: 'categories'
	});

	// Post belongs to many Tags through PostCategoryTag (many-to-many)
	models.Post.belongsToMany(models.Tag, {
		through: models.PostCategoryTag,
		foreignKey: 'post_id',
		as: 'tags'
	});
};

Post.findById = function(id) {
	return this.findByPk(id);
};

module.exports = Post;
