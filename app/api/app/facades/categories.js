const { Category } = require('../models');

/**
 * Получить все категории
 * @param {Object} options - опции запроса
 * @param {Number} options.page - номер страницы (для пагинации)
 * @param {Number} options.limit - количество элементов на странице
 * @returns {Promise<Object>} - результат с категориями и общим количеством
 */
const getAllCategories = async (options = {}) => {
    try {
        const page = options.page || 1;
        const limit = options.limit || 100;
        const offset = (page - 1) * limit;

        const { count, rows: categories } = await Category.findAndCountAll({
            order: [['name', 'ASC']],
            limit,
            offset
        });

        return {
            categories,
            total: count
        };
    } catch (error) {
        console.error('Error in categoriesFacade.getAllCategories:', error);
        throw error;
    }
};

/**
 * Получить категорию по ID
 * @param {Number} id - ID категории
 * @returns {Promise<Object>} - объект категории
 */
const getCategoryById = async (id) => {
    try {
        const category = await Category.findByPk(id);
        return category;
    } catch (error) {
        console.error(`Error in categoriesFacade.getCategoryById(${id}):`, error);
        throw error;
    }
};

/**
 * Создать новую категорию
 * @param {Object} categoryData - данные для создания категории
 * @param {String} categoryData.name - название категории
 * @param {String} categoryData.description - описание категории (опционально)
 * @returns {Promise<Object>} - созданная категория
 */
const createCategory = async (categoryData) => {
    try {
        const category = await Category.create(categoryData);
        return category;
    } catch (error) {
        console.error('Error in categoriesFacade.createCategory:', error);
        throw error;
    }
};

/**
 * Обновить категорию
 * @param {Number} id - ID категории для обновления
 * @param {Object} categoryData - данные для обновления
 * @returns {Promise<Object>} - обновленная категория
 */
const updateCategory = async (id, categoryData) => {
    try {
        const category = await Category.findByPk(id);
        
        if (!category) {
            return null;
        }
        
        await category.update(categoryData);
        return category;
    } catch (error) {
        console.error(`Error in categoriesFacade.updateCategory(${id}):`, error);
        throw error;
    }
};

/**
 * Удалить категорию
 * @param {Number} id - ID категории для удаления
 * @returns {Promise<Boolean>} - успешно ли удаление
 */
const deleteCategory = async (id) => {
    try {
        const rowsDeleted = await Category.destroy({
            where: { id }
        });
        
        return rowsDeleted > 0;
    } catch (error) {
        console.error(`Error in categoriesFacade.deleteCategory(${id}):`, error);
        throw error;
    }
};

module.exports = {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
};