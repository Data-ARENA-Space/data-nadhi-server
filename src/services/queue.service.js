const {generateMessageId} = require('./crypto.service');
const { getProcessorId } = require('./entities.service');
const { Client, Connection } = require('@temporalio/client');

const pushToTemporal = async (workflowId, taskQueue, log_data) => {
    const connection = await Connection.connect({ 
      address: 'datanadhi-temporal:7233'
    });

    // Create a client using the connection
    const client = new Client({ 
      connection
    });

    client.workflow.start('MainWorkflow', {
        args: [log_data],
        taskQueue: taskQueue,
        workflowId: workflowId,
    });
}

const enqueue = async (orgId, projectId, pipelineId, log_data) => {
    const processorId = await getProcessorId(orgId, projectId, pipelineId);
    const messageId = generateMessageId(pipelineId, log_data.trace_id || 'no-trace');
    const workflowId = ["log_process", orgId, projectId, pipelineId, messageId].join("-");

    pushToTemporal(workflowId, 
      processorId, 
      { "metadata": {
        pipeline_id: pipelineId,
        project_id: projectId,
        organisation_id: orgId
      }, log_data});

    console.log('Queue publish completed');
}

module.exports = { enqueue };