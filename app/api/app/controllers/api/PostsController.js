// Facades:
const postsFacade = require('#facades/posts');
const categoriesFacade = require('#facades/categories');
const tagsFacade = require('#facades/tags');
// Reponse protocols.
const { 
    createOKResponse,
    createErrorResponse
} = require('#factories/responses/api');
// Custom error.
const { Err } = require('#factories/errors');
// Multer for file uploads
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../../../public/uploads/images/posts');
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `post-${uniqueSuffix}${ext}`);
    }
});

// Create multer upload instance
const upload = multer({ 
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        // Проверка расширения файла
        const allowedExtensions = /\.(jpeg|jpg|png|gif|webp)$/i;
        const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
        
        // Проверка MIME-типа (правильный формат)
        const allowedMimeTypes = /^image\/(jpeg|jpg|png|gif|webp)$/i;
        const mimetype = allowedMimeTypes.test(file.mimetype);
        
        console.log('File info:', {
            originalname: file.originalname,
            mimetype: file.mimetype,
            extname_valid: extname,
            mimetype_valid: mimetype
        });
        
        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Поддерживаются только изображения (jpeg, jpg, png, gif, webp)'));
        }
    }
});

module.exports = PostsController;

function PostsController() {

    // Обработка ошибок
    const _processError = (error, req, res) => {
        // Default error message.
        let errorMessage = error?.message ?? 'Internal server error';
        // Default HTTP status code.
        let statusCode = 500;

        switch(error.name) {
            case('ValidationError'):
                statusCode = 400;
                break;
            case('PostNotFound'):
                statusCode = 404;
                break;
            case('Unauthorized'):
                statusCode = 401;
                break;
            case('FileError'):
                statusCode = 400;
                break;
            // Perform your custom processing here...
            default:
                break;
        }

        // Send error response with provided status code.
        return createErrorResponse({
            res, 
            error: {
                message: errorMessage
            },
            status: statusCode
        });
    };

    // Middleware для обработки загрузки файлов
    const _uploadMiddleware = (req, res, next) => {
        try {
            console.log('UPLOAD MIDDLEWARE CALLED');
            console.log('METHOD:', req.method, 'URL:', req.originalUrl);
            console.log('Content-Type:', req.headers['content-type']);
            
            // Обрабатываем только multipart/form-data
            if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
                upload.single('image')(req, res, (err) => {
                    if (err) {
                        console.error('File upload error in middleware:', err);
                        return _processError({
                            name: 'FileError',
                            message: err.message || 'Ошибка загрузки файла'
                        }, req, res);
                    }
                    next();
                });
            } else {
                // Если запрос не содержит файлов, просто пропускаем
                next();
            }
        } catch (error) {
            console.error('Error in upload middleware:', error);
            return _processError(error, req, res);
        }
    };

    // Получение доступа к посту (проверка прав)
    const _validatePostAccess = async (postId, userId, userRole) => {
        if (!postId) {
            const err = new Error("ID поста не указан");
            err.name = "ValidationError";
            throw err;
        }

        const post = await postsFacade.getPostById(postId);
        
        if (!post) {
            const err = new Error("Пост не найден");
            err.name = "PostNotFound";
            throw err;
        }
        
        if (post.creator_user_id !== userId && userRole !== 'admin') {
            const err = new Error("У вас нет прав для редактирования этого поста");
            err.name = "Unauthorized";
            throw err;
        }
        
        return post;
    };

    // Создание поста
    const _createPost = async (req, res) => {
        try {
            console.log('CREATE POST METHOD CALLED');
            console.log('METHOD:', req.method, 'URL:', req.originalUrl);
            console.log('BODY:', req.body);
            console.log('FILE:', req.file);

            // Получаем данные из тела запроса
            const { title, description, body, status, categories, tags } = req.body;
            
            // Проверяем обязательные поля
            if (!title) {
                const err = new Error("Заголовок поста обязателен");
                err.name = "ValidationError";
                throw err;
            }

            // Получаем ID пользователя из токена
            const userId = req.token?.id;
            
            if (!userId) {
                const err = new Error("ID пользователя не найден в токене");
                err.name = "Unauthorized";
                throw err;
            }

            // Создаем объект с данными поста
            const postData = {
                title,
                description,
                body,
                status: status || 'draft',
                creator_user_id: userId
            };

            // Если загружен файл, добавляем путь к нему
            if (req.file) {
                // Создаем URL для доступа к изображению
                const fileName = req.file.filename;
                postData.preview_url = `/uploads/images/posts/${fileName}`;
            }

            // Создаем пост
            const post = await postsFacade.createPost(postData);

            // Если указаны категории, добавляем их к посту
            if (categories) {
                const categoryIds = Array.isArray(categories) 
                    ? categories 
                    : categories.split(',').map(id => id.trim());
                
                for (const categoryId of categoryIds) {
                    try {
                        await postsFacade.addCategoryToPost(post.id, categoryId);
                    } catch (err) {
                        console.error(`Ошибка при добавлении категории ${categoryId} к посту:`, err);
                        // Продолжаем добавлять остальные категории
                    }
                }
            }

            // Если указаны теги, добавляем их к посту
            if (tags) {
                const tagIds = Array.isArray(tags) 
                    ? tags 
                    : tags.split(',').map(id => id.trim());
                
                for (const tagId of tagIds) {
                    try {
                        await postsFacade.addTagToPost(post.id, tagId);
                    } catch (err) {
                        console.error(`Ошибка при добавлении тега ${tagId} к посту:`, err);
                        // Продолжаем добавлять остальные теги
                    }
                }
            }

            // Получаем пост со всеми связанными данными
            const createdPost = await postsFacade.getPostById(post.id);

            // Отправляем успешный ответ
            return createOKResponse({
                res,
                content: {
                    post: createdPost
                }
            });
        } catch (error) {
            console.error("PostsController._createPost error: ", error);
            return _processError(error, req, res);
        }
    };

    // Получение списка всех постов
    const _getAllPosts = async (req, res) => {
        try {
            // Получаем параметры запроса
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            
            // Фильтры
            const filters = {};
            
            // Фильтр по статусу
            if (req.query.status) {
                filters.status = req.query.status;
            }
            
            // Фильтр по категории
            if (req.query.category) {
                filters.category = req.query.category;
            }
            
            // Фильтр по тегу
            if (req.query.tag) {
                filters.tag = req.query.tag;
            }

            // Получаем посты
            const { posts, total } = await postsFacade.getPosts({ page, limit, filters });

            // Отправляем успешный ответ
            return createOKResponse({
                res,
                content: {
                    posts,
                    pagination: {
                        total,
                        page,
                        limit,
                        pages: Math.ceil(total / limit)
                    }
                }
            });
        } catch (error) {
            console.error("PostsController._getAllPosts error: ", error);
            return _processError(error, req, res);
        }
    };

    // Получение поста по ID
    const _getPostById = async (req, res) => {
        try {
            // Проверяем наличие ID
            const postId = req.params.id;
            
            if (!postId) {
                const err = new Error("ID поста не указан");
                err.name = "ValidationError";
                throw err;
            }

            // Получаем пост
            const post = await postsFacade.getPostById(postId);
            
            if (!post) {
                const err = new Error("Пост не найден");
                err.name = "PostNotFound";
                throw err;
            }

            // Отправляем успешный ответ
            return createOKResponse({
                res,
                content: {
                    post
                }
            });
        } catch (error) {
            console.error("PostsController._getPostById error: ", error);
            return _processError(error, req, res);
        }
    };

    // Обновление поста
    const _updatePost = async (req, res) => {
        try {
            // Получаем ID поста из параметров
            const postId = req.params.id;
            
            // Получаем ID пользователя из токена
            const userId = req.token?.id;
            const userRole = req.token?.role || 'user';
            
            // Проверяем права доступа
            const post = await _validatePostAccess(postId, userId, userRole);
            
            // Получаем данные для обновления из тела запроса
            const { title, description, body, status, categories, tags } = req.body;
            
            // Создаем объект с данными для обновления
            const postData = {
                title,
                description,
                body,
                status
            };
            
            // Удаляем undefined поля
            Object.keys(postData).forEach(
                key => postData[key] === undefined && delete postData[key]
            );
            
            // Если загружен новый файл, обновляем preview_url
            if (req.file) {
                const fileName = req.file.filename;
                postData.preview_url = `/uploads/images/posts/${fileName}`;
                
                // Если был старый файл, удаляем его
                if (post.preview_url) {
                    try {
                        const oldFilePath = path.join(__dirname, '../../../../public', post.preview_url);
                        if (fs.existsSync(oldFilePath)) {
                            fs.unlinkSync(oldFilePath);
                        }
                    } catch (err) {
                        console.error('Error deleting old file:', err);
                    }
                }
            }
            
            // Обновляем пост
            const updatedPost = await postsFacade.updatePost(postId, postData);
            
            // Обновляем категории, если указаны
            if (categories !== undefined) {
                // TODO: Реализовать обновление категорий
                // Это требует удаления существующих связей и создания новых
            }
            
            // Обновляем теги, если указаны
            if (tags !== undefined) {
                // TODO: Реализовать обновление тегов
                // Это требует удаления существующих связей и создания новых
            }
            
            // Отправляем успешный ответ
            return createOKResponse({
                res,
                content: {
                    post: updatedPost
                }
            });
        } catch (error) {
            console.error("PostsController._updatePost error: ", error);
            return _processError(error, req, res);
        }
    };

    // Удаление поста
    const _deletePost = async (req, res) => {
        try {
            // Получаем ID поста из параметров
            const postId = req.params.id;
            
            // Получаем ID пользователя из токена
            const userId = req.token?.id;
            const userRole = req.token?.role || 'user';
            
            // Проверяем права доступа
            const post = await _validatePostAccess(postId, userId, userRole);
            
            // Удаляем пост
            const deleted = await postsFacade.deletePost(postId);
            
            // Если был файл изображения, удаляем его
            if (post.preview_url) {
                try {
                    const filePath = path.join(__dirname, '../../../../public', post.preview_url);
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }
                } catch (err) {
                    console.error('Error deleting file:', err);
                }
            }
            
            // Отправляем успешный ответ
            return createOKResponse({
                res,
                content: {
                    deleted,
                    message: 'Пост успешно удален'
                }
            });
        } catch (error) {
            console.error("PostsController._deletePost error: ", error);
            return _processError(error, req, res);
        }
    };

    // Добавление категории к посту
    const _addCategoryToPost = async (req, res) => {
        try {
            // Получаем ID поста и ID категории из параметров
            const postId = req.params.postId;
            const categoryId = req.params.categoryId;
            
            // Получаем ID пользователя из токена
            const userId = req.token?.id;
            const userRole = req.token?.role || 'user';
            
            // Проверяем права доступа
            await _validatePostAccess(postId, userId, userRole);
            
            // Добавляем категорию к посту
            const result = await postsFacade.addCategoryToPost(postId, categoryId);
            
            // Отправляем успешный ответ
            return createOKResponse({
                res,
                content: {
                    ...result,
                    message: result.created 
                        ? 'Категория успешно добавлена к посту' 
                        : 'Категория уже была добавлена к посту'
                }
            });
        } catch (error) {
            console.error("PostsController._addCategoryToPost error: ", error);
            return _processError(error, req, res);
        }
    };

    // Удаление категории из поста
    const _removeCategoryFromPost = async (req, res) => {
        try {
            // Получаем ID поста и ID категории из параметров
            const postId = req.params.postId;
            const categoryId = req.params.categoryId;
            
            // Получаем ID пользователя из токена
            const userId = req.token?.id;
            const userRole = req.token?.role || 'user';
            
            // Проверяем права доступа
            await _validatePostAccess(postId, userId, userRole);
            
            // Удаляем категорию из поста
            const result = await postsFacade.removeCategoryFromPost(postId, categoryId);
            
            // Отправляем успешный ответ
            return createOKResponse({
                res,
                content: {
                    success: result,
                    message: result 
                        ? 'Категория успешно удалена из поста' 
                        : 'Категория не была связана с этим постом'
                }
            });
        } catch (error) {
            console.error("PostsController._removeCategoryFromPost error: ", error);
            return _processError(error, req, res);
        }
    };

    // Добавление тега к посту
    const _addTagToPost = async (req, res) => {
        try {
            // Получаем ID поста и ID тега из параметров
            const postId = req.params.postId;
            const tagId = req.params.tagId;
            
            // Получаем ID пользователя из токена
            const userId = req.token?.id;
            const userRole = req.token?.role || 'user';
            
            // Проверяем права доступа
            await _validatePostAccess(postId, userId, userRole);
            
            // Добавляем тег к посту
            const result = await postsFacade.addTagToPost(postId, tagId);
            
            // Отправляем успешный ответ
            return createOKResponse({
                res,
                content: {
                    ...result,
                    message: result.created 
                        ? 'Тег успешно добавлен к посту' 
                        : 'Тег уже был добавлен к посту'
                }
            });
        } catch (error) {
            console.error("PostsController._addTagToPost error: ", error);
            return _processError(error, req, res);
        }
    };

    // Удаление тега из поста
    const _removeTagFromPost = async (req, res) => {
        try {
            // Получаем ID поста и ID тега из параметров
            const postId = req.params.postId;
            const tagId = req.params.tagId;
            
            // Получаем ID пользователя из токена
            const userId = req.token?.id;
            const userRole = req.token?.role || 'user';
            
            // Проверяем права доступа
            await _validatePostAccess(postId, userId, userRole);
            
            // Удаляем тег из поста
            const result = await postsFacade.removeTagFromPost(postId, tagId);
            
            // Отправляем успешный ответ
            return createOKResponse({
                res,
                content: {
                    success: result,
                    message: result 
                        ? 'Тег успешно удален из поста' 
                        : 'Тег не был связан с этим постом'
                }
            });
        } catch (error) {
            console.error("PostsController._removeTagFromPost error: ", error);
            return _processError(error, req, res);
        }
    };

    // Поиск постов
    const _searchPosts = async (req, res) => {
        try {
            // Получаем строку поиска из параметров запроса
            const query = req.query.q;
            
            if (!query) {
                const err = new Error("Строка поиска не указана");
                err.name = "ValidationError";
                throw err;
            }
            
            // Получаем параметры пагинации
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            
            // Опции поиска
            const options = {
                page,
                limit
            };
            
            // Добавляем фильтр по статусу, если указан
            if (req.query.status) {
                options.status = req.query.status;
            }
            
            // Выполняем поиск
            const { posts, total } = await postsFacade.searchPosts(query, options);
            
            // Отправляем успешный ответ
            return createOKResponse({
                res,
                content: {
                    posts,
                    pagination: {
                        total,
                        page,
                        limit,
                        pages: Math.ceil(total / limit)
                    }
                }
            });
        } catch (error) {
            console.error("PostsController._searchPosts error: ", error);
            return _processError(error, req, res);
        }
    };

    // Загрузка изображения без создания поста
    const _uploadImage = async (req, res) => {
        try {
            if (!req.file) {
                const err = new Error("Файл не загружен");
                err.name = "FileError";
                throw err;
            }
            
            // Создаем URL для доступа к изображению
            const fileName = req.file.filename;
            const imageUrl = `/uploads/images/posts/${fileName}`;
            
            // Отправляем успешный ответ с URL изображения
            return createOKResponse({
                res,
                content: {
                    url: imageUrl,
                    filename: fileName,
                    message: 'Изображение успешно загружено'
                }
            });
        } catch (error) {
            console.error("PostsController._uploadImage error: ", error);
            return _processError(error, req, res);
        }
    };

    // Удаление изображения
    const _deleteImage = async (req, res) => {
        try {
            const { filename } = req.body;
            
            if (!filename) {
                const err = new Error("Имя файла не указано");
                err.name = "ValidationError";
                throw err;
            }
            
            // Путь к файлу
            const filePath = path.join(__dirname, '../../../../public/uploads/images/posts', filename);
            
            // Проверяем существование файла
            if (!fs.existsSync(filePath)) {
                const err = new Error("Файл не найден");
                err.name = "FileError";
                throw err;
            }
            
            // Удаляем файл
            fs.unlinkSync(filePath);
            
            // Отправляем успешный ответ
            return createOKResponse({
                res,
                content: {
                    deleted: true,
                    message: 'Изображение успешно удалено'
                }
            });
        } catch (error) {
            console.error("PostsController._deleteImage error: ", error);
            return _processError(error, req, res);
        }
    };

    return {
        // Middleware для загрузки файлов
        uploadMiddleware: _uploadMiddleware,
        
        // CRUD операции с постами
        createPost: _createPost,
        getAllPosts: _getAllPosts,
        getPostById: _getPostById,
        updatePost: _updatePost,
        deletePost: _deletePost,
        
        // Операции с категориями и тегами
        addCategoryToPost: _addCategoryToPost,
        removeCategoryFromPost: _removeCategoryFromPost,
        addTagToPost: _addTagToPost,
        removeTagFromPost: _removeTagFromPost,
        
        // Поиск и работа с изображениями
        searchPosts: _searchPosts,
        uploadImage: _uploadImage,
        deleteImage: _deleteImage
    };
}