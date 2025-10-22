const {generateMessageId} = require('./crypto.service');
const { getProcessorId } = require('./entities.service');
const { Client, Connection } = require('@temporalio/client');
const { getLogger } = require('../utils/context.util');

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

const enqueue = async (orgId, projectId, pipelineId, log_data, { logger } = {}) => {
    const lg = logger || getLogger();
    const processorId = await getProcessorId(orgId, projectId, pipelineId);
    const messageId = generateMessageId(pipelineId, log_data.trace_id || log_data.traceId || 'no-trace');
    const workflowId = ["log_process", orgId, projectId, pipelineId, messageId].join("-");

    // await pushToTemporal(
    //   workflowId,
    //   processorId,
    //   {
    //     metadata: {
    //       pipelineId,
    //       projectId,
    //       organisationId: orgId
    //     },
    //     log_data
    //   }
    // );

    lg.info(
      'Queue publish completed',
      { workflowId, taskQueue: processorId },
      {
        organisationId: orgId,
        projectId,
        pipelineId,
        traceId: (log_data && (log_data.traceId || log_data.trace_id)) || null,
        logData: log_data,
      }
    );
    return workflowId;
}

module.exports = { enqueue };
