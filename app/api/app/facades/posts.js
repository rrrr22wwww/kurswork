const { Post, User, Category, Tag, PostCategoryTag } = require('../models');
const { Op } = require('sequelize');
// const { CustomError } = require('../factories/errors');

/**
 * Создает новый пост
 * @param {Object} postData - данные для создания поста
 * @returns {Promise<Object>} - созданный пост
 */
const createPost = async (postData) => {
    try {
        console.log("CREATING POST - postData:", JSON.stringify(postData));
        const post = await Post.create(postData);
        console.log("POST CREATED:", post.id);
        return post;
    } catch (error) {
        console.error('Error in postsFacade.createPost:', error);
        throw error;
    }
};

/**
 * Получает список постов с пагинацией и фильтрацией
 * @param {Object} options - параметры запроса
 * @param {Number} options.page - номер страницы
 * @param {Number} options.limit - количество записей на странице
 * @param {Object} options.filters - фильтры (статус, категория, тег)
 * @returns {Promise<Object>} - объект с постами и общим количеством
 */
const getPosts = async ({ page = 1, limit = 10, filters = {} }) => {
    try {
        const offset = (page - 1) * limit;
        const where = {};
        const include = [];

        // Добавляем информацию о пользователе, создавшем пост
        include.push({
            model: User,
            as: 'creator',
            attributes: ['id', 'username']
        });

        // Применяем фильтр по статусу
        if (filters.status) {
            where.status = filters.status;
        }

        // Если указана категория, добавляем её в includes
        if (filters.category) {
            include.push({
                model: Category,
                as: 'categories',
                through: { attributes: [] }, // Не включаем данные из связующей таблицы
                where: { id: filters.category }
            });
        } else {
            // Иначе просто включаем все категории
            include.push({
                model: Category,
                as: 'categories',
                through: { attributes: [] }
            });
        }

        // Если указан тег, добавляем его в includes
        if (filters.tag) {
            include.push({
                model: Tag,
                as: 'tags',
                through: { attributes: [] },
                where: { id: filters.tag }
            });
        } else {
            // Иначе просто включаем все теги
            include.push({
                model: Tag,
                as: 'tags',
                through: { attributes: [] }
            });
        }

        // Выполняем запрос с учетом всех фильтров
        const { count, rows: posts } = await Post.findAndCountAll({
            where,
            include,
            order: [['createdAt', 'DESC']],
            limit,
            offset,
            distinct: true // Чтобы count считал правильно при наличии JOIN
        });

        return {
            posts,
            total: count
        };
    } catch (error) {
        console.error('Error in postsFacade.getPosts:', error);
        throw error;
    }
};

/**
 * Получает пост по ID
 * @param {Number} id - ID поста
 * @returns {Promise<Object>} - объект поста со связанными данными
 */
const getPostById = async (id) => {
    try {
        const post = await Post.findByPk(id, {
            include: [
                {
                    model: User,
                    as: 'creator',
                    attributes: ['id', 'username']
                },
                {
                    model: Category,
                    as: 'categories',
                    through: { attributes: [] }
                },
                {
                    model: Tag,
                    as: 'tags',
                    through: { attributes: [] }
                }
            ]
        });

        return post;
    } catch (error) {
        console.error(`Error in postsFacade.getPostById(${id}):`, error);
        throw error;
    }
};

/**
 * Обновляет пост
 * @param {Number} id - ID поста
 * @param {Object} postData - данные для обновления
 * @returns {Promise<Object>} - обновленный пост
 */
const updatePost = async (id, postData) => {
    try {
        const post = await Post.findByPk(id);
        
        if (!post) {
            return null;
        }
        
        await post.update(postData);
        
        // Получаем обновленный пост со всеми связанными данными
        return getPostById(id);
    } catch (error) {
        console.error(`Error in postsFacade.updatePost(${id}):`, error);
        throw error;
    }
};

/**
 * Удаляет пост
 * @param {Number} id - ID поста
 * @returns {Promise<Boolean>} - результат удаления
 */
const deletePost = async (id) => {
    try {
        const rowsDeleted = await Post.destroy({
            where: { id }
        });
        
        return rowsDeleted > 0;
    } catch (error) {
        console.error(`Error in postsFacade.deletePost(${id}):`, error);
        throw error;
    }
};

/**
 * Добавляет категорию к посту
 * @param {Number} postId - ID поста
 * @param {Number} categoryId - ID категории
 * @returns {Promise<Object>} - результат операции
 */
