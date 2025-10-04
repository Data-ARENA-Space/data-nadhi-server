const {generateMessageId} = require('./crypto.service');
const { Queue, MinioStorage } = require('data-nadhi-queue');
const { Pool } = require('pg');
const {getQueueCredentials} = require('./projects.service');

const getFileStorage = (fileStorage) => {
    if (fileStorage.type == "minio") {
        const { host, port, accessKey, secretKey, useSSL } = fileStorage.creds;
        return new MinioStorage(host, port, accessKey, secretKey, 'data-nadhi-queue', useSSL);
    }
    throw new Error(`Unsupported file storage type ${fileStorage.type}`);
}

const getDbPool = (db) => {
    if (db.type=="pg") {
        const { host, port, user, password, database } = db.creds;
        return new Pool({
            host,
            port,
            user,
            password,
            database
        });
    }
    throw new Error(`Unsupported database type ${db.type}`);
}

const getQueue = (queueCreds) => {
    const minioClient = getFileStorage(queueCreds.fileStorage);
    const dbPool = getDbPool(queueCreds.database);
    return new Queue(dbPool, minioClient);
}

const enqueue = async (orgId, projectId, pipelineId, log_data) => {
    const messageId = generateMessageId(pipelineId, log_data.trace_id || 'no-trace');
    const filePath = [orgId, projectId, pipelineId].join("/");
    console.log('Generated filePath:', filePath);
    
    const queueCreds = await getQueueCredentials(orgId);
    const queue = getQueue(queueCreds);
    
    console.log('About to call queue.publish with:', {
        messageId,
        dataSize: JSON.stringify(log_data).length,
        filePath
    });
    
    await queue.publish(messageId, Buffer.from(JSON.stringify(log_data)), filePath);
    console.log('Queue publish completed');
}

module.exports = { enqueue };