const { getProcessorId } = require('./entities.service');
const { Client, Connection, ValueError } = require('@temporalio/client');
const { getLogger } = require('../utils/context.util');
const minioService = require('./minio.service');

const pushToTemporal = async (workflowId, taskQueue, input) => {
    const connection = await Connection.connect({ 
      address: 'datanadhi-temporal:7233'
    });

    const client = new Client({ connection });

    await client.workflow.start('MainWorkflow', {
        args: [input],
        taskQueue: taskQueue,
        workflowId: workflowId,
    });
}

const enqueue = async (orgId, projectId, pipelineId, messageId, log_data, { logger } = {}) => {
    const lg = logger || getLogger();
    
    try {
        const processorId = await getProcessorId(orgId, projectId, pipelineId);
        const workflowId = ["log_process", orgId, projectId, pipelineId, messageId].join("-");

        // Add messageId to log_data for propagation to Temporal worker
        log_data = { ...log_data, messageId };

        metadata = {
            pipelineId,
            projectId,
            organisationId: orgId,
            messageId,
        }

        await pushToTemporal( workflowId, processorId, { metadata, log_data } );

        lg.info(
          'Queue publish completed',
          { workflowId, messageId, taskQueue: processorId },
          {
            organisationId: orgId,
            projectId,
            pipelineId,
            messageId,
            logData: log_data,
          }
        );
        return { workflowId, messageId };
    } catch (err) {
        // Build failure data
        const failureData = {
            timestamp: new Date().toISOString(),
            organisationId: orgId,
            projectId: projectId,
            pipelineId: pipelineId,
            messageId: messageId,
            originalInput: log_data,
            currentInput: null,
            error: {
                message: err.message,
                type: err.name || 'Error',
                stack: err.stack,
                description: 'Failed to enqueue message to Temporal'
            }
        };

        // Upload to MinIO
        if (orgId && projectId && pipelineId && messageId) {
            try {
                const objectPath = `${orgId}/${projectId}/${pipelineId}/${messageId}/enqueue.json`;
                const success = await minioService.uploadJson(objectPath, failureData);
                
                if (success) {
                    lg.error('Enqueue failed - Logged to MinIO', { error: err.message, messageId, minio_path: objectPath });
                } else {
                    lg.error('Enqueue failed - Failed to log to MinIO', { error: err.message, messageId });
                }
            } catch (minioErr) {
                lg.error('Enqueue failed - MinIO logging error', { error: err.message, messageId, minio_error: minioErr.message });
            }
        } else {
            lg.error('Enqueue failed - Missing required IDs for MinIO logging', { error: err.message, messageId });
        }
    }
}

module.exports = { enqueue };
