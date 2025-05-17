// Facades
const categoriesFacade = require('#facades/categories');
const { createOKResponse, createErrorResponse } = require('#factories/responses/api');
module.exports = CategoriesController;

function CategoriesController() {
    const _processError = (error, req, res) => {
        let errorMessage = error?.message ?? 'Internal server error';
        let statusCode = 500;
        switch (error.name) {
            case 'ValidationError':
                errorMessage = error.message || 'Validation error';
                statusCode = 400;
                break;
            case 'CategoryNotFound':
                errorMessage = 'Category not found';
                statusCode = 404;
                break;
            default:
                break;
        }
        return createErrorResponse({ res, error: { message: errorMessage }, status: statusCode });
    };

    const _getAllCategories = async (req, res) => {
        try {
            const categories = await categoriesFacade.getAllCategories();
            return createOKResponse({ res, content: { categories } });
        } catch (error) {
            return _processError(error, req, res);
        }
    };

    const _getCategoryById = async (req, res) => {
        try {
            const categoryId = req.params.id;
            if (!categoryId) {
                const err = new Error('Category ID is required');
                err.name = 'ValidationError';
                throw err;
            }
            const category = await categoriesFacade.getCategoryById(categoryId);
            if (!category) {
                const err = new Error('Category not found');
                err.name = 'CategoryNotFound';
                throw err;
            }
            return createOKResponse({ res, content: { category } });
        } catch (error) {
            return _processError(error, req, res);
        }
    };

    const _createCategory = async (req, res) => {
        try {
            const { name } = req.body;
            if (!name) {
                const err = new Error('Category name is required');
                err.name = 'ValidationError';
                throw err;
            }
            const category = await categoriesFacade.createCategory({ name });
            return createOKResponse({ res, content: { category } });
        } catch (error) {
            return _processError(error, req, res);
        }
    };

    const _updateCategory = async (req, res) => {
        try {
            const categoryId = req.params.id;
            const { name } = req.body;
            if (!name) {
                const err = new Error('Category name is required');
                err.name = 'ValidationError';
                throw err;
            }
            const updatedCategory = await categoriesFacade.updateCategory(categoryId, { name });
            if (!updatedCategory) {
                const err = new Error('Category not found');
                err.name = 'CategoryNotFound';
                throw err;
            }
            return createOKResponse({ res, content: { category: updatedCategory } });
        } catch (error) {
            return _processError(error, req, res);
        }
    };

    const _deleteCategory = async (req, res) => {
        try {
            const categoryId = req.params.id;
            const deleted = await categoriesFacade.deleteCategory(categoryId);
            if (!deleted) {
                const err = new Error('Category not found');
                err.name = 'CategoryNotFound';
                throw err;
            }
            return createOKResponse({ res, content: { deleted: true } });
        } catch (error) {
            return _processError(error, req, res);
        }
    };

    return {
        getAllCategories: _getAllCategories,
        getCategoryById: _getCategoryById,
        createCategory: _createCategory,
        updateCategory: _updateCategory,
        deleteCategory: _deleteCategory
    };
};