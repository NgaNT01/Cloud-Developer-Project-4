import 'source-map-support/register'
import * as AWS from 'aws-sdk'

const AWSXRay = require('aws-xray-sdk');
const XAWS = AWSXRay.captureAWS(AWS);
const s3Client = new XAWS.S3({ signatureVersion: 'v4' });
const s3BucketName = process.env.ATTACHMENT_S3_BUCKET;
const signedUrlExpiration = process.env.SIGNED_URL_EXPIRATION;

export const getAttachmentUrl = async (attachmentId) => {
    const attachmentUrl = `https://${s3BucketName}.s3.amazonaws.com/${attachmentId}`;
    return attachmentUrl;
};

export const getUploadUrl = async (attachmentId) => {
    const uploadUrl = s3Client.getSignedUrl('putObject', {
        Bucket: s3BucketName,
        Key: attachmentId,
        Expires: Number(signedUrlExpiration)
    });

    return uploadUrl;
};