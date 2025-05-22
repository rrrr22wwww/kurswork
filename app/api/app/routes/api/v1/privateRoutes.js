module.exports = {
    // --- Пользователи ---
    'GET /users/name': 'UsersController.getFullName',

    // --- Посты ---
    // 'GET /posts': 'PostsController.getAllPosts',
    'POST /posts': 'PostsController.createPost',
    'GET /posts/:id': 'PostsController.getPostById',
    'PUT /posts/:id': 'PostsController.updatePost',
    'DELETE /posts/:id': 'PostsController.deletePost',

    // --- Категории ---
    'GET /categories': 'CategoriesController.getAllCategories',
    'GET /categories/:id': 'CategoriesController.getCategoryById',
    'POST /categories': 'CategoriesController.createCategory',
    'PUT /categories/:id': 'CategoriesController.updateCategory',
    'DELETE /categories/:id': 'CategoriesController.deleteCategory',

    // --- Теги ---
    'GET /tags': 'TagController.getAllTags',
    'GET /tags/:id': 'TagController.getTagById',
    'POST /tags': 'TagController.createTag',
    'PUT /tags/:id': 'TagController.updateTag',
    'DELETE /tags/:id': 'TagController.deleteTag',

    // --- Ассоциации постов с категориями и тегами ---
    'POST /posts/:postId/categories/:categoryId': 'PostsController.addCategoryToPost',
    'DELETE /posts/:postId/categories/:categoryId': 'PostsController.removeCategoryFromPost',
    'POST /posts/:postId/tags/:tagId': 'PostsController.addTagToPost',
    'DELETE /posts/:postId/tags/:tagId': 'PostsController.removeTagFromPost',

    // // --- Загрузка и удаление изображений (если нужно отдельно) ---
    'POST /uploads/images': 'PostsController.uploadImage',
    'DELETE /uploads/images': 'PostsController.deleteImage',
};