const addCategoryToPost = async (postId, categoryId) => {
    try {
        const [post, category] = await Promise.all([
            Post.findByPk(postId),
            Category.findByPk(categoryId)
        ]);
        
        if (!post) throw new Error('Post not found');
        if (!category) throw new Error('Category not found');
        
        const [relation, created] = await PostCategoryTag.findOrCreate({
            where: {
                post_id: postId,
                category_id: categoryId,
                tag_id: null // Убедимся, что это связь с категорией
            }
        });
        
        return { relation, created };
    } catch (error) {
        console.error(`Error in postsFacade.addCategoryToPost(${postId}, ${categoryId}):`, error);
        throw error;
    }
};

/**
 * Удаляет категорию из поста
 * @param {Number} postId - ID поста
 * @param {Number} categoryId - ID категории
 * @returns {Promise<Boolean>} - успешно ли удаление
 */
const removeCategoryFromPost = async (postId, categoryId) => {
    try {
        const deleted = await PostCategoryTag.destroy({
            where: {
                post_id: postId,
                category_id: categoryId,
                tag_id: null // Убедимся, что удаляем связь с категорией
            }
        });
        
        return deleted > 0;
    } catch (error) {
        console.error(`Error in postsFacade.removeCategoryFromPost(${postId}, ${categoryId}):`, error);
        throw error;
    }
};

/**
 * Добавляет тег к посту
 * @param {Number} postId - ID поста
 * @param {Number} tagId - ID тега
 * @returns {Promise<Object>} - результат операции
 */
const addTagToPost = async (postId, tagId) => {
    try {
        const [post, tag] = await Promise.all([
            Post.findByPk(postId),
            Tag.findByPk(tagId)
        ]);
        
        if (!post) throw new Error('Post not found');
        if (!tag) throw new Error('Tag not found');
        
        const [relation, created] = await PostCategoryTag.findOrCreate({
            where: {
                post_id: postId,
                category_id: null, // Убедимся, что это связь с тегом
                tag_id: tagId
            }
        });
        
        return { relation, created };
    } catch (error) {
        console.error(`Error in postsFacade.addTagToPost(${postId}, ${tagId}):`, error);
        throw error;
    }
};

/**
 * Удаляет тег из поста
 * @param {Number} postId - ID поста
 * @param {Number} tagId - ID тега
 * @returns {Promise<Boolean>} - успешно ли удаление
 */
const removeTagFromPost = async (postId, tagId) => {
    try {
        const deleted = await PostCategoryTag.destroy({
            where: {
                post_id: postId,
                category_id: null, // Убедимся, что удаляем связь с тегом
                tag_id: tagId
            }
        });
        
        return deleted > 0;
    } catch (error) {
        console.error(`Error in postsFacade.removeTagFromPost(${postId}, ${tagId}):`, error);
        throw error;
    }
};

/**
 * Получает посты с заданными параметрами поиска
 * @param {String} searchQuery - строка для поиска
 * @param {Object} options - опции поиска (пагинация, фильтры)
 * @returns {Promise<Object>} - найденные посты и общее количество
 */
const searchPosts = async (searchQuery, options = {}) => {
    try {
        const page = options.page || 1;
        const limit = options.limit || 10;
        const offset = (page - 1) * limit;
        
        const where = {
            [Op.or]: [
                { title: { [Op.iLike]: `%${searchQuery}%` } },
                { description: { [Op.iLike]: `%${searchQuery}%` } },
                { body: { [Op.iLike]: `%${searchQuery}%` } }
            ]
        };
        
        // Добавляем фильтр по статусу если нужно
        if (options.status) {
            where.status = options.status;
        }
        
        const { count, rows: posts } = await Post.findAndCountAll({
            where,
            include: [
                {
                    model: User,
                    as: 'creator',
                    attributes: ['id', 'username']
                },
                {
                    model: Category,
                    as: 'categories',
                    through: { attributes: [] }
                },
                {
                    model: Tag,
                    as: 'tags',
                    through: { attributes: [] }
                }
            ],
            order: [['createdAt', 'DESC']],
            limit,
            offset,
            distinct: true
        });
        
        return {
            posts,
            total: count
        };
    } catch (error) {
        console.error(`Error in postsFacade.searchPosts(${searchQuery}):`, error);
        throw error;
    }
};

module.exports = {
    createPost,
    getPosts,
    getPostById,
    updatePost,
    deletePost,
    addCategoryToPost,
    removeCategoryFromPost,
    addTagToPost,
    removeTagFromPost,
    searchPosts
};
