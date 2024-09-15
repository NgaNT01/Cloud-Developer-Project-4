import 'source-map-support/register'
import * as uuid from 'uuid'
import { createLogger } from '../utils/logger';
import { createTodoItem, deleteTodo, getTodoItem, getTodoItems, updateAttachmentUrl, updateTodoItem } from '../dataLayer/todosAccess';
import { getAttachmentUrl, getUploadUrl } from '../fileStorage/attachmentUtils';

const logger = createLogger('todos')

export const getTodos = async (userId) => {
    logger.info(`businessLogic: Get all TODO item for user ${userId}`);
    return await getTodoItems(userId);
}

export const createTodo = async (userId, createTodoRequest) => {
    const todoId = uuid.v4();

    const newTodoItem = {
        userId,
        todoId,
        createdAt: new Date().toISOString(),
        done: false,
        attachmentUrl: null,
        ...createTodoRequest
    }

    logger.info(`businessLogic: Create TODO item for ${todoId}, user ${userId}, data: ${JSON.stringify(newTodoItem)}`);
    await createTodoItem(newTodoItem);

    return newTodoItem;
}

export const updateTodo = async (userId, todoId, updateTodoRequest) => {
    logger.info(`businessLogic: Update TODO item for: ${todoId}, user: ${userId}`);
    const item = await getTodoItem(todoId, userId);
    if (!item) {
        throw new Error('Item not found');
    }
    if (item.userId !== userId) {
        logger.error(`User ${userId} does not have permission to update todo ${todoId}`);
        throw new Error('User is not authorized to update item');
    }
    await updateTodoItem(todoId, updateTodoRequest);
}

export const deleteTodoItem = async (userId, todoId) => {
    logger.info(`businessLogic: Delete TODO item: ${todoId}, user: ${userId}`);
    const item = await getTodoItem(todoId, userId);
    if (!item) {
        throw new Error('Item not found');
    }
    if (item.userId !== userId) {
        logger.error(`User ${userId} does not have permission to delete todo ${todoId}`);
        throw new Error('User is not authorized to delete item');
    }

    await deleteTodo(todoId, userId);
}

export const updateTodoAttachmentUrl = async (userId, todoId, attachmentId) => {
    logger.info(`businessLogic: Create attachment URL for attachment ${attachmentId}`);
    const attachmentUrl = await getAttachmentUrl(attachmentId);

    logger.info(`businessLogic: Update attachment URL for TODO item: ${todoId}, attachment URL: ${attachmentUrl}`);
    const item = await getTodoItem(todoId, userId);
    if (!item) {
        throw new Error('Item not found');
    }
    if (item.userId !== userId) {
        logger.error(`User ${userId} does not have permission to update todo ${todoId}`);
        throw new Error('User is not authorized to update item');
    }

    await updateAttachmentUrl(userId, todoId, attachmentUrl);
}

export const generateUploadUrl = async (attachmentId) => {
    logger.info(`Generating upload URL for attachment ${attachmentId}`);
    return await getUploadUrl(attachmentId);
}