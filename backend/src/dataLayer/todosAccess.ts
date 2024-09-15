import 'source-map-support/register'
import * as AWS from 'aws-sdk'
import { createLogger } from '../utils/logger';

const AWSXRay = require('aws-xray-sdk');
const logger = createLogger('todosAccess');
const XAWS = AWSXRay.captureAWS(AWS);
const todosTable = process.env.TODOS_TABLE;
const todosByUserIndex = process.env.TODOS_BY_USER_INDEX;

const createDynamodbClient = () => {
    return new XAWS.DynamoDB.DocumentClient();
};

export const getTodoItems = async (userId) => {
    logger.info(`access: Get all TODO item for user ${userId} from ${todosTable}`)
    const docClient = createDynamodbClient();
    const result = await docClient.query({
        TableName: todosTable,
        IndexName: todosByUserIndex,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
            ':userId': userId
        }
    }).promise();

    const items = result.Items;

    logger.info(`Result: ${items.length} TODO item for user ${userId} in ${todosTable}`);

    return items;
};

export const getTodoItem = async (todoId, userId) => {
    logger.info(`Get TODO item id ${todoId}, ${userId} from ${todosTable}`)
    const docClient = createDynamodbClient();
    const result = await docClient.query({
        TableName: todosTable,
        KeyConditionExpression: 'userId = :userId and todoId = :todoId',
        ExpressionAttributeValues: {
            ':userId': userId,
            ':todoId': todoId
        }
    }).promise();
    logger.info(`Result: ${JSON.stringify(result)}`);
    const item = result.Items[0];

    return item;
};

export const createTodoItem = async (todoItem) => {
    logger.info(`Create TODO item: ${todoItem.todoId} into ${todosTable}`);
    const docClient = createDynamodbClient();
    const response = await docClient.put({
        TableName: todosTable,
        Item: todoItem,
    }).promise();
    logger.info(`Create result: ${JSON.stringify(response)}`);
};

export const updateTodoItem = async (todoId, todoUpdate) => {
    logger.info(`Update TODO item: ${todoId} in ${todosTable}`);
    const docClient = createDynamodbClient();
    await docClient.update({
        TableName: todosTable,
        Key: { todoId },
        UpdateExpression: 'set #name = :name, dueDate = :dueDate, done = :done',
        ExpressionAttributeNames: {
            "#name": "name"
        },
        ExpressionAttributeValues: {
            ":name": todoUpdate.name,
            ":dueDate": todoUpdate.dueDate,
            ":done": todoUpdate.done
        }
    }).promise();
};

export const deleteTodo = async (todoId, userId) => {
    logger.info(`Delete TODO item: ${todoId}, ${userId} from ${todosTable}`);
    const docClient = createDynamodbClient();
    await docClient.delete({
        TableName: todosTable,
        Key: { userId, todoId }
    }).promise();
};

export const updateAttachmentUrl = async (userId, todoId, attachmentUrl) => {
    logger.info(`Update attachment URL for TODO item: ${todoId} in ${todosTable}`);
    const docClient = createDynamodbClient();
    await docClient.update({
        TableName: todosTable,
        Key: {
            userId: userId,
            todoId: todoId
        },
        UpdateExpression: 'set #attachmentUrl = :attachmentUrl',
        ExpressionAttributeNames: {
            '#attachmentUrl': 'attachmentUrl'
        },
        ExpressionAttributeValues: {
            ':attachmentUrl': attachmentUrl
        },
        ReturnValues: 'ALL_NEW'
    }).promise();
};