// Facades
const tagsFacade = require('#facades/tags');
const { createOKResponse, createErrorResponse } = require('#factories/responses/api');

module.exports = TagController;

function TagController() {
    const _processError = (error, req, res) => {
        let errorMessage = error?.message ?? 'Internal server error';
        let statusCode = 500;
        switch (error.name) {
            case 'ValidationError':
                errorMessage = error.message || 'Validation error';
                statusCode = 400;
                break;
            case 'TagNotFound':
                errorMessage = 'Tag not found';
                statusCode = 404;
                break;
            default:
                break;
        }
        return createErrorResponse({ res, error: { message: errorMessage }, status: statusCode });
    };

    const _getAllTags = async (req, res) => {
        try {
            const tags = await tagsFacade.getAllTags();
            return createOKResponse({ res, content: { tags } });
        } catch (error) {
            return _processError(error, req, res);
        }
    };

    const _getTagById = async (req, res) => {
        try {
            const tagId = req.params.id;
            if (!tagId) {
                const err = new Error('Tag ID is required');
                err.name = 'ValidationError';
                throw err;
            }
            const tag = await tagsFacade.getTagById(tagId);
            if (!tag) {
                const err = new Error('Tag not found');
                err.name = 'TagNotFound';
                throw err;
            }
            return createOKResponse({ res, content: { tag } });
        } catch (error) {
            return _processError(error, req, res);
        }
    };

    const _createTag = async (req, res) => {
        try {
            const { name } = req.body;
            if (!name) {
                const err = new Error('Tag name is required');
                err.name = 'ValidationError';
                throw err;
            }
            const tag = await tagsFacade.createTag({ name });
            return createOKResponse({ res, content: { tag } });
        } catch (error) {
            return _processError(error, req, res);
        }
    };

    const _updateTag = async (req, res) => {
        try {
            const tagId = req.params.id;
            const { name } = req.body;
            if (!name) {
                const err = new Error('Tag name is required');
                err.name = 'ValidationError';
                throw err;
            }
            const updatedTag = await tagsFacade.updateTag(tagId, { name });
            if (!updatedTag) {
                const err = new Error('Tag not found');
                err.name = 'TagNotFound';
                throw err;
            }
            return createOKResponse({ res, content: { tag: updatedTag } });
        } catch (error) {
            return _processError(error, req, res);
        }
    };

    const _deleteTag = async (req, res) => {
        try {
            const tagId = req.params.id;
            const deleted = await tagsFacade.deleteTag(tagId);
            if (!deleted) {
                const err = new Error('Tag not found');
                err.name = 'TagNotFound';
                throw err;
            }
            return createOKResponse({ res, content: { deleted: true } });
        } catch (error) {
            return _processError(error, req, res);
        }
    };

    return {
        getAllTags: _getAllTags,
        getTagById: _getTagById,
        createTag: _createTag,
        updateTag: _updateTag,
        deleteTag: _deleteTag
    };
}
