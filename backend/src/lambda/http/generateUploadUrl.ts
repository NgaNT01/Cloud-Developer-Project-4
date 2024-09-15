import 'source-map-support/register'
import { generateUploadUrl, updateTodoAttachmentUrl } from "../../businessLogic/todos";
import { createLogger } from "../../utils/logger";
import { getUserId } from "../utils";
import * as uuid from 'uuid'

const logger = createLogger('generateUploadUrl');

export const handler = async (event) => {
  logger.info(`Generate upload URL: ${JSON.stringify(event)}`);

  const todoId = event.pathParameters.todoId;
  if (!todoId) {
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify('Missing TODO ID')
    };
  }

  const userId = getUserId(event);
  if (!userId) {
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify('Missing User ID')
    };
  }

  const attachmentId = uuid.v4();

  const url = await generateUploadUrl(attachmentId);

  await updateTodoAttachmentUrl(userId, todoId, attachmentId);

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify({
      uploadUrl: url
    })
  }
};