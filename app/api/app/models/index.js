/*
 * Import all models, that you want to use in application.
 */
const database = require('#services/db.service');

// Импортируем и регистрируем модели
require('./User');
require('./DisabledRefreshToken'); 
require('./Post');
require('./Tag');
require('./Category');
require('./PostCategoryTag');
// Add your models here ...

// Экспортируем инициализированные модели
module.exports = {
    User: database.models.User,
    DisabledRefreshToken: database.models.DisabledRefreshToken,
    Post: database.models.Post,
    Tag: database.models.Tag,
    Category: database.models.Category,
    PostCategoryTag: database.models.PostCategoryTag,
    // Добавить другие модели здесь...
    
    // Экспортируем сам объект database для доступа к sequelize
    database
};