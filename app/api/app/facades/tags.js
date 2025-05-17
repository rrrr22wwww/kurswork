const { Tag } = require('../models');

/**
 * Получить все теги
 * @param {Object} options - опции запроса
 * @param {Number} options.page - номер страницы (для пагинации)
 * @param {Number} options.limit - количество элементов на странице
 * @returns {Promise<Object>} - результат с тегами и общим количеством
 */
const getAllTags = async (options = {}) => {
    try {
        const page = options.page || 1;
        const limit = options.limit || 100;
        const offset = (page - 1) * limit;

        const { count, rows: tags } = await Tag.findAndCountAll({
            order: [['name', 'ASC']],
            limit,
            offset
        });

        return {
            tags,
            total: count
        };
    } catch (error) {
        console.error('Error in tagsFacade.getAllTags:', error);
        throw error;
    }
};

/**
 * Получить тег по ID
 * @param {Number} id - ID тега
 * @returns {Promise<Object>} - объект тега
 */
const getTagById = async (id) => {
    try {
        const tag = await Tag.findByPk(id);
        return tag;
    } catch (error) {
        console.error(`Error in tagsFacade.getTagById(${id}):`, error);
        throw error;
    }
};

/**
 * Создать новый тег
 * @param {Object} tagData - данные для создания тега
 * @param {String} tagData.name - название тега
 * @returns {Promise<Object>} - созданный тег
 */
const createTag = async (tagData) => {
    try {
        const tag = await Tag.create(tagData);
        return tag;
    } catch (error) {
        console.error('Error in tagsFacade.createTag:', error);
        throw error;
    }
};

/**
 * Обновить тег
 * @param {Number} id - ID тега для обновления
 * @param {Object} tagData - данные для обновления
 * @returns {Promise<Object>} - обновленный тег
 */
const updateTag = async (id, tagData) => {
    try {
        const tag = await Tag.findByPk(id);
        
        if (!tag) {
            return null;
        }
        
        await tag.update(tagData);
        return tag;
    } catch (error) {
        console.error(`Error in tagsFacade.updateTag(${id}):`, error);
        throw error;
    }
};

/**
 * Удалить тег
 * @param {Number} id - ID тега для удаления
 * @returns {Promise<Boolean>} - успешно ли удаление
 */
const deleteTag = async (id) => {
    try {
        const rowsDeleted = await Tag.destroy({
            where: { id }
        });
        
        return rowsDeleted > 0;
    } catch (error) {
        console.error(`Error in tagsFacade.deleteTag(${id}):`, error);
        throw error;
    }
};

module.exports = {
    getAllTags,
    getTagById,
    createTag,
    updateTag,
    deleteTag
};